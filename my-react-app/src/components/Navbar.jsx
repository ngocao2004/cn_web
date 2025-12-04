import { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SocketContext, UserContext } from "../App";
import { Home, MessageCircle, Send, User, LogOut, Heart, Menu, X } from "lucide-react";

export default function Navbar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);
  const socket = useContext(SocketContext);

  const loadUser = () => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Lỗi khi parse user:", error);
        sessionStorage.removeItem("user");
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    loadUser();

    const handleUserChange = () => loadUser();
    window.addEventListener("userChanged", handleUserChange);

    return () => {
      window.removeEventListener("userChanged", handleUserChange);
    };
  }, []);

  const handleLogout = () => {
    console.log("🚪 Đăng xuất...");
    
    if (socket) {
      console.log("🔌 Disconnecting socket...");
      socket.disconnect();
    }
    
    sessionStorage.removeItem("user");
    console.log("🗑️ Đã xóa sessionStorage");
    
    setUser(null);
    console.log("✅ Đã clear user context");
    
    setShowDropdown(false);
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-gradient backdrop-blur-xl border-b border-white/10 shadow-2xl">
      {/* Gradient line */}
      <div className="h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"></div>
      
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/home" className="group flex items-center space-x-2">
            <div className="relative">
              <Heart className="w-10 h-10 text-pink-500 fill-current animate-pulse" />
              <div className="absolute inset-0 bg-pink-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              HustLove
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link
              to="/home"
              className="group px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Trang chủ</span>
            </Link>

            {user && (
              <>
                <Link
                  to="/chat"
                  className="group px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">Chat</span>
                </Link>

                <Link
                  to="/messenger"
                  className="group px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  <span className="font-medium">Messenger</span>
                </Link>
              </>
            )}

            {/* Auth Buttons / User Menu */}
            {!user ? (
              <div className="flex items-center gap-2 ml-4">
                <Link
                  to="/login"
                  className="px-6 py-2 rounded-xl text-white font-medium hover:bg-white/10 transition-all"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:shadow-lg hover:shadow-pink-500/50 transition-all"
                >
                  Đăng ký
                </Link>
              </div>
            ) : (
              <div className="relative ml-4">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-3 px-4 py-2 rounded-xl hover:bg-white/10 transition-all group"
                >
                  <div className="relative">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-10 h-10 rounded-xl object-cover border-2 border-purple-500"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                  </div>
                  <span className="text-white font-semibold">{user.name}</span>
                  <svg 
                    className={`w-4 h-4 text-white/60 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowDropdown(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-blue-500/10"></div>
                      
                      <Link
                        to="/profile"
                        className="relative block px-4 py-3 text-white hover:bg-white/10 transition-all flex items-center gap-3"
                        onClick={() => setShowDropdown(false)}
                      >
                        <User className="w-5 h-5 text-purple-400" />
                        <span className="font-medium">Trang cá nhân</span>
                      </Link>
                      
                      <div className="border-t border-white/10 my-1"></div>
                      
                      <button
                        onClick={handleLogout}
                        className="relative w-full text-left px-4 py-3 text-white hover:bg-red-500/20 transition-all flex items-center gap-3"
                      >
                        <LogOut className="w-5 h-5 text-red-400" />
                        <span className="font-medium">Đăng xuất</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 rounded-xl text-white hover:bg-white/10 transition-all"
          >
            {showMobileMenu ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden mt-4 pb-4 space-y-2">
            <Link
              to="/home"
              className="block px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all flex items-center gap-3"
              onClick={() => setShowMobileMenu(false)}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Trang chủ</span>
            </Link>

            {user && (
              <>
                <Link
                  to="/chat"
                  className="block px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all flex items-center gap-3"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">Chat</span>
                </Link>

                <Link
                  to="/messenger"
                  className="block px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all flex items-center gap-3"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Send className="w-5 h-5" />
                  <span className="font-medium">Messenger</span>
                </Link>

                <div className="border-t border-white/10 my-2"></div>

                <Link
                  to="/profile"
                  className="block px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all flex items-center gap-3"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <User className="w-5 h-5 text-purple-400" />
                  <span className="font-medium">Trang cá nhân</span>
                </Link>

                <button
                  onClick={() => {
                    handleLogout();
                    setShowMobileMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl text-white hover:bg-red-500/20 transition-all flex items-center gap-3"
                >
                  <LogOut className="w-5 h-5 text-red-400" />
                  <span className="font-medium">Đăng xuất</span>
                </button>
              </>
            )}

            {!user && (
              <div className="space-y-2 pt-2">
                <Link
                  to="/login"
                  className="block px-4 py-3 rounded-xl text-center text-white hover:bg-white/10 transition-all font-medium"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="block px-4 py-3 rounded-xl text-center bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}