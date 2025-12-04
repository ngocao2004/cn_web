import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Heart from "../components/Heart";
import FallingStarCanvas from "../components/FallingStarCanvas";

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
    <div className="relative w-full h-screen flex items-center justify-center bg-gradient-to-b from-black via-purple-900 to-black text-white overflow-hidden">
      <FallingStarCanvas/>
      <div className="registerForm text-white flex w-[1100px] h-[500px] items-center justify-center relative overflow-hidden border-2 border-white/10 rounded-xl">
        <div className="content absolute top-0 left-0 w-[700px] h-full bg-black/10 items-center justify-center flex flex-col pb-0">
            <h1 className="font-bold text-3xl h-[50px] pt-10">Welcome</h1>
            <div className="flex-1 w-full relative">
              <Heart/>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="login absolute w-[400px] h-full right-0 flex flex-col justify-center items-center bg-white/10 bg-opacity-10 p-10 z-10  border-white/20 backdrop-blur-90 rounded-xl">
        <div className="login absolute w-[400px] h-full right-0 flex flex-col justify-center items-center bg-white/10 bg-opacity-10 p-10 z-10  border-white/20 backdrop-blur-90 rounded-xl ">
          <h2 className="text-3xl font-bold text-center text-white mb-6">
            Sign up
          </h2>
          <div className="input w-full mb-4">
            <input
              type="text"
              placeholder="Usrername"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="inputform w-full rounded-lg bg-white/20 placeholder-white/60 backdrop-blur-md p-3 focus:outline-none focus:ring-2 focus:ring-ping-300" 
              />
          </div>

          <div className="input w-full mb-4">
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="inputform w-full rounded-lg bg-white/20 placeholder-white/60 backdrop-blur-md p-3 focus:outline-none focus:ring-2 focus:ring-ping-300"
            />
          </div>
          <div className="input w-full mb-4">
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="inputform w-full rounded-lg bg-white/20 placeholder-white/60 backdrop-blur-md p-3 focus:outline-none focus:ring-2 focus:ring-ping-300"
            />
          </div>

          <button
            className="btn w-full bg-pink-300 hover:bg-pink-600 text-white font-semibold py-2 rounded-md shadow-lg">
            Sign up
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
        </div>
        </form>
      </div>
    </div>
  );
}
