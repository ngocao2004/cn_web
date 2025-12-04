import { useEffect, useState, useRef,useContext } from "react";
import { useNavigate } from 'react-router-dom';
import io from "socket.io-client";
import { SocketContext } from "../App.jsx";


export default function RandomChat() {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [partner, setPartner] = useState(null);
  const [isFinding, setIsFinding] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [compatibilityScore, setCompatibilityScore] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

  const newSocket = useContext(SocketContext);
  
  // ✅ TIMER STATE
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 phút = 180 giây
  const [isExpired, setIsExpired] = useState(false);
  
  // ✅ LIKE STATE
  const [iLiked, setILiked] = useState(false);
  const [partnerLiked, setPartnerLiked] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  
  // ✅ MATCH DATA
  const [matchId, setMatchId] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [tempChatId, setTempChatId] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  
  const messagesEndRef = useRef(null);

  // ✅ LOAD USER từ sessionStorage
  useEffect(() => {
    const userDataString = sessionStorage.getItem("user");
    if (!userDataString) {
      alert("Vui lòng đăng nhập!");
      return;
    }
    
    const userData = JSON.parse(userDataString);
    
    if (!userData.id || !userData.gender || !userData.age) {
      alert("Vui lòng hoàn thiện thông tin cá nhân!");
      return;
    }
    
    setUser(userData);
    console.log("✅ User loaded:", userData);
  }, []);

  // ✅ SOCKET CONNECTION
const navigate = useNavigate();

  useEffect(() => {
  if (!newSocket) return;

    // Join conversation room (server listens for 'join_conversations')
    newSocket.emit("join_conversations", conversationId);

  // ===== PARTNER FOUND =====
  newSocket.on("partner_found", (data) => {
    console.log("💞 Partner found:", data);
    console.log("🔍 Partner hobbies:", data.hobbies); // ✅ THÊM DÒNG NÀY
    console.log("🔍 Partner hobbies type:", typeof data.hobbies); // ✅ VÀ DÒNG NÀY
    console.log("🔍 Is array:", Array.isArray(data.hobbies)); 
    setPartner(data);
    setCompatibilityScore(data.compatibilityScore);
    setMatchId(data.matchId);
    setRoomId(data.roomId);
    setTempChatId(data.tempChatId);
    setTimeRemaining(data.timeLimit || 180);
    setIsFinding(false);
    setIsExpired(false);
    setILiked(false);
    setPartnerLiked(false);
    setIsMatched(false);
    setMessages([]);
  });

  // ===== TIMER UPDATE =====
  newSocket.on("timer_update", ({ remaining }) => {
    setTimeRemaining(remaining);
    if (remaining === 0) setIsExpired(true);
  });

  // ===== CHAT EXPIRED =====
  newSocket.on("chat_expired", ({ message }) => {
    setIsExpired(true);
    alert(message || "Thời gian chat đã hết! Hãy like để tiếp tục.");
  });

  // ===== RECEIVE TEMP MESSAGE =====
  newSocket.on("receive_temp_message", (data) => {
    console.log("📩 Received message:", data);
    setMessages(prev => [...prev, {
      from: "partner",
      text: data.message,
      time: new Date(data.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }]);
  });

  // ===== PARTNER LIKED YOU =====
  newSocket.on("partner_liked_you", () => {
    setPartnerLiked(true);
    console.log("💖 Partner liked you!");
  });

  // ===== MUTUAL MATCH =====
  newSocket.on("mutual_match", ({ conversationId: convId, message }) => {
    console.log("🎉 Mutual match received! Conversation:", convId);
    console.log("📦 Full data:", { conversationId: convId, message });
    
    if (!convId) {
      console.error("❌ No conversationId in mutual_match event!");
      alert("❌ Lỗi: Không nhận được conversationId!");
      return;
    }

    setIsMatched(true);
    setConversationId(convId);
    setIsExpired(false);
    
    alert(message || "🎉 Cả hai đã thích nhau! Giờ bạn có thể chat vĩnh viễn!");

    // ✅ Chuyển SPA bằng React Router - dùng cả query và path param
    console.log(`🚀 Navigating to /messenger/${convId}`);
    setTimeout(() => {
      navigate(`/messenger/${convId}`, { replace: true });
    }, 500); // Delay nhỏ để đảm bảo state đã update
  });

  // ===== NEW MESSAGE =====
  newSocket.on("new_message", ({ conversationId: convId, message }) => {
    // Sử dụng conversationId từ state để lọc message
    setMessages(prev => {
      if (convId === conversationId) {
        return [...prev, {
          from: "partner",
          text: message.content,
          time: new Date(message.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }];
      }
      return prev;
    });
  });

  // ===== PARTNER DISCONNECTED =====
  newSocket.on("partner_disconnected", () => {
    alert("Người kia đã rời khỏi cuộc trò chuyện!");
    resetChat();
  });

  setSocket(newSocket);

  return () => {
    console.log("🔌 Removing chat listeners");
    newSocket.off("partner_found");
    newSocket.off("timer_update");
    newSocket.off("chat_expired");
    newSocket.off("receive_temp_message");
    newSocket.off("partner_liked_you");
    newSocket.off("mutual_match");
    newSocket.off("new_message");
    newSocket.off("partner_disconnected");
  };

}, [user, newSocket]); // depend on newSocket so listeners attach after context socket is ready


  // ✅ AUTO SCROLL messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ===== FIND PARTNER =====
  const handleFindPartner = () => {
    if (!socket || !user) {
      alert("Chưa kết nối socket hoặc thiếu thông tin user");
      return;
    }

    setIsFinding(true);
    
    const userData = {
      _id: user._id || user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      gender: user.gender,
      age: user.age,
      avatar: user.avatar || "",
      job: user.job || user.career || "Chưa cập nhật",
      hometown: user.hometown || user.location || "Chưa cập nhật",
      hobbies: Array.isArray(user.hobbies) ? user.hobbies : [],
      zodiac: user.zodiac || "Chưa rõ",
      lookingFor: user.lookingFor || "Tất cả"
    };

    console.log("🚀 Finding partner with data:", userData);
    console.log("🚀 user.hobbies:", user.hobbies);
    console.log("🚀 user.zodiac:", user.zodiac);
    console.log("🚀 user.lookingFor:", user.lookingFor);
    socket.emit("find_partner", userData);
  };

  // ===== SEND MESSAGE =====
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!socket || !partner || !input.trim()) return;
    
    // Kiểm tra nếu hết thời gian và chưa match
    if (isExpired && !isMatched) {
      alert("Thời gian chat đã hết! Hãy like để tiếp tục.");
      return;
    }

    // Nếu đã matched → gửi message vĩnh viễn
    if (isMatched && conversationId) {
      socket.emit("send_message", {
        conversationId,
        message: input
      });
    } else {
      // Gửi temp message (trong 3 phút)
      socket.emit("send_temp_message", {
        roomId,
        tempChatId,
        message: input
      });
    }

    // Thêm message vào UI ngay lập tức
    setMessages((prev) => [...prev, {
      from: "me",
      text: input,
      time: new Date().toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }]);
    
    setInput("");
  };

  // ===== LIKE PARTNER =====
  const handleLike = () => {
    if (!socket || !matchId || iLiked) return;

    console.log("💖 Sending like for match:", matchId);
    socket.emit("like_partner", { matchId });
    setILiked(true);
  };

  // ===== RESET CHAT =====
  const resetChat = () => {
    setPartner(null);
    setMessages([]);
    setCompatibilityScore(null);
    setTimeRemaining(180);
    setIsExpired(false);
    setILiked(false);
    setPartnerLiked(false);
    setIsMatched(false);
    setMatchId(null);
    setRoomId(null);
    setTempChatId(null);
    setConversationId(null);
  };

  // ===== END CHAT =====
  const handleEndChat = () => {
    if (window.confirm("Bạn có chắc muốn kết thúc cuộc trò chuyện?")) {
      if (socket) {
        socket.disconnect();
        setTimeout(() => {
          socket.connect();
        }, 100);
      }
      resetChat();
    }
  };

  // ===== FORMAT TIME =====
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ===== TIMER COLOR =====
  const getTimerColor = () => {
    if (isMatched) return 'text-green-500';
    if (timeRemaining > 120) return 'text-green-500';
    if (timeRemaining > 60) return 'text-yellow-500';
    return 'text-red-500 animate-pulse';
  };

  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    {/* Animated Background */}
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-20 left-10 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
    </div>

    <div className="relative z-10 min-h-screen p-6 pt-24">
      <div className="max-w-6xl mx-auto">
        {/* ===== HEADER ===== */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
            💬 Random Chat
          </h1>
          <p className="text-white/70 text-lg">Trò chuyện 3 phút - Like để chat vĩnh viễn! 💕</p>
        </div>

        {!partner ? (
          /* ========== FINDING STATE ========== */
          <div className="max-w-xl mx-auto">
            <div className="group relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              
              <div className="relative bg-slate-800/90 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
                {user && (
                  <div className="relative bg-gradient-to-br from-pink-500 via-purple-600 to-blue-600 p-10">
                    <div className="text-center text-white">
                      <div className="relative inline-block mb-6">
                        <div className="w-40 h-40 rounded-3xl border-4 border-white shadow-2xl bg-white/30 flex items-center justify-center text-7xl backdrop-blur-sm">
                          {user.gender === "Nam" ? "👨" : user.gender === "Nữ" ? "👩" : "🧑"}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 border-4 border-white rounded-full flex items-center justify-center">
                          <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      
                      <h2 className="text-3xl font-bold mb-2">{user.name}</h2>
                      <p className="text-white/90 text-lg mb-2">{user.gender} • {user.age} tuổi</p>
                      
                      {user.hometown && (
                        <p className="text-white/80 text-md">📍 {user.hometown}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-10">
                  {!isFinding ? (
                    <div className="text-center space-y-6">
                      <div className="text-8xl mb-6 animate-bounce">🔍</div>
                      
                      <h3 className="text-3xl font-bold text-white mb-3">
                        Sẵn sàng gặp người mới?
                      </h3>
                      <p className="text-white/70 text-lg mb-8">
                        Hệ thống sẽ tìm người phù hợp nhất với bạn ✨
                      </p>
                      
                      <button
                        onClick={handleFindPartner}
                        disabled={!newSocket || !user}
                        className="group relative w-full overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white py-5 rounded-2xl font-bold text-xl shadow-lg transform group-hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                          ✨ Bắt đầu tìm kiếm
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-6">
                      <div className="relative w-40 h-40 mx-auto mb-6">
                        <div className="absolute inset-0 border-8 border-purple-500/30 rounded-full animate-ping"></div>
                        <div className="absolute inset-0 border-8 border-pink-500/30 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                        <div className="absolute inset-0 border-8 border-t-pink-500 border-r-purple-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-6xl">🔍</div>
                      </div>
                      
                      <h3 className="text-3xl font-bold text-white mb-3">
                        Đang tìm kiếm...
                      </h3>
                      <p className="text-white/70 text-lg">
                        Đang tìm người phù hợp với bạn 💫
                      </p>
                      
                      <div className="flex justify-center gap-2">
                        <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========== CHATTING STATE ========== */
          <div className="group relative max-w-6xl mx-auto">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-3xl blur-2xl opacity-30 group-hover:opacity-40 transition-opacity"></div>
            
            <div className="relative bg-slate-800/90 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
              {/* ===== CHAT HEADER ===== */}
              <div className="relative bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 rounded-2xl border-3 border-white bg-white/30 flex items-center justify-center text-3xl shadow-lg backdrop-blur-sm">
                        {partner.gender === "Nam" ? "👨" : partner.gender === "Nữ" ? "👩" : "🧑"}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 border-2 border-white rounded-full">
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1 animate-pulse"></div>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-2xl text-white truncate mb-1">{partner.name}</h3>
                      <p className="text-white/90 truncate">
                        {partner.gender} • {partner.age} tuổi
                        {partner.hometown && ` • ${partner.hometown}`}
                      </p>
                    </div>

                    {compatibilityScore && (
                      <div className="flex-shrink-0 bg-green-400 text-white px-4 py-2 rounded-xl font-bold shadow-lg">
                        <div className="text-xs">Match</div>
                        <div className="text-lg">{compatibilityScore}%</div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 ml-4">
                    <button
                      onClick={handleLike}
                      disabled={iLiked || isMatched}
                      title={iLiked ? "Đã like" : "Like người này"}
                      className={`p-4 rounded-2xl transition-all ${
                        iLiked 
                          ? 'bg-pink-600 cursor-not-allowed' 
                          : 'bg-white/20 hover:bg-white/30 hover:scale-110 backdrop-blur-sm'
                      } ${isMatched ? 'hidden' : ''}`}
                    >
                      <svg 
                        className={`w-7 h-7 ${iLiked ? 'fill-current text-white' : 'text-white'}`}
                        fill={iLiked ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>

                    <button
                      onClick={handleEndChat}
                      className="p-4 bg-white/20 hover:bg-red-500/30 rounded-2xl transition-all hover:scale-110 backdrop-blur-sm"
                      title="Kết thúc chat"
                    >
                      <span className="text-white text-xl">❌</span>
                    </button>
                  </div>
                </div>

                {/* ===== TIMER & STATUS BAR ===== */}
                <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    {/* Timer */}
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${
                        timeRemaining <= 30 ? 'bg-red-500/30 animate-pulse' : 'bg-white/10'
                      }`}>
                        <svg className={`w-6 h-6 ${getTimerColor()}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-white/60 mb-1">Thời gian</div>
                        <span className={`font-bold text-2xl ${getTimerColor()}`}>
                          {isMatched ? '∞' : formatTime(timeRemaining)}
                        </span>
                      </div>
                      {!isMatched && timeRemaining <= 30 && (
                        <span className="bg-red-500 px-3 py-1 rounded-full text-sm font-semibold text-white animate-pulse">
                          Sắp hết!
                        </span>
                      )}
                    </div>

                    {/* Status badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {partnerLiked && !isMatched && (
                        <span className="bg-pink-500/30 backdrop-blur-sm border border-pink-400/50 px-4 py-2 rounded-xl text-sm font-semibold text-white animate-pulse">
                          💖 Người kia đã like bạn!
                        </span>
                      )}

                      {iLiked && !partnerLiked && !isMatched && (
                        <span className="bg-purple-500/30 backdrop-blur-sm border border-purple-400/50 px-4 py-2 rounded-xl text-sm font-semibold text-white">
                          💜 Đã like
                        </span>
                      )}

                      {isMatched && (
                        <span className="bg-green-500/30 backdrop-blur-sm border border-green-400/50 px-4 py-2 rounded-xl text-sm font-semibold text-white animate-pulse">
                          🎉 Đã kết nối!
                        </span>
                      )}

                      {isExpired && !isMatched && (
                        <span className="bg-red-500/30 backdrop-blur-sm border border-red-400/50 px-4 py-2 rounded-xl text-sm font-semibold text-white">
                          ⏰ Hết giờ
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== MESSAGES ===== */}
              <div className="h-[500px] overflow-y-auto p-6 bg-gradient-to-br from-slate-900/50 to-purple-900/50">
                {messages.length === 0 && (
                  <div className="text-center text-white/60 mt-32">
                    <div className="text-8xl mb-6">👋</div>
                    <h3 className="text-2xl font-bold text-white mb-3">Bắt đầu cuộc trò chuyện!</h3>
                    <p className="text-lg mb-2">Bạn có 3 phút để làm quen 💬</p>
                    <p className="text-md mb-4">Like nhau để chat vĩnh viễn 💕</p>
                    {compatibilityScore && (
                      <div className="inline-block bg-purple-500/30 backdrop-blur-sm border border-purple-400/50 px-6 py-3 rounded-2xl mt-4">
                        <p className="text-lg font-semibold text-purple-300">
                          Bạn và {partner.name} có {compatibilityScore}% độ tương thích ✨
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-4 flex ${msg.from === "me" ? "justify-end" : "justify-start"} animate-fadeIn`}
                  >
                    <div className={`max-w-md`}>
                      <div
                        className={`px-6 py-4 rounded-3xl shadow-xl backdrop-blur-sm ${
                          msg.from === "me"
                            ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-br-md"
                            : "bg-slate-800/90 border border-white/20 text-white rounded-bl-md"
                        }`}
                      >
                        <p className="break-words text-lg leading-relaxed">{msg.text}</p>
                        {msg.time && (
                          <p className={`text-xs mt-2 ${msg.from === "me" ? "text-pink-200" : "text-white/50"}`}>
                            {msg.time}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* ===== INPUT ===== */}
              <div className="p-6 bg-slate-900/50 backdrop-blur-xl border-t border-white/10">
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder={
                      isExpired && !isMatched 
                        ? "⏰ Hết thời gian! Like để tiếp tục..." 
                        : "Nhập tin nhắn..."
                    }
                    disabled={isExpired && !isMatched}
                    className="flex-1 px-6 py-4 bg-slate-800/90 border-2 border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none transition-all duration-300 disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:text-white/30"
                  />
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || (isExpired && !isMatched)}
                    className="group relative p-4 overflow-hidden rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl transition-all group-hover:scale-110"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative">
                      <svg className="w-7 h-7 text-white transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* ===== CSS ANIMATIONS ===== */}
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