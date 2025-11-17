import { useEffect, useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import io from "socket.io-client";

export default function RandomChat() {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [partner, setPartner] = useState(null);
  const [isFinding, setIsFinding] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [compatibilityScore, setCompatibilityScore] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;
  
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
  if (!user) return;

  console.log("🔌 Connecting to socket...");
  const newSocket = io(API_URL, {
    transports: ["websocket"],
  });

  newSocket.on("connect", () => {
    console.log("✅ Socket connected:", newSocket.id);
    newSocket.emit("join_conversations", user.id);
  });

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
    setIsMatched(true);
    setConversationId(convId);
    setIsExpired(false);
    alert(message || "🎉 Cả hai đã thích nhau! Giờ bạn có thể chat vĩnh viễn!");
    console.log("🎉 Mutual match! Conversation:", convId);

    // ✅ Chuyển SPA bằng React Router
    navigate(`/messenger?conversationId=${convId}`);
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
    console.log("🔌 Disconnecting socket");
    newSocket.disconnect();
  };
}, [user]); // chỉ dependency là user


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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4 pt-20">
      <div className="max-w-6xl mx-auto">
        {/* ===== HEADER ===== */}
        <div className="text-center mb-8 pt-6">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-2 animate-pulse">
            💬 Random Chat
          </h1>
          <p className="text-gray-600">Trò chuyện 3 phút - Like để chat vĩnh viễn!</p>
        </div>

        {!partner ? (
          /* ========== FINDING STATE ========== */
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden transform hover:scale-105 transition-all duration-300">
              {user && (
                <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-8 text-white text-center">
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-white/30 flex items-center justify-center text-6xl mx-auto mb-4">
                    {user.gender === "Nam" ? "👨" : user.gender === "Nữ" ? "👩" : "🧑"}
                  </div>
                  <h2 className="text-2xl font-bold mt-4">{user.name}</h2>
                  <p className="text-pink-100 mt-1">{user.gender} • {user.age} tuổi</p>
                  {user.hometown && (
                    <p className="text-pink-200 text-sm mt-2">📍 {user.hometown}</p>
                  )}
                </div>
              )}

              <div className="p-8">
                {!isFinding ? (
                  <div className="text-center space-y-4">
                    <div className="text-6xl mb-4 animate-bounce">🔍</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      Sẵn sàng gặp người mới?
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Hệ thống sẽ tìm người phù hợp nhất với bạn
                    </p>
                    <button
                      onClick={handleFindPartner}
                      disabled={!socket || !user}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ✨ Bắt đầu tìm kiếm
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <div className="absolute inset-0 border-4 border-purple-200 rounded-full animate-ping"></div>
                      <div className="absolute inset-0 border-4 border-t-purple-600 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center text-4xl">🔍</div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      Đang tìm kiếm...
                    </h3>
                    <p className="text-gray-600">
                      Đang tìm người phù hợp với bạn
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ========== CHATTING STATE ========== */
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-5xl mx-auto">
            {/* ===== CHAT HEADER với Timer & Like ===== */}
            <div className="bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-12 h-12 rounded-full border-2 border-white bg-white/30 flex items-center justify-center text-2xl flex-shrink-0">
                    {partner.gender === "Nam" ? "👨" : partner.gender === "Nữ" ? "👩" : "🧑"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{partner.name}</h3>
                    <p className="text-sm text-pink-100 truncate">
                      {partner.gender} • {partner.age} tuổi
                      {partner.hometown && ` • ${partner.hometown}`}
                    </p>
                  </div>
                  {compatibilityScore && (
                    <span className="bg-green-400 text-white text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0">
                      {compatibilityScore}% match
                    </span>
                  )}
                </div>

                {/* ===== LIKE BUTTON ===== */}
                <button
                  onClick={handleLike}
                  disabled={iLiked || isMatched}
                  title={iLiked ? "Đã like" : "Like người này"}
                  className={`p-3 rounded-full transition-all flex-shrink-0 ml-2 ${
                    iLiked 
                      ? 'bg-pink-600 cursor-not-allowed' 
                      : 'bg-white/20 hover:bg-white/30 hover:scale-110'
                  } ${isMatched ? 'hidden' : ''}`}
                >
                  <svg 
                    className={`w-6 h-6 ${iLiked ? 'fill-current' : ''}`}
                    fill={iLiked ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>

                {/* ===== END CHAT BUTTON ===== */}
                <button
                  onClick={handleEndChat}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-sm transition-all flex-shrink-0 ml-2"
                  title="Kết thúc chat"
                >
                  ❌
                </button>
              </div>

              {/* ===== TIMER & STATUS BAR ===== */}
              <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                <div className="flex items-center justify-between">
                  {/* Timer */}
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className={`font-bold text-lg ${getTimerColor()}`}>
                      {isMatched ? '∞' : formatTime(timeRemaining)}
                    </span>
                    {!isMatched && timeRemaining <= 30 && (
                      <span className="text-xs bg-red-500 px-2 py-1 rounded-full animate-pulse">
                        Sắp hết!
                      </span>
                    )}
                  </div>

                  {/* Status badges */}
                  <div className="flex items-center space-x-2">
                    {partnerLiked && !isMatched && (
                      <span className="text-xs bg-pink-400 px-3 py-1 rounded-full animate-pulse">
                        💖 Người kia đã like bạn!
                      </span>
                    )}

                    {iLiked && !partnerLiked && !isMatched && (
                      <span className="text-xs bg-purple-400 px-3 py-1 rounded-full">
                        💜 Đã like
                      </span>
                    )}

                    {isMatched && (
                      <span className="text-xs bg-green-400 px-3 py-1 rounded-full font-semibold">
                        🎉 Đã kết nối!
                      </span>
                    )}

                    {isExpired && !isMatched && (
                      <span className="text-xs bg-red-400 px-3 py-1 rounded-full">
                        ⏰ Hết giờ
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ===== MESSAGES ===== */}
            <div className="h-[500px] overflow-y-auto p-6 bg-gradient-to-br from-pink-50/50 to-purple-50/50 backdrop-blur">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 mt-40">
                  <div className="text-6xl mb-4">👋</div>
                  <p className="text-lg mb-2">Bạn có 3 phút để trò chuyện!</p>
                  <p className="text-sm">Like nhau để chat vĩnh viễn 💕</p>
                  {compatibilityScore && (
                    <p className="text-sm mt-3 text-purple-600 font-semibold">
                      Bạn và {partner.name} có {compatibilityScore}% độ tương thích
                    </p>
                  )}
                </div>
              )}
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-4 flex ${msg.from === "me" ? "justify-end" : "justify-start"} animate-fadeIn`}
                >
                  <div className={`max-w-xs lg:max-w-md`}>
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-md ${
                        msg.from === "me"
                          ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-br-none"
                          : "bg-white text-gray-800 rounded-bl-none"
                      }`}
                    >
                      <p className="break-words">{msg.text}</p>
                      {msg.time && (
                        <p className={`text-xs mt-1 ${msg.from === "me" ? "text-pink-100" : "text-gray-400"}`}>
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
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center space-x-3">
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
                  className="flex-1 px-4 py-3 border-2 border-purple-200 rounded-full focus:ring-2 focus:ring-purple-400 focus:border-transparent focus:outline-none transition-all duration-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || (isExpired && !isMatched)}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-3 rounded-full hover:shadow-lg transform hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== CSS ANIMATIONS ===== */}
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