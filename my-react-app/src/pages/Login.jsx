
import { useState, useContext } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Heart from "../components/Heart";
import FallingStarCanvas from "../components/FallingStarCanvas";
import { UserContext } from "../App"

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const { setUser } = useContext(UserContext);

  const handleSubmit = async (e) => {
    console.log("🔥 handleSubmit BẮT ĐẦU");
    e.preventDefault();
    console.log("📤 Dữ liệu gửi đi:", form);

    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, form, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("✅ Phản hồi từ server:", res.data);
      console.log("👤 User data:", res.data.user);

      const user = res.data.user;

      // ✅ Kiểm tra user có đủ thông tin không
      if (!user || !user.id) {
        console.error("❌ User data thiếu thông tin!");
        setMessage("Lỗi: Server không trả về đầy đủ thông tin user");
        return;
      }

      // ✅ Lưu VÀO sessionStorage (đầy đủ dữ liệu)
    const userForChat = {
      _id: user.id || user._id,  // ✅ Hỗ trợ cả 2 trường hợp
      id: user.id,               
      name: user.name,
      email: user.email,
      gender: user.gender,
      age: user.age,
      avatar: user.avatar || "",
      job: user.job || "",
      hometown: user.hometown || "",
      hobbies: user.hobbies || [],        // ✅ Thêm dòng này
      zodiac: user.zodiac || "Chưa rõ",   // ✅ Nếu bạn có trường này
      lookingFor: user.lookingFor || "Tất cả", // ✅ Nếu có trong schema
      isProfileComplete: user.isProfileComplete,
    };


      console.log("💾 Data sẽ lưu vào sessionStorage:", userForChat);

      sessionStorage.setItem("user", JSON.stringify(userForChat));

      setUser(userForChat);

      // ✅ Kiểm tra đã lưu thành công chưa
      const saved = sessionStorage.getItem("user");
      console.log("🔍 Kiểm tra lại sessionStorage:", saved);

      if (saved) {
        console.log("✅ sessionStorage đã lưu thành công!");
      } else {
        console.error("❌ sessionStorage KHÔNG LƯU ĐƯỢC!");
        alert("Không thể lưu thông tin đăng nhập! Vui lòng kiểm tra cài đặt trình duyệt.");
        return;
      }

      window.dispatchEvent(new Event("userChanged"));

      // 🔥 Kiểm tra profile đã hoàn thiện chưa
      if (!user.isProfileComplete) {
        console.log("➡️ Chuyển đến /complete-profile");
        navigate("/complete-profile");
      } else {
        console.log("➡️ Chuyển đến /");
        navigate("/home");
      }
    } catch (err) {
      console.error("❌ Lỗi đăng nhập:", err);
      console.error("❌ Response:", err.response?.data);
      setMessage(err.response?.data?.message || "Lỗi kết nối tới server!");
    }
  };

  return(
        <div className="relative w-full h-screen flex items-center justify-center bg-gradient-to-b from-black via-purple-900 to-black text-white overflow-hidden ">
            <FallingStarCanvas/>
            <div className = "loginForm text-white flex w-[1100px] h-[500px] items-center justify-center relative overflow-hidden border-2 border-white/10 rounded-xl" >
                <div className="content absolute top-0 left-0 w-[700px] h-full bg-black/10 items-center justify-center flex flex-col pb-0">
                  <h1 className="font-bold text-3xl h-[50px] pt-10">Welcome</h1>
                  <div className="flex-1 w-full relative">
                    <Heart/>
                  </div>
                </div>
                <form onSubmit={handleSubmit} className="login absolute w-[400px] h-full right-0 flex flex-col justify-center items-center bg-white/10 bg-opacity-10 p-10 z-10  border-white/20 backdrop-blur-90 rounded-xl">
                  <div className="login absolute w-[400px] h-full right-0 flex flex-col justify-center items-center bg-white/10 bg-opacity-10 p-10 z-10  border-white/20 backdrop-blur-90 rounded-xl ">
                      <h2 className="text-3xl font-bold text-white mb-6">Login</h2>
                      <div className="input w-full mb-4">
                          <input 
                          type="email"
                          placeholder="Email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          required
                          autoComplete="email"
                          className="inputform w-full rounded-lg bg-white/20 placeholder-white/60 backdrop-blur-md p-3 focus:outline-none focus:ring-2 focus:ring-ping-300" />
                      </div>
                      <div className="input w-full mb-4">
                          <input 
                          type="password"
                          placeholder="Password"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          required
                          autoComplete="current-password"
                          className="inputform w-full rounded-lg bg-white/20 placeholder-white/60 backdrop-blur-md p-3 focus:outline-none focus:ring-2 focus:ring-ping-300" />
                      </div>
                      <div className="check w-full mb-4 flex justify-between text-white/80 text-sm items-center">
                          <div className="flex gap-2">
                              <input type="checkbox" id="rememberMe" className="accent-ping-300" />   
                              <label htmlFor="rememberMe"> Remember me</label>
                          </div>
                          <a href="#" className="hover:text-pink-500">Forgot Password</a>
                      </div>
                      <div className="input w-full mb-4 ">
                          <button 
                          className="btn w-full bg-pink-300 hover:bg-pink-600 text-white font-semibold py-2 rounded-md shadow-lg">
                              Sign in
                          </button>
                      </div>
                      <div className="sign-up text-center">
                          <p className="mb-1 text-white/80">Don't have an account?</p>
                          <a href="/register" className="w-full text-pink-300 hover:text-pink-400">Sign Up</a>
                      </div>
                  </div>
                </form>

            </div>
        </div>

    );}
