import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

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
        navigate("/");
      }
    } catch (err) {
      console.error("❌ Lỗi đăng nhập:", err);
      console.error("❌ Response:", err.response?.data);
      setMessage(err.response?.data?.message || "Lỗi kết nối tới server!");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 to-pink-200">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-pink-600 mb-6">
          💖 Đăng nhập LoveConnect
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Email</label>
            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Mật khẩu</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="current-password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition"
          >
            Đăng nhập
          </button>

          {message && (
            <p className="text-center text-sm text-gray-700 mt-2">{message}</p>
          )}

          <p className="text-center text-gray-600 text-sm mt-4">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-pink-500 hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}