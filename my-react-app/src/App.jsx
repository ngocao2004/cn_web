import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import HomeUser from "./pages/HomeUser";
import CompleteProfile from "./pages/CompleteProfile";
import Messenger from "./pages/Messenger";
import { io } from "socket.io-client";
import { useState, useEffect } from "react";
import AIChatPage from "./pages/AIChatPage";
import { SocketContext, UserContext } from "./contexts";

function App() {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

  // 🔹 Load user từ sessionStorage khi mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const handleUserChange = () => {
      const storedUser = sessionStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Lỗi parse user từ sessionStorage:", error);
          sessionStorage.removeItem("user");
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    window.addEventListener("userChanged", handleUserChange);
    return () => window.removeEventListener("userChanged", handleUserChange);
  }, []);

  // 🔹 Tạo socket KHI CÓ USER (dependency: user)
  useEffect(() => {
    if (!user) return; // ✅ Chờ có user mới tạo socket

    console.log("🔌 Creating socket for user:", user.id);
    const newSocket = io(API_URL, { withCredentials: true });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
      console.log("👀 Emitting set_user with id:", user.id);
      newSocket.emit("set_user", { userId: user.id });
    });

    setSocket(newSocket);

    // Cleanup khi user thay đổi hoặc component unmount
    return () => {
      console.log("🔌 Disconnecting socket");
      newSocket.disconnect();
    };
  }, [user, API_URL]); // ✅ Dependency: user

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <SocketContext.Provider value={socket}>
        <Navbar user={user} socket={socket} />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/feed" element={<Home />} />
          <Route path="/home" element={<HomeUser />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/messenger" element={<Messenger />} />
          <Route path="/messenger/:id" element={<Messenger />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/ai-chat" element={<AIChatPage />} />
        </Routes>
      </SocketContext.Provider>
    </UserContext.Provider>
  );
}

export default App;