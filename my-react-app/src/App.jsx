import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import HomeUser from "./pages/HomeUser";
import CompleteProfile from "./pages/CompleteProfile";
import Messenger from './pages/Messenger';
import { io } from "socket.io-client";
import { useState, createContext, useEffect } from "react";
import User from "../../Server/models/User";
import AIChatPage from './pages/AIChatPage';

export const SocketContext = createContext(null);
export const UserContext = createContext(null);

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
    <UserContext.Provider value={{user, setUser}}>
      <SocketContext.Provider value={socket}>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomeUser />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/messenger" element={<Messenger />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/messenger/:conversationId" element={<Messenger />} />
          <Route path="/ai-chat" element={<AIChatPage />} />
        </Routes>
      </SocketContext.Provider>
    </UserContext.Provider>
  );
}

export default App;