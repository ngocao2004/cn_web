// src/pages/Messenger.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';

export default function Messenger() {
  const navigate = useNavigate();
  const location = useLocation();
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL;

  // ✅ Load user
  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (!userData.id) {
      navigate('/login');
      return;
    }
    setUser(userData);
  }, [navigate]);

  const selectedConversationRef = useRef(selectedConversation);
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);


  // ✅ Socket connection
  useEffect(() => {
    if (!user) return;

    console.log('🔌 Connecting to socket...');
    const newSocket = io(`${API_URL}`, {
      transports: ['websocket'],
      reconnection: true
    });
    
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      newSocket.emit('join_conversations', user.id);
    });

    newSocket.on('new_message', ({ conversationId, message }) => {
      console.log('📩 New message received:', { conversationId, message });

      // ✅ Chỉ xử lý nếu đang xem conversation hiện tại
      if (selectedConversationRef.current?._id === conversationId) {
        setMessages(prev => {
          // 1️⃣ Nếu có tempId trùng, thay thế tin tạm bằng tin thật
          const tempIndex = prev.findIndex(m => m._id === message.tempId);
          if (tempIndex !== -1) {
            const updated = [...prev];
            updated[tempIndex] = {
              _id: message._id,
              senderId: message.senderId,
              content: message.content,
              timestamp: message.timestamp,
              createdAt: message.timestamp
            };
            return updated;
          }

          // 2️⃣ Nếu đã tồn tại tin thật, tránh thêm trùng
          if (prev.some(m => m._id === message._id)) return prev;

          // 3️⃣ Thêm mới nếu chưa có
          return [...prev, {
            _id: message._id,
            senderId: message.senderId,
            content: message.content,
            timestamp: message.timestamp,
            createdAt: message.timestamp
          }];
        });
      }

      // Cập nhật conversations (lastMessage & unreadCount)
      setConversations(prev => prev.map(conv => {
        if (conv._id === conversationId) {
          return {
            ...conv,
            lastMessage: { text: message.content, timestamp: message.timestamp },
            unreadCount: conv._id === selectedConversationRef.current?._id
              ? conv.unreadCount
              : (conv.unreadCount || 0) + 1
          };
        }
        return conv;
      }).sort((a, b) => new Date(b.lastMessage?.timestamp) - new Date(a.lastMessage?.timestamp)));
    });


    newSocket.on('partner_typing', ({ conversationId, isTyping: typing }) => {
      if (selectedConversationRef.current?._id === conversationId) {
        setIsTyping(typing);
      }
    });

    setSocket(newSocket);

    return () => {
      console.log('🔌 Disconnecting socket');
      newSocket.disconnect();
    };
  }, [user]); 

  // ✅ Fetch conversations
  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      const res = await axios.get(
        `${API_URL}/api/conversations?userId=${user.id}`
      );
      
      if (res.data.success) {
        setConversations(res.data.conversations);
        
        // ✅ Auto select conversation from navigation state
        const targetConvId = location.state?.conversationId;
        if (targetConvId && !selectedConversation) {
          const conv = res.data.conversations.find(c => c._id === targetConvId);
          if (conv) {
            handleSelectConversation(conv);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // ✅ Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ Select conversation
  const handleSelectConversation = async (conv) => {
    console.log('📂 Selecting conversation:', conv._id);
    setSelectedConversation(conv);
    
    try {
      const res = await axios.get(
        `${API_URL}/api/messages/${conv._id}`
      );
      
      if (res.data.success) {
        console.log('📬 Loaded messages:', res.data.messages.length);
        setMessages(res.data.messages);
      }

      // Mark as read
      if (socket) {
        socket.emit('mark_as_read', { conversationId: conv._id });
      }

      // Update local state
      setConversations(prev => prev.map(c => 
        c._id === conv._id ? { ...c, unreadCount: 0 } : c
      ));

    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // ✅ Send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!socket || !input.trim() || !selectedConversation) {
      console.warn('Cannot send message:', { socket: !!socket, input, conv: !!selectedConversation });
      return;
    }

    console.log('📤 Sending message:', input);


    const tempId = Date.now().toString();

    // Add to local state immediately (optimistic update)
    const tempMessage = {
      _id: Date.now().toString(),
      senderId: user.id,
      content: input,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      temp: true
    };
    
    setMessages(prev => [...prev, tempMessage]);

    // Send via socket
    socket.emit('send_message', {
      conversationId: selectedConversation._id,
      message: input,
      tempId
    });

    setInput('');
  };

  // ✅ Typing indicator
  const handleTyping = () => {
    if (socket && selectedConversation) {
      socket.emit('typing', {
        conversationId: selectedConversation._id,
        isTyping: true
      });

      setTimeout(() => {
        socket.emit('typing', {
          conversationId: selectedConversation._id,
          isTyping: false
        });
      }, 1000);
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-100 pt-20">
      {/* Sidebar - Conversations */}
      <div className="w-1/3 bg-white border-r overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Tin nhắn</h2>
        </div>

        {conversations.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <p className="mb-4">Chưa có cuộc trò chuyện nào</p>
            <button
              onClick={() => navigate('/chat')}
              className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
            >
              Tìm người mới
            </button>
          </div>
        ) : (
          conversations.map(conv => (
            <div
              key={conv._id}
              onClick={() => handleSelectConversation(conv)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${
                selectedConversation?._id === conv._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {conv.partnerName?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{conv.partnerName}</h3>
                  <p className="text-sm text-gray-600 truncate">
                    {conv.lastMessage?.text || 'Bắt đầu trò chuyện...'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {conv.lastMessage?.timestamp && formatTime(conv.lastMessage.timestamp)}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex-shrink-0">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 p-4 text-white flex items-center space-x-3 shadow-md">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                {selectedConversation.partnerName?.[0]?.toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold">{selectedConversation.partnerName}</h3>
                {isTyping && (
                  <p className="text-xs text-pink-100">đang nhập...</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-br from-pink-50/30 to-purple-50/30">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">
                  <p>Chưa có tin nhắn nào</p>
                  <p className="text-sm mt-2">Hãy bắt đầu cuộc trò chuyện! 💬</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={msg._id || index}
                    className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow ${
                        msg.senderId === user.id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-none'
                          : 'bg-white text-gray-800 rounded-bl-none border'
                      }`}
                    >
                      <p className="break-words">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.senderId === user.id ? 'text-blue-100' : 'text-gray-400'}`}>
                        {msg.timestamp && formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="bg-white p-4 border-t shadow-lg">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-4 py-3 border-2 border-purple-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Gửi
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg">Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          </div>
        )}
      </div>

      {/* CSS */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}