import { useState, useEffect, useRef, useContext } from 'react';
import { SocketContext } from '../App.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { MessageCircle, Send, Clock, Search, Phone, Video, MoreVertical, Sparkles } from 'lucide-react';

export default function Messenger() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL;
  const socket = useContext(SocketContext);

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
    if (!socket || !user) return;

    socket.emit("join_conversation", user.id);

    socket.on('new_message', ({ conversationId, message }) => {
      console.log('📩 New message received:', { conversationId, message });

      if (selectedConversationRef.current?._id === conversationId) {
        setMessages(prev => {
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

          if (prev.some(m => m._id === message._id)) return prev;

          return [...prev, {
            _id: message._id,
            senderId: message.senderId,
            content: message.content,
            timestamp: message.timestamp,
            createdAt: message.timestamp
          }];
        });
      }

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

    socket.on('partner_typing', ({ conversationId, isTyping: typing }) => {
      if (selectedConversationRef.current?._id === conversationId) {
        setIsTyping(typing);
      }
    });

    return () => {
      socket.off('new_message');
      socket.off('partner_typing');
    };
  }, [user, socket]); 

  // ✅ Fetch conversations
  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      const res = await axios.get(`${API_URL}/api/conversations?userId=${user.id}`);
      
      if (res.data.success) {
        setConversations(res.data.conversations);
        
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ Select conversation
  const handleSelectConversation = async (conv) => {
    console.log('📂 Selecting conversation:', conv._id);
    setSelectedConversation(conv);
    
    try {
      const res = await axios.get(`${API_URL}/api/messages/${conv._id}`);
      
      if (res.data.success) {
        console.log('📬 Loaded messages:', res.data.messages.length);
        setMessages(res.data.messages);
      }

      if (socket) {
        socket.emit('mark_as_read', { conversationId: conv._id });
      }

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
    
    if (!socket || !input.trim() || !selectedConversation) return;

    const tempId = Date.now().toString();

    const tempMessage = {
      _id: tempId,
      senderId: user.id,
      content: input,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      temp: true
    };
    
    setMessages(prev => [...prev, tempMessage]);

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

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ`;
    return date.toLocaleDateString('vi-VN');
  };

  const filteredConversations = conversations.filter(conv =>
    conv.partnerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 h-[calc(100vh-5rem)] max-w-7xl mx-auto p-6">
        <div className="h-full grid grid-cols-12 gap-6">
          {/* Sidebar - Conversations */}
          <div className="col-span-4 bg-slate-800/90 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden flex flex-col">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-8 h-8 text-pink-400" />
                  Tin nhắn
                </h2>
                <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="text-center p-8 text-white/60">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">Chưa có cuộc trò chuyện nào</p>
                  <button
                    onClick={() => navigate('/chat')}
                    className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:shadow-lg hover:shadow-pink-500/50 transition-all"
                  >
                    Tìm người mới
                  </button>
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <div
                    key={conv._id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-4 border-b border-white/5 cursor-pointer transition-all ${
                      selectedConversation?._id === conv._id 
                        ? 'bg-purple-500/20 border-l-4 border-purple-500' 
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                          {conv.partnerName?.[0]?.toUpperCase()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-800 rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{conv.partnerName}</h3>
                        <p className="text-sm text-white/60 truncate">
                          {conv.lastMessage?.text || 'Bắt đầu trò chuyện...'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-white/40" />
                          <p className="text-xs text-white/40">
                            {conv.lastMessage?.timestamp && formatTime(conv.lastMessage.timestamp)}
                          </p>
                        </div>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex-shrink-0 font-semibold">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="col-span-8 bg-slate-800/90 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-white text-xl backdrop-blur-sm">
                        {selectedConversation.partnerName?.[0]?.toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">{selectedConversation.partnerName}</h3>
                      {isTyping ? (
                        <p className="text-xs text-pink-200 flex items-center gap-1">
                          <span className="animate-pulse">đang nhập</span>
                          <span className="animate-bounce">.</span>
                          <span className="animate-bounce" style={{animationDelay: '0.2s'}}>.</span>
                          <span className="animate-bounce" style={{animationDelay: '0.4s'}}>.</span>
                        </p>
                      ) : (
                        <p className="text-xs text-pink-200">Đang hoạt động</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm">
                      <Phone className="w-5 h-5 text-white" />
                    </button>
                    <button className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm">
                      <Video className="w-5 h-5 text-white" />
                    </button>
                    <button className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm">
                      <MoreVertical className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-br from-slate-900/50 to-purple-900/50">
                  {messages.length === 0 ? (
                    <div className="text-center text-white/40 mt-32">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Chưa có tin nhắn nào</p>
                      <p className="text-sm mt-2">Hãy bắt đầu cuộc trò chuyện! 💬</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={msg._id || index}
                        className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                      >
                        <div className="max-w-md group">
                          <div className="relative">
                            {msg.senderId !== user.id && (
                              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
                            )}
                            {msg.senderId === user.id && (
                              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                            )}
                            
                            <div
                              className={`relative px-6 py-4 rounded-3xl shadow-xl backdrop-blur-sm ${
                                msg.senderId === user.id
                                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-br-md'
                                  : 'bg-slate-800/90 border border-white/20 text-white rounded-bl-md'
                              }`}
                            >
                              <p className="break-words leading-relaxed">{msg.content}</p>
                              {msg.timestamp && (
                                <p className={`text-xs mt-2 ${msg.senderId === user.id ? 'text-pink-200' : 'text-white/50'}`}>
                                  {formatTime(msg.timestamp)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-6 bg-slate-900/50 backdrop-blur-xl border-t border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition-opacity"></div>
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
                        className="relative w-full px-6 py-4 bg-slate-800/90 border-2 border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none transition-all"
                        autoFocus
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="group relative p-4 overflow-hidden rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl transition-all group-hover:scale-110"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <Send className="relative w-6 h-6 text-white transform group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-white/60">
                <div className="text-center">
                  <MessageCircle className="w-24 h-24 mx-auto mb-6 opacity-50" />
                  <p className="text-2xl font-semibold mb-2">Chọn cuộc trò chuyện</p>
                  <p className="text-white/40">Chọn một cuộc trò chuyện để bắt đầu nhắn tin</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        
        /* Custom scrollbar */
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.5);
          border-radius: 10px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.7);
        }
      `}</style>
    </div>
  );
}