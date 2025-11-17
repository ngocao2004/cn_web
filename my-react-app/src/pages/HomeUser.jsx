import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  // Kiểm tra nếu chưa đăng nhập thì quay lại login
  useEffect(() => {
    const user = sessionStorage.getItem("user");
    if (!user) {
      navigate("/login");
    }
  }, [navigate]);

  const user = JSON.parse(sessionStorage.getItem("user"));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 to-pink-200">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-pink-600 mb-4">
          💕 Chào mừng, {user?.name || "Người dùng"}!
        </h1>
        <p className="text-gray-600 mb-6">
          Chúc bạn có một ngày tuyệt vời cùng LoveConnect 💖
        </p>
      </div>
    </div>
  );
}
