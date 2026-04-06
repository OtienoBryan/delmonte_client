import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Pencil, Trash2, Plus, ChevronLeft, Check, X, Wifi, WifiOff, RefreshCw, Send, Users, MessageCircle } from 'lucide-react';
import { DateTime } from 'luxon';
import {
  useChatRooms,
  useMessages,
  useStaff,
  useRoomMembers,
  useSendMessage,
  useCreateGroup,
  useCreatePrivateChat,
  useEditMessage,
  useDeleteMessage,
  useRemoveMember,
  useDeleteRoom,
  useSocket,
  useUnreadCounts,
  useReadMessages,
} from '../hooks/useChat';

interface ChatRoom {
  id: number;
  name: string | null;
  is_group: boolean;
  created_by: number;
  created_at: string;
  other_member_name?: string | null; // For private chats, the name of the other person
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

// Utility function to format time consistently using Luxon
const formatTime = (timeString: string): string => {
  if (!timeString) return 'N/A';
  
  try {
    let dt: DateTime;
    
    if (timeString.includes('T') && timeString.includes('Z')) {
      dt = DateTime.fromISO(timeString, { zone: 'utc' });
    } else if (timeString.includes(' ')) {
      dt = DateTime.fromFormat(timeString, 'yyyy-MM-dd HH:mm:ss.SSS', { zone: 'utc' });
      if (!dt.isValid) {
        dt = DateTime.fromFormat(timeString, 'yyyy-MM-dd HH:mm:ss', { zone: 'utc' });
      }
    } else {
      dt = DateTime.fromISO(timeString, { zone: 'utc' });
    }
    
    if (!dt.isValid) {
      console.error('Invalid date:', dt.invalidReason, dt.invalidExplanation);
      return 'N/A';
    }
    
    return dt.toFormat('MMM dd, yyyy, HH:mm');
  } catch (error) {
    console.error('Error formatting time with Luxon:', error);
    return 'N/A';
  }
};

// Utility function to format time in a more compact way for chat messages
const formatMessageTime = (timeString: string): string => {
  if (!timeString) return 'N/A';
  
  try {
    let dt: DateTime;
    
    if (timeString.includes('T') && timeString.includes('Z')) {
      dt = DateTime.fromISO(timeString, { zone: 'utc' });
    } else if (timeString.includes(' ')) {
      dt = DateTime.fromFormat(timeString, 'yyyy-MM-dd HH:mm:ss.SSS', { zone: 'utc' });
      if (!dt.isValid) {
        dt = DateTime.fromFormat(timeString, 'yyyy-MM-dd HH:mm:ss', { zone: 'utc' });
      }
    } else {
      dt = DateTime.fromISO(timeString, { zone: 'utc' });
    }
    
    if (!dt.isValid) {
      return 'N/A';
    }
    
    const now = DateTime.now();
    const diffInDays = now.diff(dt, 'days').days;
    
    let formatted: string;
    
    if (diffInDays < 1) {
      formatted = dt.toFormat('HH:mm');
    } else if (diffInDays < 2) {
      formatted = `Yesterday, ${dt.toFormat('HH:mm')}`;
    } else if (diffInDays < 7) {
      formatted = dt.toFormat('EEE, HH:mm');
    } else {
      formatted = dt.toFormat('MMM dd, HH:mm');
    }
    
    return formatted;
  } catch (error) {
    console.error('Error formatting message time with Luxon:', error);
    return 'N/A';
  }
};

const InstantChatPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [showStaffList, setShowStaffList] = useState(false);
  
  // Mention functionality state
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const messageInputRef = useRef<HTMLInputElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  // Use React Query hooks
  const { data: rooms = [], isLoading: roomsLoading, error: roomsError, refetch: refetchRooms } = useChatRooms();
  const { data: messages = [], isLoading: messagesLoading, error: messagesError, refetch: refetchMessages } = useMessages(selectedRoom?.id || null);
  const { data: allStaff = [], error: staffError } = useStaff();
  const { data: roomMembers = [], isLoading: membersLoading } = useRoomMembers(selectedRoom?.id || null);
  const { unreadCounts, markRoomAsRead, getTotalUnreadCount, updateRoomUnreadCount } = useUnreadCounts(user?.id);
  const { isMessageRead, markMessageAsRead, markRoomMessagesAsRead } = useReadMessages(user?.id);
  
  // Socket connection for real-time updates (WebSocket-based)
  const { isConnected, joinRoom, leaveRoom } = useSocket(user?.id);
  
  // Mutations
  const sendMessageMutation = useSendMessage();
  const createGroupMutation = useCreateGroup();
  const createPrivateChatMutation = useCreatePrivateChat();
  const editMessageMutation = useEditMessage();
  const deleteMessageMutation = useDeleteMessage();
  const removeMemberMutation = useRemoveMember();
  const deleteRoomMutation = useDeleteRoom();

  // Handle room selection
  const handleRoomSelect = (room: ChatRoom) => {
    if (selectedRoom) {
      leaveRoom(selectedRoom.id);
    }
    setSelectedRoom(room);
    joinRoom(room.id);
    
    // Mark all messages in the room as read when selecting it
    // This will be handled by the useEffect when messages load
  };

  // Handle retry connection
  const handleRetryConnection = async () => {
    setIsRetrying(true);
    try {
      await refetchRooms();
      await refetchMessages();
      setToast('Connection restored!');
      setTimeout(() => setToast(null), 2000);
    } catch (error) {
      setToast('Failed to restore connection. Please try again.');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsRetrying(false);
    }
  };

  // Mark all rooms as read
  const markAllRoomsAsRead = () => {
    rooms.forEach((room: ChatRoom) => {
      markRoomAsRead(room.id);
    });
    setToast('All messages marked as read!');
    setTimeout(() => setToast(null), 2000);
  };

  // Mark current room as read with all message IDs
  const markCurrentRoomAsRead = () => {
    if (selectedRoom && messages.length > 0) {
      // Only mark messages from other users as read
      const messageIds = messages
        .filter(msg => msg.sender_id !== user?.id && msg.id)
        .map(msg => msg.id!)
        .filter(id => id);
        
      if (messageIds.length > 0) {
        markRoomMessagesAsRead(selectedRoom.id, messageIds);
        markRoomAsRead(selectedRoom.id, messageIds);
        // Update unread count immediately
        updateRoomUnreadCount(selectedRoom.id);
        setToast('Messages marked as read!');
        setTimeout(() => setToast(null), 2000);
      } else {
        setToast('No unread messages!');
        setTimeout(() => setToast(null), 2000);
      }
    }
  };

  // Track the last processed message count to avoid unnecessary updates
  const lastProcessedCountRef = useRef<number>(0);
  const lastRoomIdRef = useRef<number | null>(null);

  // Scroll to bottom on new message and mark messages as read when they come into view
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Only mark as read when room changes or new messages arrive (not on every render)
    if (selectedRoom && messages.length > 0) {
      const roomChanged = lastRoomIdRef.current !== selectedRoom.id;
      const newMessages = messages.length > lastProcessedCountRef.current;
      
      // Only process if room changed or we have new messages
      if (roomChanged || newMessages) {
        // Only mark messages from other users as read
        const messageIds = messages
          .filter(msg => msg.sender_id !== user?.id && msg.id)
          .map(msg => msg.id!)
          .filter(id => id);
          
        if (messageIds.length > 0) {
          markRoomMessagesAsRead(selectedRoom.id, messageIds);
          // Update unread count immediately
          updateRoomUnreadCount(selectedRoom.id);
          lastProcessedCountRef.current = messages.length;
          lastRoomIdRef.current = selectedRoom.id;
        }
      }
    } else if (!selectedRoom) {
      // Reset when no room is selected
      lastProcessedCountRef.current = 0;
      lastRoomIdRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, selectedRoom?.id, user?.id]);

  // Mark messages as read when they come into view and update unread count
  useEffect(() => {
    if (!messages.length || !selectedRoom) return;

    const messageElements = document.querySelectorAll('[data-message-id]');
    
    const observer = new IntersectionObserver(
      (entries) => {
        let hasNewReadMessages = false;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = parseInt(entry.target.getAttribute('data-message-id') || '0');
            if (messageId > 0) {
              const message = messages.find(m => m.id === messageId);
              // Only mark as read if it's not from current user and not already read
              if (message && message.sender_id !== user?.id && !isMessageRead(message)) {
                markMessageAsRead(messageId);
                hasNewReadMessages = true;
              }
            }
          }
        });
        
        // Update unread count if any messages were marked as read
        if (hasNewReadMessages && selectedRoom) {
          setTimeout(() => {
            updateRoomUnreadCount(selectedRoom.id);
          }, 100);
        }
      },
      { threshold: 0.1 }
    );

    messageElements.forEach((el) => observer.observe(el));

    return () => {
      messageElements.forEach((el) => observer.unobserve(el));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, selectedRoom?.id, user?.id]);

  // Update localStorage with unread count for dashboard badge
  useEffect(() => {
    const totalUnread = Object.values(unreadCounts).reduce((total, count) => total + count, 0);
    localStorage.setItem('instant_chat_unread', totalUnread.toString());
  }, [unreadCounts]);

  // Show connection status notifications (only on state change, not repeatedly)
  const prevConnectedRef = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    // Only show toast if connection state actually changed
    if (prevConnectedRef.current !== undefined && prevConnectedRef.current !== isConnected) {
      if (isConnected) {
        setToast('Connected to instant chat server');
        setTimeout(() => setToast(null), 2000);
      } else {
        setToast('Disconnected from instant chat server');
        setTimeout(() => setToast(null), 3000);
      }
    }
    prevConnectedRef.current = isConnected;
  }, [isConnected]);

  // Get available users for mentions (room members or all staff)
  const getMentionableUsers = () => {
    if (selectedRoom && roomMembers.length > 0) {
      // Use room members, excluding current user
      return roomMembers.filter((member: any) => member.id !== user?.id);
    }
    // Fallback to all staff, excluding current user
    return allStaff.filter((staff: any) => staff.id !== user?.id);
  };

  // Filter users based on mention query
  const filteredMentionUsers = mentionQuery
    ? getMentionableUsers().filter((user: any) =>
        (user.name || '').toLowerCase().includes(mentionQuery.toLowerCase()) ||
        (user.username || '').toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : getMentionableUsers();

  // Handle message input change with @mention detection
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Check for @mention
    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if there's a space or newline after @ (meaning mention is complete)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        const query = textAfterAt.toLowerCase();
        setMentionQuery(query);
        
        // Calculate dropdown position relative to input
        if (messageInputRef.current) {
          const rect = messageInputRef.current.getBoundingClientRect();
          setMentionPosition({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
          });
        }
        
        setShowMentionDropdown(true);
        setSelectedMentionIndex(0);
        return;
      }
    }
    
    setShowMentionDropdown(false);
    setMentionQuery('');
  };

  // Close mention dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mentionDropdownRef.current &&
        !mentionDropdownRef.current.contains(event.target as Node) &&
        messageInputRef.current &&
        !messageInputRef.current.contains(event.target as Node)
      ) {
        setShowMentionDropdown(false);
        setMentionQuery('');
      }
    };

    if (showMentionDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMentionDropdown]);

  // Handle mention selection
  const handleMentionSelect = (selectedUser: any) => {
    if (!messageInputRef.current) return;

    const value = newMessage;
    const cursorPosition = messageInputRef.current.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      const textAfterCursor = value.substring(cursorPosition);
      
      // Get the username to insert
      const username = selectedUser.name || selectedUser.username || 'User';
      
      // Replace @query with @username
      const newText = 
        value.substring(0, lastAtIndex + 1) + 
        username +
        ' ' + 
        textAfterCursor;
      
      setNewMessage(newText);
      setShowMentionDropdown(false);
      setMentionQuery('');
      
      // Set cursor position after the mention
      setTimeout(() => {
        if (messageInputRef.current) {
          const newCursorPos = lastAtIndex + 1 + username.length + 1;
          messageInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          messageInputRef.current.focus();
        }
      }, 0);
    }
  };

  // Handle keyboard navigation in mention dropdown
  const handleMessageKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentionDropdown && filteredMentionUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => 
          prev < filteredMentionUsers.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleMentionSelect(filteredMentionUsers[selectedMentionIndex]);
      } else if (e.key === 'Escape') {
        setShowMentionDropdown(false);
        setMentionQuery('');
      }
    }
  };

  // Render message with highlighted mentions
  const renderMessageWithMentions = (message: string) => {
    // Match @mentions in the message (more flexible regex)
    const mentionRegex = /@([\w\s]+?)(?=\s|$|@|,|\.|!|\?)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = mentionRegex.exec(message)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(message.substring(lastIndex, match.index));
      }
      
      // Add highlighted mention
      const mentionText = match[0];
      parts.push(
        <span key={`mention-${keyIndex++}`} className="bg-blue-100 text-blue-800 font-semibold px-1 rounded">
          {mentionText}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < message.length) {
      parts.push(message.substring(lastIndex));
    }
    
    return parts.length > 0 ? <>{parts}</> : message;
  };

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom || !user) return;
    
    const messageText = newMessage.trim();
    setNewMessage('');
    setShowMentionDropdown(false);
    setMentionQuery('');
    
    try {
      await sendMessageMutation.mutateAsync({
        roomId: selectedRoom.id,
        message: messageText,
        sender_id: user.id,
        sender_name: user.username || 'You',
      });
      setToast('Message sent instantly!');
      setTimeout(() => setToast(null), 1500);
    } catch (error) {
      setToast('Failed to send message. Please try again.');
      setTimeout(() => setToast(null), 3000);
      setNewMessage(messageText); // Restore message on failure
    }
  };

  // Create group chat
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedStaff.length === 0) return;
    
    try {
      const res = await createGroupMutation.mutateAsync({
        name: groupName,
        memberIds: selectedStaff,
      });
      
      setShowCreateModal(false);
      setGroupName('');
      setSelectedStaff([]);
      
      const newRoomId = res.roomId;
      const newRoom = rooms.find((r: ChatRoom) => r.id === newRoomId);
      if (newRoom) {
        handleRoomSelect(newRoom);
      }
      
      setToast('Group chat created!');
      setTimeout(() => setToast(null), 2000);
    } catch (error) {
      setToast('Failed to create group chat. Please try again.');
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Start private chat with a staff member
  const handleStartPrivateChat = async (staffId: number) => {
    try {
      // Check if a private chat already exists with this staff member
      const existingRoom = rooms.find((room: ChatRoom) => 
        !room.is_group && roomMembers.some((member: any) => member.staff_id === staffId)
      );

      if (existingRoom) {
        // If chat exists, just open it
        handleRoomSelect(existingRoom);
        setShowStaffList(false);
        setSearchTerm('');
        return;
      }

      // Otherwise create a new chat
      const res = await createPrivateChatMutation.mutateAsync({
        memberId: staffId,
      });
      
      setShowStaffList(false);
      setSearchTerm('');
      
      // Refetch rooms to get the new room
      await refetchRooms();
      
      // Wait a bit for the rooms to update, then find and select the new room
      setTimeout(async () => {
        const updatedRooms = await refetchRooms();
        if (updatedRooms.data) {
          const newRoom = updatedRooms.data.find((r: ChatRoom) => r.id === res.roomId);
          if (newRoom) {
            handleRoomSelect(newRoom);
          }
        }
      }, 500);
      
      setToast('Chat opened!');
      setTimeout(() => setToast(null), 2000);
    } catch (error) {
      setToast('Failed to start chat. Please try again.');
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Edit message handler
  const handleEditMessage = (msg: Message) => {
    setEditingMessageId(msg.id!);
    setEditMessageText(msg.message);
  };

  const handleEditMessageSave = async (msg: Message) => {
    try {
      await editMessageMutation.mutateAsync({
        messageId: msg.id!,
        message: editMessageText,
      });
      setEditingMessageId(null);
      setEditMessageText('');
      setToast('Message updated!');
      setTimeout(() => setToast(null), 2000);
    } catch (error) {
      setToast('Failed to update message. Please try again.');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleEditMessageCancel = () => {
    setEditingMessageId(null);
    setEditMessageText('');
  };

  // Delete message handler
  const handleDeleteMessage = async (msg: Message) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await deleteMessageMutation.mutateAsync(msg.id!);
      setToast('Message deleted!');
      setTimeout(() => setToast(null), 2000);
    } catch (error) {
      setToast('Failed to delete message. Please try again.');
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Handle remove member
  const handleRemoveMember = async (memberId: number) => {
    if (!selectedRoom || !user) return;
    
    const member = roomMembers.find((m: any) => m.id === memberId);
    const memberName = member?.name || member?.username || 'this member';
    
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this group?`)) {
      return;
    }
    
    try {
      await removeMemberMutation.mutateAsync({
        roomId: selectedRoom.id,
        staffId: memberId,
      });
      setToast(`${memberName} removed from group`);
      setTimeout(() => setToast(null), 2000);
    } catch (error: any) {
      setToast(error.response?.data?.message || 'Failed to remove member');
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Check if current user can remove members (only group creator can remove)
  const canRemoveMembers = selectedRoom?.is_group && selectedRoom?.created_by === user?.id;

  // Check if current user can delete the group (creator or HR/executive)
  const isGroup = selectedRoom?.is_group === true || selectedRoom?.is_group === 1;
  const isCreator = selectedRoom?.created_by && user?.id && 
    (Number(selectedRoom.created_by) === Number(user.id) || 
     String(selectedRoom.created_by) === String(user.id));
  const isAuthorizedRole = user?.role && (
    user.role.toLowerCase() === 'hr' || 
    user.role.toLowerCase() === 'executive'
  );
  const canDeleteGroup = isGroup && (isCreator || isAuthorizedRole);

  // Handle delete group
  const handleDeleteGroup = async () => {
    if (!selectedRoom || !isGroup) {
      setToast('Only group chats can be deleted.');
      setTimeout(() => setToast(null), 2000);
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete the group "${selectedRoom.name || 'Group Chat'}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteRoomMutation.mutateAsync(selectedRoom.id);
      setSelectedRoom(null);
      setToast('Group deleted successfully!');
      setTimeout(() => setToast(null), 2000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete group. Please try again.';
      setToast(errorMessage);
      setTimeout(() => setToast(null), 3000);
      console.error('Delete group error:', error);
    }
  };

  // Helper function to get the other person's name for a private chat
  const getPrivateChatName = (room: ChatRoom): string => {
    if (room.is_group) {
      return room.name || 'Group Chat';
    }
    
    // Use the other_member_name from the backend if available
    if (room.other_member_name) {
      return room.other_member_name;
    }
    
    // Fallback: try to find from roomMembers if this is the selected room
    if (selectedRoom?.id === room.id && roomMembers.length > 0) {
      const otherMember = roomMembers.find((member: any) => 
        (member.id !== user?.id && member.staff_id !== user?.id) ||
        (String(member.id) !== String(user?.id) && String(member.staff_id) !== String(user?.id))
      );
      if (otherMember) {
        return otherMember.name || 'Unknown Staff';
      }
    }
    
    // Final fallback
    return 'Private Chat';
  };

  // Filter rooms based on search term (only when not showing staff list)
  const filteredRooms = !showStaffList ? rooms.filter((room: ChatRoom) => {
    const roomName = room.is_group ? (room.name || 'Group Chat') : getPrivateChatName(room);
    return roomName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           (room.is_group ? 'group chat' : 'private chat').includes(searchTerm.toLowerCase());
  }) : [];

  // Filter staff based on search term (only when showing staff list)
  const filteredStaff = showStaffList ? allStaff.filter((staff: any) => 
    staff.id !== user?.id &&
    (staff.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="flex h-[85vh] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-2xl overflow-hidden border border-indigo-200">
      {/* Sidebar: Room List */}
      <div className={`w-full md:w-80 bg-white border-r border-indigo-100 ${selectedRoom ? 'hidden md:block' : 'block'}`}>
        <div className="p-3 border-b border-indigo-100 bg-gradient-to-r from-blue-500 to-indigo-600">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">Instant Chat</h2>
              {getTotalUnreadCount() > 0 && (
                <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[24px] text-center font-semibold animate-pulse">
                  {getTotalUnreadCount()}
                </div>
              )}
              <div className="flex items-center gap-1" title={isConnected ? "Connected" : "Disconnected"}>
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-300 animate-pulse" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-300" />
                )}
              </div>
            </div>
            <div className="flex gap-1.5">
              <button 
                className="bg-white/20 text-white p-1.5 rounded-full hover:bg-white/30 transition-all disabled:opacity-50 backdrop-blur-sm"
                onClick={handleRetryConnection}
                disabled={isRetrying}
                title="Refresh messages"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              </button>
              {getTotalUnreadCount() > 0 && (
                <button 
                  className="bg-white/20 text-white p-1.5 rounded-full hover:bg-white/30 transition-all backdrop-blur-sm"
                  onClick={markAllRoomsAsRead}
                  title="Mark all as read"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
              <button 
                className={`text-white p-1.5 rounded-full transition-all backdrop-blur-sm ${showStaffList ? 'bg-white/40' : 'bg-white/20 hover:bg-white/30'}`}
                onClick={() => {
                  setShowStaffList(!showStaffList);
                  setSearchTerm('');
                }}
                title={showStaffList ? "Show chats" : "Find staff to chat"}
              >
                <Users size={16} />
              </button>
              <button 
                className="bg-white/20 text-white p-1.5 rounded-full hover:bg-white/30 transition-all backdrop-blur-sm"
                onClick={() => setShowCreateModal(true)}
                title="Create group"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder={showStaffList ? "Search staff..." : "Search chats..."}
              className="w-full p-1.5 pl-7 text-sm rounded-lg bg-white/90 backdrop-blur-sm border-none focus:ring-2 focus:ring-white shadow-sm text-gray-700 placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute left-2 top-2 h-3.5 w-3.5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        <div className="overflow-y-auto h-[calc(100%-110px)]">
          {showStaffList ? (
            // Staff list for starting new chats
            <>
              {staffError ? (
                <div className="p-3 text-center text-red-500">
                  <WifiOff className="w-5 h-5 mx-auto mb-1.5" />
                  <p className="text-xs">Error loading staff</p>
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="p-3 text-center text-gray-500">
                  <p className="text-xs">{searchTerm ? 'No staff found' : 'No staff available'}</p>
                </div>
              ) : (
                <div className="p-2">
                  {filteredStaff.map((staff: any) => (
                    <div
                      key={staff.id}
                      onClick={() => handleStartPrivateChat(staff.id)}
                      className="flex items-center p-2.5 mb-2 rounded-lg cursor-pointer transition-all hover:bg-indigo-50 border border-transparent hover:border-indigo-200 shadow-sm hover:shadow-md"
                    >
                      <div className="rounded-full w-10 h-10 flex items-center justify-center mr-3 bg-gradient-to-br from-blue-400 to-indigo-500 text-white font-semibold text-sm shadow-md">
                        {staff.name ? staff.name.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 truncate">
                          {staff.name || 'Unknown Staff'}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {staff.department || 'No department'}
                        </div>
                      </div>
                      <MessageCircle className="w-5 h-5 text-indigo-400" />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Regular chat list
            <>
              {roomsLoading ? (
                <div className="p-3 text-center text-gray-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1.5 text-indigo-500" />
                  <p className="text-xs">Loading rooms...</p>
                </div>
              ) : roomsError ? (
                <div className="p-3 text-center text-red-500">
                  <WifiOff className="w-5 h-5 mx-auto mb-1.5" />
                  <p className="text-xs mb-1.5">Failed to load rooms</p>
                  <button 
                    onClick={handleRetryConnection}
                    className="text-indigo-600 hover:underline text-xs font-medium"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="p-3 text-center text-gray-500">
                  <p className="text-xs">{searchTerm ? `No chats found matching "${searchTerm}"` : 'No chats yet. Click the Users icon to start chatting!'}</p>
                </div>
              ) : (
                filteredRooms.map((room: ChatRoom) => {
              const canDeleteThisRoom = room.is_group && (
                Number(room.created_by) === Number(user?.id) || 
                String(room.created_by) === String(user?.id) ||
                user?.role?.toLowerCase() === 'hr' || 
                user?.role?.toLowerCase() === 'executive'
              );
              
              const handleDeleteRoomFromList = async (e: React.MouseEvent) => {
                e.stopPropagation(); // Prevent room selection
                if (!window.confirm(`Are you sure you want to delete the group "${room.name || 'Group Chat'}"? This action cannot be undone.`)) {
                  return;
                }
                
                try {
                  await deleteRoomMutation.mutateAsync(room.id);
                  if (selectedRoom?.id === room.id) {
                    setSelectedRoom(null);
                  }
                  setToast('Group deleted successfully!');
                  setTimeout(() => setToast(null), 2000);
                } catch (error: any) {
                  const errorMessage = error.response?.data?.message || error.message || 'Failed to delete group. Please try again.';
                  setToast(errorMessage);
                  setTimeout(() => setToast(null), 3000);
                }
              };
              
              return (
                <div
                  key={room.id}
                  className={`p-2.5 flex items-center border-b border-gray-100 cursor-pointer hover:bg-indigo-50 transition-all group ${
                    selectedRoom?.id === room.id ? 'bg-indigo-100 border-l-4 border-l-indigo-500' : ''
                  }`}
                  onClick={() => handleRoomSelect(room)}
                >
                  <div className={`rounded-full w-10 h-10 flex items-center justify-center mr-2.5 font-semibold text-sm ${
                    room.is_group 
                      ? 'bg-gradient-to-br from-purple-400 to-pink-400 text-white' 
                      : 'bg-gradient-to-br from-blue-400 to-indigo-400 text-white'
                  }`}>
                    {room.is_group ? 'G' : 'P'}
                  </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-800 text-xs truncate">
                          {getPrivateChatName(room)}
                        </div>
                      <div className="flex items-center gap-1">
                        {unreadCounts[room.id] > 0 && (
                          <div className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center font-semibold ml-1">
                            {unreadCounts[room.id]}
                          </div>
                        )}
                        {room.is_group && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRoomFromList(e);
                            }}
                            disabled={deleteRoomMutation.isPending}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 text-red-600 transition-all disabled:opacity-50"
                            title="Delete group"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                      {room.is_group ? `${room.name ? 'Group' : 'Direct'} conversation` : 'Private conversation'}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {room.created_at && formatTime(room.created_at)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
            </>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex ${!selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        {selectedRoom ? (
          <div className="flex-1 flex flex-col">
            {/* Chat header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 flex items-center justify-between shadow-lg">
              <div className="flex items-center">
                <button 
                  className="md:hidden mr-2 text-white hover:text-indigo-100"
                  onClick={() => setSelectedRoom(null)}
                >
                  <ChevronLeft size={18} />
                </button>
                <div className={`rounded-full w-10 h-10 flex items-center justify-center mr-2.5 font-semibold text-sm ${
                  selectedRoom.is_group 
                    ? 'bg-gradient-to-br from-purple-400 to-pink-400 text-white' 
                    : 'bg-gradient-to-br from-blue-300 to-indigo-300 text-white'
                }`}>
                  {selectedRoom.is_group ? 'G' : 'P'}
                </div>
                <div>
                  <h2 className="font-semibold text-white text-sm">
                    {getPrivateChatName(selectedRoom)}
                  </h2>
                  <div className="text-[10px] text-indigo-100">
                    {unreadCounts[selectedRoom.id] > 0 
                      ? `${unreadCounts[selectedRoom.id]} new message${unreadCounts[selectedRoom.id] > 1 ? 's' : ''}` 
                      : 'All caught up'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {selectedRoom?.is_group && (
                  <button
                    onClick={handleDeleteGroup}
                    disabled={deleteRoomMutation.isPending}
                    className="bg-red-500/80 text-white p-2 rounded-lg hover:bg-red-600/80 transition-all backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    title={canDeleteGroup ? "Delete group" : "Delete group (permission will be checked)"}
                  >
                    {deleteRoomMutation.isPending ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                )}
                <button
                  onClick={() => setShowMembersPanel(!showMembersPanel)}
                  className={`bg-white/20 text-white p-2 rounded-lg hover:bg-white/30 transition-all backdrop-blur-sm ${showMembersPanel ? 'bg-white/30' : ''}`}
                  title={showMembersPanel ? "Hide members" : "Show members"}
                >
                  <Users size={16} />
                </button>
                {unreadCounts[selectedRoom.id] > 0 && (
                  <button
                    onClick={markCurrentRoomAsRead}
                    className="bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white/30 transition-all backdrop-blur-sm"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>

            {/* Messages area and Members panel container */}
            <div className="flex-1 flex overflow-hidden">
              {/* Messages area */}
              <div className={`flex-1 flex flex-col ${showMembersPanel ? 'hidden md:flex' : 'flex'}`}>
                <div className="flex-1 overflow-y-auto p-3 bg-gradient-to-br from-blue-50 to-indigo-50">
                  {messagesLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <RefreshCw className="w-6 h-6 animate-spin mb-2 text-indigo-500" />
                      <div className="text-xs">Loading messages...</div>
                    </div>
                  ) : messagesError ? (
                    <div className="flex flex-col items-center justify-center h-full text-red-500">
                      <WifiOff className="w-6 h-6 mb-2" />
                      <div className="mb-2 text-xs">Failed to load messages</div>
                      <button 
                        onClick={handleRetryConnection}
                        className="text-indigo-600 hover:underline text-xs font-medium"
                      >
                        Retry
                      </button>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <div className="mb-2 text-sm font-medium">No messages yet</div>
                      <div className="text-xs">Send a message to start the conversation</div>
                    </div>
                  ) : (
                    messages.map((msg: Message, idx: number) => {
                      let canEditOrDelete = false;
                      if (msg.sender_id === user?.id) {
                        canEditOrDelete = messages.slice(idx + 1).every((m: Message) => m.sender_id === user?.id);
                      }
                      return (
                        <div 
                          key={idx} 
                          className={`mb-3 flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                          data-message-id={msg.id}
                        >
                          <div className={`max-w-xs lg:max-w-md relative ${msg.sender_id === user?.id ? 'ml-auto' : 'mr-auto'}`}>
                            <div className={`px-3 py-2 rounded-xl shadow-lg ${
                              msg.sender_id === user?.id 
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-sm' 
                                : 'bg-white text-gray-800 rounded-bl-sm'
                            } ${!isMessageRead(msg) && msg.sender_id !== user?.id ? 'ring-2 ring-indigo-300' : ''}`}>
                              {msg.sender_id !== user?.id && (
                                <div className="text-[10px] font-semibold mb-1 flex items-center gap-1.5 text-indigo-600">
                                  <span>{msg.sender_name || 'User'}</span>
                                  {!isMessageRead(msg) && (
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" title="Unread"></span>
                                  )}
                                </div>
                              )}
                              {editingMessageId === msg.id ? (
                                <div className="flex flex-col gap-1.5">
                                  <input
                                    className="border rounded-lg px-2.5 py-1.5 text-xs text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={editMessageText}
                                    onChange={e => setEditMessageText(e.target.value)}
                                    autoFocus
                                  />
                                  <div className="flex gap-1.5 justify-end">
                                    <button 
                                      className="px-2.5 py-1 bg-gray-200 text-gray-800 rounded-lg text-xs flex items-center gap-1 hover:bg-gray-300 transition-all"
                                      onClick={handleEditMessageCancel}
                                    >
                                      <X size={12} /> Cancel
                                    </button>
                                    <button 
                                      className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs flex items-center gap-1 hover:bg-indigo-700 transition-all"
                                      onClick={() => handleEditMessageSave(msg)}
                                    >
                                      <Check size={12} /> Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="text-xs leading-relaxed">{renderMessageWithMentions(msg.message)}</div>
                                  <div className={`text-[10px] mt-1 flex items-center justify-end gap-1.5 ${
                                    msg.sender_id === user?.id ? 'text-indigo-100' : 'text-gray-500'
                                  }`}>
                                    <span>{msg.sent_at && formatMessageTime(msg.sent_at)}</span>
                                    {msg.sender_id === user?.id && (
                                      <span className="flex items-center">
                                        {msg.is_read ? (
                                          <span className="text-green-300" title="Read">✓✓</span>
                                        ) : (
                                          <span className="text-indigo-200" title="Sent">✓</span>
                                        )}
                                      </span>
                                    )}
                                    {canEditOrDelete && (
                                      <div className="flex gap-1">
                                        <button 
                                          title="Edit" 
                                          onClick={() => handleEditMessage(msg)} 
                                          className="p-0.5 hover:bg-indigo-700 rounded-full transition-all"
                                        >
                                          <Pencil size={10} />
                                        </button>
                                        <button 
                                          title="Delete" 
                                          onClick={() => handleDeleteMessage(msg)} 
                                          className="p-0.5 hover:bg-indigo-700 rounded-full transition-all"
                                        >
                                          <Trash2 size={10} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message input */}
                <form onSubmit={handleSend} className="bg-white p-2.5 border-t border-indigo-100 shadow-lg relative">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        ref={messageInputRef}
                        className="w-full border-2 border-indigo-200 rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        value={newMessage}
                        onChange={handleMessageChange}
                        onKeyDown={handleMessageKeyDown}
                        placeholder="Type your message... (use @ to mention someone)"
                      />
                      
                      {/* Mention dropdown */}
                      {showMentionDropdown && filteredMentionUsers.length > 0 && (
                        <div
                          ref={mentionDropdownRef}
                          className="absolute bottom-full left-0 mb-2 w-64 bg-white border-2 border-indigo-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto"
                        >
                          <div className="p-2 border-b border-indigo-100 bg-indigo-50">
                            <div className="text-xs font-semibold text-indigo-700">Mention someone</div>
                          </div>
                          {filteredMentionUsers.map((mentionUser: any, index: number) => (
                            <div
                              key={mentionUser.id}
                              className={`p-2 cursor-pointer hover:bg-indigo-50 transition-colors ${
                                index === selectedMentionIndex ? 'bg-indigo-100' : ''
                              }`}
                              onClick={() => handleMentionSelect(mentionUser)}
                              onMouseEnter={() => setSelectedMentionIndex(index)}
                            >
                              <div className="flex items-center gap-2">
                                <div className="rounded-full w-8 h-8 flex items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-400 text-white text-xs font-semibold">
                                  {(mentionUser.name || mentionUser.username || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium text-gray-800 truncate">
                                    {mentionUser.name || mentionUser.username || 'User'}
                                  </div>
                                  {mentionUser.email && (
                                    <div className="text-[10px] text-gray-500 truncate">{mentionUser.email}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button 
                      type="submit" 
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-2 rounded-full hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </div>

              {/* Members Panel */}
              {showMembersPanel && (
                <div className="w-full md:w-64 bg-white border-l border-indigo-100 flex flex-col">
                  <div className="p-3 border-b border-indigo-100 bg-gradient-to-r from-blue-500 to-indigo-600">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white">Members ({roomMembers.length})</h3>
                      <button
                        onClick={() => setShowMembersPanel(false)}
                        className="text-white hover:text-indigo-100 transition-all"
                        title="Close members"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3">
                    {membersLoading ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <RefreshCw className="w-5 h-5 animate-spin mb-2 text-indigo-500" />
                        <div className="text-xs">Loading members...</div>
                      </div>
                    ) : roomMembers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-xs">
                        No members found
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {roomMembers.map((member: any) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50 transition-all group"
                          >
                            <div className="flex items-center flex-1 min-w-0">
                              <div className="rounded-full w-8 h-8 flex items-center justify-center mr-2 bg-gradient-to-br from-blue-400 to-indigo-400 text-white text-xs font-semibold">
                                {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-800 truncate">
                                  {member.name || 'Unknown'}
                                  {member.id === user?.id && (
                                    <span className="ml-1 text-xs text-indigo-600">(You)</span>
                                  )}
                                </div>
                                {member.email && (
                                  <div className="text-xs text-gray-500 truncate">{member.email}</div>
                                )}
                              </div>
                            </div>
                            {canRemoveMembers && member.id !== user?.id && (
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="ml-2 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                title={`Remove ${member.name || 'member'}`}
                                disabled={removeMemberMutation.isPending}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            <div className="max-w-md text-center">
              <div className="text-indigo-300 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">Welcome to Instant Chat</h3>
              <p className="text-sm text-gray-500 mb-4">
                Select a chat from the sidebar or create a new group chat to start instant messaging
              </p>
              <button
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                onClick={() => setShowCreateModal(true)}
              >
                Create Group Chat
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-semibold">Create Group Chat</h3>
                <button 
                  className="text-white hover:text-indigo-100 transition-all"
                  onClick={() => setShowCreateModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-4">
              {staffError && (
                <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg mb-3 text-xs">
                  {staffError instanceof Error ? staffError.message : String(staffError)}
                </div>
              )}
              <form onSubmit={handleCreateGroup}>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Group Name</label>
                  <input
                    className="w-full border-2 border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Enter group name"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Add Members</label>
                  <div className="max-h-48 overflow-y-auto border-2 border-indigo-100 rounded-lg p-2 bg-gray-50">
                    {allStaff.map((staff: any) => (
                      <div key={staff.id} className="flex items-center p-1.5 hover:bg-indigo-50 rounded-lg transition-all">
                        <input
                          type="checkbox"
                          id={`staff-${staff.id}`}
                          checked={selectedStaff.includes(staff.id)}
                          onChange={e => {
                            if (e.target.checked) setSelectedStaff(prev => [...prev, staff.id]);
                            else setSelectedStaff(prev => prev.filter(id => id !== staff.id));
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`staff-${staff.id}`} className="ml-2 block text-xs text-gray-700 cursor-pointer font-medium">
                          {staff.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button 
                    type="button" 
                    className="px-4 py-1.5 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all text-xs font-medium"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 text-xs font-medium shadow-lg"
                    disabled={!groupName.trim() || selectedStaff.length === 0 || createGroupMutation.isPending}
                  >
                    {createGroupMutation.isPending ? (
                      <div className="flex items-center gap-1.5">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Creating...
                      </div>
                    ) : (
                      'Create Group'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg shadow-2xl z-50 animate-fade-in-out">
          <div className="flex items-center gap-1.5">
            <Check className="mr-1" size={16} />
            <span className="text-sm font-medium">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstantChatPage;

