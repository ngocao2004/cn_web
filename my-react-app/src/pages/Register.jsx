import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("📤 Dữ liệu gửi đi:", form);

    try {
      const res = await axios.post(
         `${API_URL}/api/auth/register`,
        form,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("✅ Server trả về:", res.data);
      setMessage(res.data.message);
      setForm({ name: "", email: "", password: "" }); // reset form sau khi đăng ký
    } catch (err) {
      console.error("❌ Lỗi khi gửi request:", err);
      setMessage(err.response?.data?.message || "Lỗi kết nối tới server!");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 to-pink-200">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-pink-600 mb-6">
          💕 Tạo tài khoản LoveConnect
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Họ tên"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:outline-none"
          />

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:outline-none"
          />

          <input
            type="password"
            placeholder="Mật khẩu"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:outline-none"
          />

          <button
            type="submit"
            className="w-full bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition"
          >
            Đăng ký
          </button>

          {message && (
            <p className="text-center text-sm text-gray-700 mt-2">{message}</p>
          )}

          <p className="text-center text-gray-600 text-sm mt-4">
            Đã có tài khoản?{" "}
            <Link to="/login" className="text-pink-500 hover:underline">
              Đăng nhập
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
