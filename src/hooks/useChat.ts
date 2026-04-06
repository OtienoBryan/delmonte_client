import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import axios from 'axios';
import { API_BASE_URL, SOCKET_URL } from '../config/api';

interface ChatRoom {
  id: number;
  name: string | null;
  is_group: boolean;
  created_by: number;
  created_at: string;
}

interface Message {
  id?: number;
  room_id: number;
  sender_id: number;
  sender_name?: string;
  message: string;
  sent_at?: string;
  is_read?: boolean;
}

interface Staff {
  id: number;
  name: string;
}

// Custom hook for chat rooms
export const useChatRooms = () => {
  return useQuery({
    queryKey: ['chat-rooms'],
    queryFn: async (): Promise<ChatRoom[]> => {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/chat/my-rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchIntervalInBackground: true,
  });
};

// Custom hook for messages in a specific room
export const useMessages = (roomId: number | null) => {
  return useQuery({
    queryKey: ['messages', roomId],
    queryFn: async (): Promise<Message[]> => {
      if (!roomId) return [];
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/chat/rooms/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!roomId,
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true,
  });
};

// Custom hook for staff list
export const useStaff = () => {
  return useQuery({
    queryKey: ['staff'],
    queryFn: async (): Promise<Staff[]> => {
      const res = await axios.get(`${API_BASE_URL}/staff`, { withCredentials: true });
      return res.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Custom hook for room members
export const useRoomMembers = (roomId: number | null) => {
  return useQuery({
    queryKey: ['room-members', roomId],
    queryFn: async (): Promise<Staff[]> => {
      if (!roomId) return [];
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/chat/rooms/${roomId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.members || [];
    },
    enabled: !!roomId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Custom hook for sending messages
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ roomId, message, sender_id, sender_name }: { 
      roomId: number; 
      message: string; 
      sender_id?: number; 
      sender_name?: string; 
    }) => {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE_URL}/chat/rooms/${roomId}/messages`,
        { roomId, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onMutate: async ({ roomId, message, sender_id, sender_name }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['messages', roomId] });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(['messages', roomId]);

      // Optimistically update to the new value
      if (sender_id && sender_name) {
        const optimisticMessage = {
          id: Date.now(), // Temporary ID
          room_id: roomId,
          sender_id,
          sender_name,
          message,
          sent_at: new Date().toISOString(),
          is_read: false,
        };

        queryClient.setQueryData(['messages', roomId], (old: Message[] | undefined) => {
          if (!old) return [optimisticMessage];
          return [...old, optimisticMessage];
        });
      }

      // Return a context object with the snapshotted value
      return { previousMessages };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', variables.roomId], context.previousMessages);
      }
      console.error('❌ Failed to send message:', err);
    },
    onSuccess: (data, variables) => {
      console.log('✅ Message sent successfully:', data);
      // Invalidate messages to ensure fresh data
      if (data.room_id) {
        queryClient.invalidateQueries({ queryKey: ['messages', data.room_id] });
      }
    },
  });
};

// Custom hook for creating group chat
export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, memberIds }: { name: string; memberIds: number[] }) => {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE_URL}/chat/rooms`,
        { name, is_group: true, memberIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      // Invalidate and refetch chat rooms
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    },
  });
};

// Custom hook for creating private chat (direct message)
export const useCreatePrivateChat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ memberId }: { memberId: number }) => {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE_URL}/chat/rooms`,
        { name: null, is_group: false, memberIds: [memberId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      // Invalidate and refetch chat rooms
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    },
  });
};

// Custom hook for removing a member from a room
export const useRemoveMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ roomId, staffId }: { roomId: number; staffId: number }) => {
      const token = localStorage.getItem('token');
      const res = await axios.delete(
        `${API_BASE_URL}/chat/rooms/${roomId}/members`,
        {
          data: { roomId, staffId },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return res.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate room members to refresh the list
      queryClient.invalidateQueries({ queryKey: ['room-members', variables.roomId] });
      // Also invalidate rooms in case member count changes
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    },
  });
};

// Custom hook for deleting a room (group chat only)
export const useDeleteRoom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (roomId: number) => {
      const token = localStorage.getItem('token');
      const res = await axios.delete(
        `${API_BASE_URL}/chat/rooms/${roomId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onSuccess: (data, variables) => {
      // Remove the room from cache
      queryClient.setQueryData(['chat-rooms'], (oldRooms: ChatRoom[] | undefined) => {
        if (!oldRooms) return oldRooms;
        return oldRooms.filter(room => room.id !== variables);
      });
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['messages', variables] });
      queryClient.invalidateQueries({ queryKey: ['room-members', variables] });
      console.log(`✅ Room ${variables} deleted from cache`);
    },
    onError: (error) => {
      console.error('❌ Failed to delete room:', error);
    },
  });
};

// Custom hook for editing messages
export const useEditMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ messageId, message }: { messageId: number; message: string }) => {
      const token = localStorage.getItem('token');
      const res = await axios.patch(
        `${API_BASE_URL}/chat/messages/${messageId}`,
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onSuccess: (data, variables) => {
      // Update the message in the cache optimistically using room_id from response
      if (data.room_id) {
        queryClient.setQueryData(['messages', data.room_id], (oldMessages: Message[] | undefined) => {
          if (!oldMessages) return oldMessages;
          return oldMessages.map(msg => 
            msg.id === variables.messageId 
              ? { ...msg, message: variables.message }
              : msg
          );
        });
        console.log(`✅ Message ${variables.messageId} updated in cache for room ${data.room_id}`);
      }
    },
    onError: (error) => {
      console.error('❌ Failed to edit message:', error);
    },
  });
};

// Custom hook for deleting messages
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (messageId: number) => {
      const token = localStorage.getItem('token');
      const res = await axios.delete(
        `${API_BASE_URL}/chat/messages/${messageId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onSuccess: (data, variables) => {
      // Remove the message from the cache optimistically using room_id from response
      if (data.room_id) {
        queryClient.setQueryData(['messages', data.room_id], (oldMessages: Message[] | undefined) => {
          if (!oldMessages) return oldMessages;
          return oldMessages.filter(msg => msg.id !== variables);
        });
        console.log(`✅ Message ${variables} deleted from cache for room ${data.room_id}`);
      }
    },
    onError: (error) => {
      console.error('❌ Failed to delete message:', error);
    },
  });
};

// Custom hook for real-time socket connection
export const useSocket = (userId: number | undefined) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Listen for new messages
    newSocket.on('newMessage', (message: Message) => {
      console.log('📨 New message received:', message);
      
      // Update the messages cache for the specific room
      queryClient.setQueryData(['messages', message.room_id], (oldMessages: Message[] | undefined) => {
        if (!oldMessages) return [message];
        
        // Check if message already exists to avoid duplicates
        // Check by both ID and content to be more thorough
        const existingMessageIndex = oldMessages.findIndex(msg => 
          msg.id === message.id || 
          (msg.message === message.message && 
           msg.sender_id === message.sender_id && 
           Math.abs(new Date(msg.sent_at || '').getTime() - new Date(message.sent_at || '').getTime()) < 1000)
        );
        
        if (existingMessageIndex !== -1) {
          // Replace the optimistic message with the real one
          const updatedMessages = [...oldMessages];
          updatedMessages[existingMessageIndex] = message;
          console.log('🔄 Replacing optimistic message with real message:', message.id);
          return updatedMessages;
        }
        
        return [...oldMessages, message];
      });

      // Invalidate rooms to update unread counts
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
      
      // Trigger unread count recalculation for the room
      // This will be handled by useUnreadCounts watching readMessages state
      console.log(`📊 New message in room ${message.room_id} - unread count will update`);
    });

    // Listen for edited messages
    newSocket.on('messageEdited', (data: { messageId: number; message: string; room_id: number }) => {
      console.log('✏️  Message edited:', data);
      
      queryClient.setQueryData(['messages', data.room_id], (oldMessages: Message[] | undefined) => {
        if (!oldMessages) return oldMessages;
        return oldMessages.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, message: data.message }
            : msg
        );
      });
    });

    // Listen for deleted messages
    newSocket.on('messageDeleted', (data: { messageId: number; room_id: number }) => {
      console.log('🗑️  Message deleted:', data);
      
      queryClient.setQueryData(['messages', data.room_id], (oldMessages: Message[] | undefined) => {
        if (!oldMessages) return oldMessages;
        return oldMessages.filter(msg => msg.id !== data.messageId);
      });
    });

    // Listen for room joined confirmation
    newSocket.on('roomJoined', (data: { roomId: number; success: boolean }) => {
      console.log('✅ Room joined:', data.roomId);
    });

    // Listen for message sent confirmation
    newSocket.on('messageSent', (data: { messageId: number; success: boolean }) => {
      console.log('✅ Message sent confirmation:', data.messageId);
    });

    // Listen for errors
    newSocket.on('messageError', (data: { error: string }) => {
      console.error('❌ Message error:', data.error);
    });

    newSocket.on('editError', (data: { error: string }) => {
      console.error('❌ Edit error:', data.error);
    });

    newSocket.on('deleteError', (data: { error: string }) => {
      console.error('❌ Delete error:', data.error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      setSocket(null);
      setIsConnected(false);
    };
  }, [userId, queryClient]);

  const joinRoom = (roomId: number) => {
    if (socket) {
      socket.emit('joinRoom', roomId);
    }
  };

  const leaveRoom = (roomId: number) => {
    if (socket) {
      socket.emit('leaveRoom', roomId);
    }
  };

  return {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
  };
};

// Custom hook for read message tracking
export const useReadMessages = (currentUserId?: number) => {
  const [readMessages, setReadMessages] = useState<{ [messageId: number]: boolean }>({});
  const [lastReadTimestamps, setLastReadTimestamps] = useState<{ [roomId: number]: string }>({});
  const { data: rooms } = useChatRooms();

  // Initialize last read timestamps when rooms are loaded
  useEffect(() => {
    if (rooms && rooms.length > 0) {
      const newLastReadTimestamps = { ...lastReadTimestamps };
      let hasChanges = false;
      
      rooms.forEach(room => {
        if (!newLastReadTimestamps[room.id]) {
          newLastReadTimestamps[room.id] = room.created_at;
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        setLastReadTimestamps(newLastReadTimestamps);
      }
    }
  }, [rooms]);

  // Mark a specific message as read
  const markMessageAsRead = async (messageId: number) => {
    console.log('✅ Marking message as read:', messageId);
    setReadMessages(prev => {
      if (prev[messageId]) {
        // Already marked as read, no need to update
        return prev;
      }
      const newState = { ...prev, [messageId]: true };
      console.log('📝 Updated read messages state for message:', messageId);
      return newState;
    });
    
    // Send read receipt to server (optional - server might not have this endpoint)
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/chat/messages/${messageId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('✅ Read receipt sent to server');
    } catch (error) {
      // Silently fail - this endpoint might not exist
      console.log('ℹ️  Read receipt endpoint not available (this is optional)');
    }
  };

  // Mark all messages in a room as read
  const markRoomMessagesAsRead = (roomId: number, messageIds: number[]) => {
    const now = new Date().toISOString();
    setLastReadTimestamps(prev => ({ ...prev, [roomId]: now }));
    
    setReadMessages(prev => {
      const newReadMessages = { ...prev };
      messageIds.forEach(id => {
        newReadMessages[id] = true;
      });
      return newReadMessages;
    });
  };

  // Check if a message is read
  const isMessageRead = (message: Message): boolean => {
    if (message.sender_id === currentUserId) return true; // Own messages are always "read"
    return readMessages[message.id!] || message.is_read || false;
  };

  // Get unread messages for a room
  const getUnreadMessages = (messages: Message[]): Message[] => {
    return messages.filter(msg => !isMessageRead(msg));
  };

  return {
    readMessages,
    lastReadTimestamps,
    markMessageAsRead,
    markRoomMessagesAsRead,
    isMessageRead,
    getUnreadMessages,
  };
};

// Custom hook for unread message counts
export const useUnreadCounts = (currentUserId?: number) => {
  const { data: rooms } = useChatRooms();
  const [unreadCounts, setUnreadCounts] = useState<{ [roomId: number]: number }>({});
  const { lastReadTimestamps, getUnreadMessages, markRoomMessagesAsRead, readMessages, isMessageRead } = useReadMessages(currentUserId);
  const queryClient = useQueryClient();

  // Calculate unread counts - reactive to messages and read status
  useEffect(() => {
    if (!rooms) return;

    const calculateUnreadCounts = () => {
      const newUnreadCounts: { [roomId: number]: number } = {};
      
      for (const room of rooms) {
        try {
          // Get messages from cache first (fast)
          const cachedMessages = queryClient.getQueryData<Message[]>(['messages', room.id]);
          
          if (cachedMessages && cachedMessages.length > 0) {
            // Use cached messages for instant calculation
            const unreadMessages = cachedMessages.filter(msg => {
              // Only count messages from other users
              if (msg.sender_id === currentUserId) return false;
              // Check if message is read using readMessages state directly
              return !readMessages[msg.id!] && !msg.is_read;
            });
            
            newUnreadCounts[room.id] = unreadMessages.length;
          } else {
            // If no cached messages, set to 0 (will be calculated when messages load)
            newUnreadCounts[room.id] = 0;
          }
        } catch (error) {
          console.error(`Error calculating unread count for room ${room.id}:`, error);
          newUnreadCounts[room.id] = 0;
        }
      }
      
      setUnreadCounts(newUnreadCounts);
    };

    calculateUnreadCounts();
  }, [rooms, readMessages, currentUserId, queryClient]);

  // Update unread count for a specific room when messages change
  const updateRoomUnreadCount = (roomId: number) => {
    const cachedMessages = queryClient.getQueryData<Message[]>(['messages', roomId]);
    if (cachedMessages) {
      const unreadMessages = cachedMessages.filter(msg => {
        // Only count messages from other users
        if (msg.sender_id === currentUserId) return false;
        // Check if message is read using readMessages state directly
        return !readMessages[msg.id!] && !msg.is_read;
      });
      
      setUnreadCounts(prev => ({
        ...prev,
        [roomId]: unreadMessages.length
      }));
      
      console.log(`📊 Updated unread count for room ${roomId}: ${unreadMessages.length}`);
    }
  };

  const markRoomAsRead = (roomId: number, messageIds?: number[]) => {
    setUnreadCounts(prev => ({ ...prev, [roomId]: 0 }));
    
    // If message IDs are provided, mark them as read using the read messages hook
    if (messageIds && messageIds.length > 0) {
      markRoomMessagesAsRead(roomId, messageIds);
      // Update count immediately
      updateRoomUnreadCount(roomId);
    }
  };

  const getTotalUnreadCount = (): number => {
    return Object.values(unreadCounts).reduce((total, count) => total + count, 0);
  };

  return {
    unreadCounts,
    lastReadTimestamps,
    markRoomAsRead,
    getTotalUnreadCount,
    updateRoomUnreadCount, // Export for external updates
  };
};
