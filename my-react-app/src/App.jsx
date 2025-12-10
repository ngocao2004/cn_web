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
import Messenger from './pages/Messenger';
import { io } from "socket.io-client";
import { useState, createContext, useEffect } from "react";
import AIChatPage from './pages/AIChatPage';

export const SocketContext = createContext(null);
export const UserContext = createContext(null);

function App() {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    console.log("🔌 Creating socket for user:", user.id);
    const newSocket = io(API_URL, { withCredentials: true });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
      newSocket.emit("set_user", { userId: user.id });
    });

    setSocket(newSocket);

    return () => {
      console.log("🔌 Disconnecting socket");
      newSocket.disconnect();
    };
  }, [user, API_URL]);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/feed" element={<Home />} />
        <Route path="/home" element={<HomeUser />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/messenger" element={<Messenger />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/ai-chat" element={<AIChatPage />} />
      </Routes>
    </>
  );
}

export default App;