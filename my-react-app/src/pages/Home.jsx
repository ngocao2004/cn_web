import { useState, useEffect, useContext } from 'react';
import { Users, Zap, Heart, MessageCircle, MapPin, Sparkles, TrendingUp, Clock, Send, Image as ImageIcon } from "lucide-react";
import { SocketContext } from '../App';
import { UserContext } from '../App';
import FallingStarCanvas from '../components/FallingStarCanvas';
import { useNavigate } from 'react-router-dom';

export default function Feed() {
  const [activeFeed, setActiveFeed] = useState('newPosts'); // ✅ Mặc định là newPosts
  const socket = useContext(SocketContext);
  const { user } = useContext(UserContext);
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  
  // ✅ State cho đăng bài mới
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const [stats, setStats] = useState({
    OnlineUsers: 0,
    newPosts: 0,
    matchesToday: 0,
    messagesExchanged: 0,
  });

  // ✅ Số liệu hiển thị (real data + random) – khởi tạo từ localStorage để không reset khi reload
  const [animatedStats, setAnimatedStats] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        OnlineUsers: 0,
        newPosts: 0,
        matchesToday: 0,
        messagesExchanged: 0,
      };
    }

    try {
      const raw = localStorage.getItem('animatedStats');
      if (!raw) {
        return {
          OnlineUsers: 0,
          newPosts: 0,
          matchesToday: 0,
          messagesExchanged: 0,
        };
      }

      const parsed = JSON.parse(raw);
      return {
        OnlineUsers: Number(parsed.OnlineUsers) || 0,
        newPosts: Number(parsed.newPosts) || 0,
        matchesToday: Number(parsed.matchesToday) || 0,
        messagesExchanged: Number(parsed.messagesExchanged) || 0,
      };
    } catch (e) {
      console.error('❌ Failed to parse animatedStats from localStorage:', e);
      return {
        OnlineUsers: 0,
        newPosts: 0,
        matchesToday: 0,
        messagesExchanged: 0,
      };
    }
  });

  const [feedData, setFeedData] = useState({
    OnlineUsers: [],
    newPosts: [],
    matchesToday: [],
    messagesExchanged: [],
  });

  const [loading, setLoading] = useState({
    OnlineUsers: false,
    newPosts: false,
    matchesToday: false,
    messagesExchanged: false,
  });

  // ✅ Lưu animatedStats xuống localStorage để giữ lại khi F5 / reload
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('animatedStats', JSON.stringify(animatedStats));
    } catch (e) {
      console.error('❌ Failed to save animatedStats to localStorage:', e);
    }
  }, [animatedStats]);

  // Socket listener - update stats and auto-refresh OnlineUsers when viewing that tab
  useEffect(() => {
    if (!socket) return;

    const handleOnlineCount = (count) => {
      console.log("👥 Online users count received:", count);
      setStats(prev => ({ ...prev, OnlineUsers: count }));
      
      // Auto-refresh OnlineUsers data when count changes and user is viewing OnlineUsers tab
      if (activeFeed === 'OnlineUsers' && count > 0) {
        // Small delay to ensure socket state is updated on server
        setTimeout(() => {
          fetchFeedData('OnlineUsers');
        }, 200);
      }
    };

    socket.on("online_users_count", handleOnlineCount);

    // Request current online users count and fetch data when socket is ready
    const requestCountAndFetch = () => {
      console.log("📊 Requesting online users count from server");
      socket.emit("request_online_count");
      // Fetch OnlineUsers data after a short delay to ensure server has processed
      setTimeout(() => {
        fetchFeedData('OnlineUsers');
      }, 300);
    };

    if (socket.connected) {
      requestCountAndFetch();
    } else {
      socket.once("connect", requestCountAndFetch);
    }

    return () => {
      socket.off("online_users_count", handleOnlineCount);
      socket.off("connect", requestCountAndFetch);
    };
  }, [socket, activeFeed]);

  // Initial fetch when component mounts
  useEffect(() => {
    fetchStats();
    // Fetch default feed (newPosts)
    fetchFeedData(activeFeed);
    // Pre-fetch OnlineUsers when component mounts
    fetchFeedData('OnlineUsers');
  }, []);

  // Fetch data when activeFeed changes
  useEffect(() => {
    if (activeFeed !== 'newPosts') {
      fetchFeedData(activeFeed);
    }
    
    // If switching to OnlineUsers, request server to emit current count and fetch data
    if (activeFeed === 'OnlineUsers') {
      if (socket && socket.connected) {
        console.log("📊 Requesting online count when switching to OnlineUsers tab");
        socket.emit("request_online_count");
      }
      // Fetch data immediately
      fetchFeedData('OnlineUsers');
    }
  }, [activeFeed, socket]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stats`);
      const data = await response.json();

      // ✅ Số liệu gốc từ server
      const nextStats = {
        OnlineUsers: data.OnlineUsers ?? stats.OnlineUsers ?? 0,
        newPosts: data.newPosts || 0,
        matchesToday: data.matchesToday || 0,
        messagesExchanged: data.messagesExchanged || 0,
      };

      setStats(nextStats);

      // ✅ Đồng bộ animatedStats với số liệu gốc (điểm bắt đầu cho hiệu ứng random)
      setAnimatedStats(prev => ({
        OnlineUsers: nextStats.OnlineUsers,
        // Giữ nguyên nếu animated đang cao hơn số liệu thật để không bị tụt xuống đột ngột
        newPosts: Math.max(prev.newPosts, nextStats.newPosts),
        matchesToday: Math.max(prev.matchesToday, nextStats.matchesToday),
        messagesExchanged: Math.max(prev.messagesExchanged, nextStats.messagesExchanged),
      }));
    } catch (error) {
      console.error("❌ Error fetching stats:", error);
    }
  };

  const fetchFeedData = async (feedType) => {
    try {
      setLoading(prev => ({ ...prev, [feedType]: true }));
      
      let endpoint = '';

      switch (feedType) {
        case 'OnlineUsers':
          endpoint = '/api/users/online';
          break;

        case 'newPosts':
          endpoint = `/api/posts?userId=${user?.id || ''}`;
          break;

        case 'matchesToday':
          endpoint = '/api/matches/today';
          break;

        case 'messagesExchanged':
          endpoint = '/api/messages/recent';
          break;

        default:
          setLoading(prev => ({ ...prev, [feedType]: false }));
          return;
      }

      const response = await fetch(`${API_URL}${endpoint}`);
      const data = await response.json();

      // ✅ QUAN TRỌNG: lấy ĐÚNG dữ liệu
      setFeedData(prev => ({
        ...prev,
        [feedType]: feedType === 'newPosts' ? data.posts || [] : (Array.isArray(data) ? data : [])
      }));

    } catch (error) {
      console.error(`❌ Error fetching ${feedType}:`, error);
      setFeedData(prev => ({
        ...prev,
        [feedType]: []
      }));
    } finally {
      setLoading(prev => ({ ...prev, [feedType]: false }));
    }
  };

  // ✅ Tạo hiệu ứng số liệu động: dựa trên số thật nhưng thêm random theo thời gian
  useEffect(() => {
    // Interval nhỏ để UI sinh động hơn (ví dụ 4 giây)
    const interval = setInterval(() => {
      setAnimatedStats(prev => {
        // Base thật từ server
        const base = stats;

        // OnlineUsers: dao động quanh số thật, có thể +/- nhẹ
        const onlineBase = base.OnlineUsers || 0;
        const onlineDelta = Math.floor(Math.random() * 7) - 3; // -3 .. +3
        const nextOnline = Math.max(0, onlineBase + onlineDelta);

        // NewPosts: có thể tăng chậm, không giảm dưới số thật
        const postsBase = base.newPosts || 0;
        const postsPrev = Math.max(prev.newPosts, postsBase);
        const postsDelta = Math.random() < 0.4 ? 1 : 0; // thỉnh thoảng +1
        const nextPosts = postsPrev + postsDelta;

        // Matches: luôn tăng hoặc giữ nguyên, không giảm
        const matchesBase = base.matchesToday || 0;
        const matchesPrev = Math.max(prev.matchesToday, matchesBase);
        const matchesDelta = Math.random() < 0.6 ? 1 : 0; // thường xuyên +1
        const nextMatches = matchesPrev + matchesDelta;

        // Messages: tăng nhanh hơn, mô phỏng chat realtime
        const msgBase = base.messagesExchanged || 0;
        const msgPrev = Math.max(prev.messagesExchanged, msgBase);
        const msgDelta = Math.floor(Math.random() * 5) + 1; // +1 .. +5
        const nextMessages = msgPrev + msgDelta;

        return {
          OnlineUsers: nextOnline,
          newPosts: nextPosts,
          matchesToday: nextMatches,
          messagesExchanged: nextMessages,
        };
      });
    }, 4000); // 4 giây / lần

    return () => clearInterval(interval);
  }, [stats]);

  // ✅ Hàm đăng bài mới
  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user) {
      alert('Vui lòng nhập nội dung bài viết!');
      return;
    }

    setIsPosting(true);

    try {
      const response = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          content: newPostContent,
          images: [] // Có thể thêm upload ảnh sau
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Đăng bài thành công!');
        setNewPostContent('');
        setShowCreatePost(false);
        // Refresh posts
        fetchFeedData('newPosts');
        fetchStats();
      } else {
        alert('❌ Lỗi: ' + data.error);
      }
    } catch (error) {
      console.error('❌ Error creating post:', error);
      alert('❌ Không thể đăng bài!');
    } finally {
      setIsPosting(false);
    }
  };





  const handleChat = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để chat!");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: user._id, // user muốn chat
        }),
      });

      const data = await response.json();
      console.log("Conversation response:", data);


      if (data.success) {
        // Chuyển sang trang messenger với conversationId vừa tạo/đang có
        navigate(`/messenger/${data.conversation._id}`);
      } else {
        alert("❌ Lỗi: " + data.error);
      }
    } catch (error) {
      console.error("❌ Error starting conversation:", error);
      alert("❌ Không thể mở cuộc trò chuyện!");
    }
  };



  // ✅ Hàm like post
  const handleLikePost = async (postId) => {
  if (!user) {
    alert('Vui lòng đăng nhập để like bài viết!');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });

    const data = await response.json();

    if (data.success) {
      setFeedData(prev => ({
        ...prev,
        newPosts: prev.newPosts.map(post =>
          post._id === postId
            ? {
                ...post,
                likeCount: data.likeCount,
                isLiked: data.isLiked
              }
            : post
        )
      }));
    }
  } catch (error) {
    console.error('❌ Error liking post:', error);
  }


};

  const statItems = [
    { label: 'Online Users', value: animatedStats.OnlineUsers.toLocaleString(), icon: Users, gradient: 'from-pink-500 to-rose-500', feedKey: 'OnlineUsers' },
    { label: 'New Posts', value: animatedStats.newPosts.toLocaleString(), icon: Zap, gradient: 'from-green-500 to-emerald-500', feedKey: 'newPosts' },
    { label: 'Matches Today', value: animatedStats.matchesToday.toLocaleString(), icon: Heart, gradient: 'from-red-500 to-pink-500', feedKey: 'matchesToday' },
    { label: 'Messages', value: animatedStats.messagesExchanged.toLocaleString(), icon: MessageCircle, gradient: 'from-blue-500 to-cyan-500', feedKey: 'messagesExchanged' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20">
    <FallingStarCanvas />
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Live Activity Feed
          </h1>
          <p className="text-white/60 text-lg">Real-time connections happening now</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statItems.map((stat) => (
            <div
              key={stat.label}
              onClick={() => setActiveFeed(stat.feedKey)}
              className={`relative group cursor-pointer transition-all duration-300 hover:scale-105 ${
                activeFeed === stat.feedKey ? 'scale-105' : ''
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity`}></div>
              <div className="relative bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
                <stat.icon className="w-12 h-12 text-white mb-3" />
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/60">{stat.label}</div>
                {activeFeed === stat.feedKey && (
                  <div className="absolute top-2 right-2">
                    <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ✅ Nút Đăng Bài (chỉ hiển thị khi activeFeed là newPosts) */}
        {activeFeed === 'newPosts' && user && (
          <div className="mb-6">
            {!showCreatePost ? (
              <button
                onClick={() => setShowCreatePost(true)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-green-500/50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Đăng bài mới
              </button>
            ) : (
              <div className="bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Bạn đang nghĩ gì?"
                  className="w-full bg-slate-900/50 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[120px]"
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleCreatePost}
                    disabled={isPosting}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    {isPosting ? 'Đang đăng...' : 'Đăng bài'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreatePost(false);
                      setNewPostContent('');
                    }}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-300"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Feed Content */}
        <div className="space-y-6">
          {/* New Posts Feed - ✅ ĐÃ SỬA */}
          {activeFeed === 'newPosts' && (
            <>
              {feedData.newPosts.length > 0 ? (
                feedData.newPosts.map((post) => (
                  <div
                    key={post._id}
                    className="bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:border-green-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/20"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                        {post.userId?.avatar ? (
                          <img 
                            src={post.userId.avatar} 
                            alt={post.userId.name} 
                            className="w-full h-full rounded-xl object-cover" 
                          />
                        ) : (
                          post.userId?.name?.[0] || '?'
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {post.userId?.name || 'Anonymous'}
                            </h3>
                            <div className="flex items-center gap-2 text-white/60 text-sm">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(post.createdAt).toLocaleString('vi-VN')}</span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-white/90 mb-4 leading-relaxed whitespace-pre-wrap">
                          {post.content}
                        </p>
                        
                       {post.images && post.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {post.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={typeof img === 'string' ? img : img.url}
                              alt=""
                              className="w-full rounded-xl object-cover"
                            />
                          ))}
                        </div>
                      )}

                        
                        {/* Actions */}
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleLikePost(post._id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                              post.isLiked
                                ? 'bg-pink-500/20 text-pink-400'
                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                          >
                            <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                            <span className="font-semibold">{post.likeCount || 0}</span>
                          </button>
                          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-all">
                            <MessageCircle className="w-5 h-5" />
                            <span className="font-semibold">
                              {post.comments?.length || 0}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-white/60 py-12">
                  <Zap className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-xl">Chưa có bài viết nào</p>
                  <p className="text-sm mt-2">Hãy là người đầu tiên đăng bài!</p>
                </div>
              )}
            </>
          )}


          {/* Online Users Feed */}
          {activeFeed === 'OnlineUsers' && (
            <>
              {loading.OnlineUsers ? (
                <div className="text-center text-white/60 py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50 animate-pulse" />
                  <p className="text-xl">Đang tải danh sách người dùng...</p>
                </div>
              ) : feedData.OnlineUsers.length > 0 ? (
                feedData.OnlineUsers.map((user) => (
                  <div
                    key={user.id}
                    className="group bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20"
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Avatar Section */}
                      <div className="flex flex-col items-center md:items-start space-y-3">
                        <div className="relative">
                          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                            {user.image}
                          </div>
                          {user.online && (
                            <div className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-slate-800 rounded-full w-8 h-8 flex items-center justify-center">
                              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                            </div>
                          )}
                        </div>
                        <div className="text-center md:text-left">
                          <h3 className="text-2xl font-bold text-white">{user.name}</h3>
                          <p className="text-purple-300 text-sm">{user.age} years old</p>
                          <div className="flex items-center gap-1 text-white/60 text-sm mt-1 justify-center md:justify-start">
                            <MapPin className="w-4 h-4" />
                            <span>{user.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Info Section */}
                      <div className="flex-1 flex flex-col justify-center space-y-4">
                        <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            <span className="text-white/80 font-semibold">About</span>
                          </div>
                          <div className="overflow-hidden">
                            <div className="flex animate-marquee">
                              <span className="text-white/70 mr-20">{user.bio}</span>
                              <span className="text-white/70 mr-20">{user.bio}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/50 flex items-center justify-center gap-2">
                            <Heart className="w-5 h-5" />
                            Connect
                          </button>
                          <button 
                          onClick={handleChat} 
                          className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 border border-white/20 hover:border-white/30 flex items-center justify-center gap-2">
                            <MessageCircle className="w-5 h-5"/>
                            Chat
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-white/60 py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-xl">Chưa có người dùng online</p>
                  <p className="text-sm mt-2">Vui lòng thử lại sau</p>
                </div>
              )}
            </>
          )}

          {/* Matches Today Feed - GIỮ NGUYÊN */}
          {activeFeed === 'matchesToday' && feedData.matchesToday.map((match) => (
            <div
              key={match.id}
              className="bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:border-red-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Heart className="w-16 h-16 text-red-500 fill-current animate-pulse" />
                    <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">{match.match}</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-white/60 text-sm">
                        <Clock className="w-4 h-4" />
                        {match.time}
                      </div>
                      <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-sm font-semibold">
                        {match.compatibility} Match
                      </div>
                    </div>
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </div>
          ))}

          {/* Messages Feed - GIỮ NGUYÊN */}
          {activeFeed === 'messagesExchanged' && feedData.messagesExchanged.map((message) => (
            <div
              key={message.id}
              className="bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold">
                  {message.from[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-white font-semibold">{message.from}</span>
                      <span className="text-white/40 mx-2">→</span>
                      <span className="text-white/70">{message.to}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white/60 text-sm">
                      <Clock className="w-4 h-4" />
                      {message.time}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                    <p className="text-white/90">{message.content}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Marquee Animation */}
      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 20s linear infinite;
          }
        `}
      </style>
    </div>
  );
}