import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Pencil, Trash2, Plus, ChevronLeft, Check, X, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { DateTime } from 'luxon';
import {
  useChatRooms,
  useMessages,
  useStaff,
  useSendMessage,
  useCreateGroup,
  useEditMessage,
  useDeleteMessage,
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

// Staff interface is now imported from useChat hook

// Utility function to format time consistently using Luxon
const formatTime = (timeString: string): string => {
  if (!timeString) return 'N/A';
  
  try {
    // Parse the time string using Luxon
    let dt: DateTime;
    
    // Handle different time string formats
    if (timeString.includes('T') && timeString.includes('Z')) {
      // ISO format like "2025-08-19T11:34:26.649Z"
      dt = DateTime.fromISO(timeString, { zone: 'utc' });
    } else if (timeString.includes(' ')) {
      // Local format like "2025-08-19 12:18:24.046"
      dt = DateTime.fromFormat(timeString, 'yyyy-MM-dd HH:mm:ss.SSS', { zone: 'utc' });
      if (!dt.isValid) {
        // Try without milliseconds
        dt = DateTime.fromFormat(timeString, 'yyyy-MM-dd HH:mm:ss', { zone: 'utc' });
      }
    } else {
      // Fallback to ISO parsing
      dt = DateTime.fromISO(timeString, { zone: 'utc' });
    }
    
    // Check if the date is valid
    if (!dt.isValid) {
      console.error('Invalid date:', dt.invalidReason, dt.invalidExplanation);
      return 'N/A';
    }
    
    // Format the date and time consistently
    const formatted = dt.toFormat('MMM dd, yyyy, HH:mm');
    
    // Debug logging (remove in production)
    console.log('Room time formatting:', {
      original: timeString,
      parsed: dt.toISO(),
      formatted: formatted
    });
    
    return formatted;
  } catch (error) {
    console.error('Error formatting time with Luxon:', error);
    return 'N/A';
  }
};

// Utility function to format time in a more compact way for chat messages
const formatMessageTime = (timeString: string): string => {
  if (!timeString) return 'N/A';
  
  try {
    // Parse the time string using Luxon
    let dt: DateTime;
    
    // Handle different time string formats
    if (timeString.includes('T') && timeString.includes('Z')) {
      // ISO format like "2025-08-19T11:34:26.649Z"
      dt = DateTime.fromISO(timeString, { zone: 'utc' });
    } else if (timeString.includes(' ')) {
      // Local format like "2025-08-19 12:18:24.046"
      dt = DateTime.fromFormat(timeString, 'yyyy-MM-dd HH:mm:ss.SSS', { zone: 'utc' });
      if (!dt.isValid) {
        // Try without milliseconds
        dt = DateTime.fromFormat(timeString, 'yyyy-MM-dd HH:mm:ss', { zone: 'utc' });
      }
    } else {
      // Fallback to ISO parsing
      dt = DateTime.fromISO(timeString, { zone: 'utc' });
    }
    
    // Check if the date is valid
    if (!dt.isValid) {
      console.error('Invalid date:', dt.invalidReason, dt.invalidExplanation);
      return 'N/A';
    }
    
    // Check if it's today, yesterday, or another date
    const now = DateTime.now();
    const diffInDays = now.diff(dt, 'days').days;
    
    let formatted: string;
    
    if (diffInDays < 1) {
      // Today - show only time
      formatted = dt.toFormat('HH:mm');
    } else if (diffInDays < 2) {
      // Yesterday - show "Yesterday" and time
      formatted = `Yesterday, ${dt.toFormat('HH:mm')}`;
    } else if (diffInDays < 7) {
      // Within a week - show day and time
      formatted = dt.toFormat('EEE, HH:mm');
    } else {
      // Older - show date and time
      formatted = dt.toFormat('MMM dd, HH:mm');
    }
    
    // Debug logging (remove in production)
    console.log('Message time formatting:', {
      original: timeString,
      parsed: dt.toISO(),
      diffInDays: diffInDays,
      formatted: formatted
    });
    
    return formatted;
  } catch (error) {
    console.error('Error formatting message time with Luxon:', error);
    return 'N/A';
  }
};

const ChatRoomPage: React.FC = () => {
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

  // Use React Query hooks
  const { data: rooms = [], isLoading: roomsLoading, error: roomsError, refetch: refetchRooms } = useChatRooms();
  const { data: messages = [], isLoading: messagesLoading, error: messagesError, refetch: refetchMessages } = useMessages(selectedRoom?.id || null);
  const { data: allStaff = [], error: staffError } = useStaff();
  const { unreadCounts, markRoomAsRead, getTotalUnreadCount } = useUnreadCounts(user?.id);
  const { isMessageRead, markMessageAsRead, markRoomMessagesAsRead } = useReadMessages(user?.id);
  
  // Socket connection
  const { isConnected, joinRoom, leaveRoom } = useSocket(user?.id);
  
  // Mutations
  const sendMessageMutation = useSendMessage();
  const createGroupMutation = useCreateGroup();
  const editMessageMutation = useEditMessage();
  const deleteMessageMutation = useDeleteMessage();

  // Handle room selection
  const handleRoomSelect = (room: ChatRoom) => {
    if (selectedRoom) {
      leaveRoom(selectedRoom.id);
    }
    setSelectedRoom(room);
    joinRoom(room.id);
    
    // Mark all messages in the room as read when selecting it
    setTimeout(() => {
      if (messages.length > 0) {
        const messageIds = messages.map(msg => msg.id!).filter(id => id);
        console.log('Marking all messages as read for room:', room.id, messageIds);
        markRoomMessagesAsRead(room.id, messageIds);
      }
    }, 500); // Small delay to ensure messages are loaded
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
      const messageIds = messages.map(msg => msg.id!).filter(id => id);
      markRoomMessagesAsRead(selectedRoom.id, messageIds);
      markRoomAsRead(selectedRoom.id, messageIds);
      setToast('Messages marked as read!');
      setTimeout(() => setToast(null), 2000);
    }
  };

  // Debug function to show current state
  const debugUnreadCounts = () => {
    console.log('=== DEBUG: Current State ===');
    console.log('Unread Counts:', unreadCounts);
    console.log('Selected Room:', selectedRoom?.id);
    console.log('Total Unread:', getTotalUnreadCount());
    console.log('Socket Connected:', isConnected);
    console.log('===========================');
  };

  // Scroll to bottom on new message and mark messages as read when they come into view
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Mark all messages as read when they are loaded (for the selected room)
    if (selectedRoom && messages.length > 0) {
      const messageIds = messages.map(msg => msg.id!).filter(id => id);
      console.log('Auto-marking messages as read when loaded:', messageIds);
      markRoomMessagesAsRead(selectedRoom.id, messageIds);
    }
  }, [messages, selectedRoom, markRoomMessagesAsRead]);

  // Mark messages as read when they come into view
  useEffect(() => {
    if (!messages.length) return;

    const messageElements = document.querySelectorAll('[data-message-id]');
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = parseInt(entry.target.getAttribute('data-message-id') || '0');
            if (messageId > 0) {
              console.log('Marking message as read:', messageId);
              markMessageAsRead(messageId);
            }
          }
        });
      },
      { threshold: 0.1 } // Mark as read when 10% visible
    );

    messageElements.forEach((el) => observer.observe(el));

    return () => {
      messageElements.forEach((el) => observer.unobserve(el));
    };
  }, [messages, markMessageAsRead]);

  // Update localStorage with unread count for dashboard badge
  useEffect(() => {
    const totalUnread = getTotalUnreadCount();
    localStorage.setItem('chat_total_unread', totalUnread.toString());
  }, [unreadCounts, getTotalUnreadCount]);

  // Show connection status notifications
  useEffect(() => {
    if (isConnected) {
      setToast('Connected to chat server');
      setTimeout(() => setToast(null), 2000);
    } else {
      setToast('Disconnected from chat server');
      setTimeout(() => setToast(null), 3000);
    }
  }, [isConnected]);

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom || !user) return;
    
    const messageText = newMessage.trim();
    setNewMessage('');
    
    // Send via API with optimistic updates
    try {
      await sendMessageMutation.mutateAsync({
      roomId: selectedRoom.id,
        message: messageText,
      sender_id: user.id,
      sender_name: user.username || 'You',
      });
    setToast('Message sent!');
    setTimeout(() => setToast(null), 2000);
    } catch (error) {
      setToast('Failed to send message. Please try again.');
      setTimeout(() => setToast(null), 3000);
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
      
      // Find and select the new room
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

  // Filter rooms based on search term
  const filteredRooms = rooms.filter((room: ChatRoom) => 
    room.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (room.is_group ? 'group chat' : 'private chat').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[85vh] bg-gray-50 rounded-lg shadow-lg overflow-hidden border border-gray-200">
      {/* Sidebar: Room List */}
      <div className={`w-full md:w-80 bg-white border-r ${selectedRoom ? 'hidden md:block' : 'block'}`}>
        <div className="p-4 border-b">
                     <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-2">
               <h2 className="text-xl font-bold text-gray-800">Messages</h2>
               {getTotalUnreadCount() > 0 && (
                 <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                   {getTotalUnreadCount()}
                 </div>
               )}
              {/* Connection status indicator */}
              <div className="flex items-center gap-1" title={isConnected ? "Connected" : "Disconnected"}>
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-500 animate-pulse-green" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
              </div>
             </div>
                           <div className="flex gap-2">
                <button 
                className="bg-gray-600 text-white p-2 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50"
                onClick={handleRetryConnection}
                disabled={isRetrying}
                  title="Refresh messages"
                >
                <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                </button>
                <button 
                  className="bg-yellow-600 text-white p-2 rounded-full hover:bg-yellow-700 transition-colors"
                  onClick={debugUnreadCounts}
                  title="Debug unread counts"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                {getTotalUnreadCount() > 0 && (
                  <button 
                    className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors"
                    onClick={markAllRoomsAsRead}
                    title="Mark all as read"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                )}
                <button 
                  className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                  onClick={() => setShowCreateModal(true)}
                  title="Create group"
                >
                  <Plus size={18} />
                </button>
              </div>
           </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full p-2 pl-8 rounded-lg bg-gray-100 border-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute left-2 top-3 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
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
          {roomsLoading ? (
            <div className="p-4 text-center text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading rooms...
            </div>
          ) : roomsError ? (
            <div className="p-4 text-center text-red-500">
              <WifiOff className="w-6 h-6 mx-auto mb-2" />
              Failed to load rooms
              <button 
                onClick={handleRetryConnection}
                className="block mx-auto mt-2 text-blue-600 hover:underline"
              >
                Retry
              </button>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No chats found {searchTerm && `matching "${searchTerm}"`}
            </div>
          ) : (
            filteredRooms.map((room: ChatRoom) => (
            <div
              key={room.id}
              className={`p-3 flex items-center border-b cursor-pointer hover:bg-gray-50 ${
                selectedRoom?.id === room.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
                onClick={() => handleRoomSelect(room)}
            >
              <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                {room.is_group ? 
                  <span className="font-medium">G</span> : 
                  <span className="font-medium">P</span>
                }
              </div>
                             <div className="flex-1">
                 <div className="flex items-center justify-between">
                   <div className="font-medium text-gray-800">
                     {room.is_group ? (room.name || 'Group Chat') : 'Private Chat'}
                   </div>
                   {unreadCounts[room.id] > 0 && (
                     <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                       {unreadCounts[room.id]}
                     </div>
                   )}
                 </div>
                 <div className="text-xs text-gray-500">
                   {room.is_group ? `${room.name ? 'Group' : 'Direct'} chat` : 'One-to-one conversation'}
                 </div>
                 <div className="text-xs text-gray-400 mt-1">
                   {room.created_at && formatTime(room.created_at)}
                 </div>
               </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        {selectedRoom ? (
          <>
            {/* Chat header */}
            <div className="bg-white p-4 border-b flex items-center justify-between">
              <div className="flex items-center">
                <button 
                  className="md:hidden mr-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setSelectedRoom(null)}
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                  {selectedRoom.is_group ? 
                    <span className="font-medium">G</span> : 
                    <span className="font-medium">P</span>
                  }
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">
                    {selectedRoom.is_group ? (selectedRoom.name || 'Group Chat') : 'Private Chat'}
                  </h2>
                  <div className="text-xs text-gray-500">
                    {unreadCounts[selectedRoom.id] > 0 ? `${unreadCounts[selectedRoom.id]} new message${unreadCounts[selectedRoom.id] > 1 ? 's' : ''}` : 'No new messages'}
                    {/* Debug info - remove in production */}
                    <div className="text-xs text-gray-400 mt-1">
                      Debug: Unread: {unreadCounts[selectedRoom.id] || 0}, Total: {messages.length}
                      <br />
                      Read Status: {messages.filter(msg => isMessageRead(msg)).length}/{messages.length} read
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mark as read button */}
              {unreadCounts[selectedRoom.id] > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={markCurrentRoomAsRead}
                    className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors"
                  >
                    Mark as Read
                  </button>
                  <button
                    onClick={() => {
                      console.log('Manual test - marking all messages as read');
                      messages.forEach(msg => {
                        if (msg.id) {
                          markMessageAsRead(msg.id);
                        }
                      });
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    Test Read
                  </button>
                </div>
              )}
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messagesLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                  <div>Loading messages...</div>
                </div>
              ) : messagesError ? (
                <div className="flex flex-col items-center justify-center h-full text-red-500">
                  <WifiOff className="w-8 h-8 mb-2" />
                  <div className="mb-2">Failed to load messages</div>
                  <button 
                    onClick={handleRetryConnection}
                    className="text-blue-600 hover:underline"
                  >
                    Retry
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <div className="mb-2">No messages yet</div>
                  <div className="text-sm">Send a message to start the conversation</div>
                </div>
              ) : (
                messages.map((msg: Message, idx: number) => {
                  // Only allow edit/delete if there is no later message from another user
                  let canEditOrDelete = false;
                  if (msg.sender_id === user?.id) {
                    // Check if all later messages are from the same user
                    canEditOrDelete = messages.slice(idx + 1).every((m: Message) => m.sender_id === user?.id);
                  }
                  return (
                    <div 
                      key={idx} 
                      className={`mb-4 flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      data-message-id={msg.id}
                    >
                      <div className={`max-w-xs lg:max-w-md relative ${msg.sender_id === user?.id ? 'ml-auto' : 'mr-auto'}`}>
                        <div className={`px-4 py-3 rounded-2xl ${msg.sender_id === user?.id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none shadow-sm'} ${!isMessageRead(msg) && msg.sender_id !== user?.id ? 'ring-2 ring-blue-200 bg-blue-50' : ''}`}>
                          {msg.sender_id !== user?.id && (
                            <div className="text-sm font-semibold mb-1 flex items-center gap-2">
                              <span>{msg.sender_name || 'User'}</span>
                              {!isMessageRead(msg) && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full" title="Unread"></span>
                              )}
                            </div>
                          )}
                          {editingMessageId === msg.id ? (
                            <div className="flex flex-col gap-2">
                              <input
                                className="border rounded px-3 py-2 text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={editMessageText}
                                onChange={e => setEditMessageText(e.target.value)}
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end">
                                <button 
                                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-300"
                                  onClick={handleEditMessageCancel}
                                >
                                  <X size={14} /> Cancel
                                </button>
                                <button 
                                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-blue-700"
                                  onClick={() => handleEditMessageSave(msg)}
                                >
                                  <Check size={14} /> Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="text-sm">{msg.message}</div>
                              <div className={`text-xs mt-1 flex items-center justify-end ${msg.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'}`}>
                                {msg.sent_at && formatMessageTime(msg.sent_at)}
                                {msg.sender_id === user?.id && (
                                  <div className="ml-1 flex items-center">
                                    {msg.is_read ? (
                                      <span className="text-green-300" title="Read">✓✓</span>
                                    ) : (
                                      <span className="text-blue-200" title="Sent">✓</span>
                                    )}
                                  </div>
                                )}
                                {canEditOrDelete && (
                                  <div className="ml-2 flex gap-1">
                                    <button 
                                      title="Edit" 
                                      onClick={() => handleEditMessage(msg)} 
                                      className="p-1 hover:bg-blue-700 rounded-full"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button 
                                      title="Delete" 
                                      onClick={() => handleDeleteMessage(msg)} 
                                      className="p-1 hover:bg-blue-700 rounded-full"
                                    >
                                      <Trash2 size={14} />
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
            <form onSubmit={handleSend} className="bg-white p-4 border-t">
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                />
                <button 
                  type="submit" 
                  className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md text-center">
              <div className="text-gray-400 mb-4">
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
                    strokeWidth={1}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">No chat selected</h3>
              <p className="text-gray-500 mb-4">
                Select a chat from the sidebar or create a new group chat to start messaging
              </p>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Create Group Chat</h3>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowCreateModal(false)}
                >
                  <X size={24} />
                </button>
              </div>
              {staffError && (
                <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm">
                  {staffError instanceof Error ? staffError.message : String(staffError)}
                </div>
              )}
              <form onSubmit={handleCreateGroup}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                  <input
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter group name"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Add Members</label>
                  <div className="max-h-60 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                    {allStaff.map((staff: any) => (
                      <div key={staff.id} className="flex items-center p-2 hover:bg-gray-100 rounded-lg">
                        <input
                          type="checkbox"
                          id={`staff-${staff.id}`}
                          checked={selectedStaff.includes(staff.id)}
                          onChange={e => {
                            if (e.target.checked) setSelectedStaff(prev => [...prev, staff.id]);
                            else setSelectedStaff(prev => prev.filter(id => id !== staff.id));
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`staff-${staff.id}`} className="ml-2 block text-sm text-gray-700 cursor-pointer">
                          {staff.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button 
                    type="button" 
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={!groupName.trim() || selectedStaff.length === 0 || createGroupMutation.isPending}
                  >
                    {createGroupMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
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
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out">
          <div className="flex items-center">
            <Check className="mr-2" size={18} />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoomPage;