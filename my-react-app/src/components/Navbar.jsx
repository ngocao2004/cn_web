import { use } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

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
    sessionStorage.removeItem("user");
    setUser(null);
    window.dispatchEvent(new Event("userChanged"));
    navigate("/login");
  };

  return (
    <nav className="bg-pink-100 px-6 py-3 flex justify-between items-center fixed top-0 w-full z-50 shadow">
      <div className="text-2xl font-bold text-pink-600">
        💖 LoveConnect
      </div>

      <div className="space-x-6 text-gray-700 font-medium flex items-center">
        <Link to="/" className="hover:text-pink-500">Trang chủ</Link>
        {user && <Link to="/chat" className="hover:text-pink-500">Chat</Link>}
        {user && <Link to="/messenger" className="hover:text-pink-500">Messenger</Link>}

        {!user ? (
          <>
            <Link to="/login" className="hover:text-pink-500">Đăng nhập</Link>
            <Link to="/register" className="hover:text-pink-500">Đăng ký</Link>
          </>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-3 hover:bg-pink-200 px-3 py-2 rounded-lg transition"
            >
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-10 h-10 rounded-full object-cover border-2 border-pink-400"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-pink-300 flex items-center justify-center text-white font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-pink-600 font-semibold">{user.name}</span>
              <span className="text-pink-400">▼</span>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-gray-700 hover:bg-pink-100 transition"
                  onClick={() => setShowDropdown(false)}
                >
                  👤 Trang cá nhân
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-pink-100 transition"
                >
                  🚪 Đăng xuất
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}