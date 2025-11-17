import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Profile() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;
  
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    career: "",      // job
    location: "",    // hometown
    hobbies: "",
    bio: "",
    avatar: "",
    lookingFor: "",
    ageRange: { min: 18, max: 99 },
    zodiac: ""
  });

  const [previewImage, setPreviewImage] = useState(null);

  // ✅ Load profile từ database
  useEffect(() => {
    if (!currentUser.id) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auth/profile/${currentUser.id}`);
        setProfile(res.data.user);
        
        // Set form data
        setForm({
          name: res.data.user.name || "",
          age: res.data.user.age || "",
          gender: res.data.user.gender || "",
          career: res.data.user.career || "",
          location: res.data.user.location || "",
          hobbies: res.data.user.hobbies ? res.data.user.hobbies.join(", ") : "",
          bio: res.data.user.bio || "",
          avatar: res.data.user.avatar || "",
          lookingFor: res.data.user.lookingFor || "Tất cả",
          ageRange: res.data.user.ageRange || { min: 18, max: 99 },
          zodiac: res.data.user.zodiac || ""
        });

        setPreviewImage(res.data.user.avatar);
        setLoading(false);
      } catch (err) {
        console.error("❌ Lỗi khi tải profile:", err);
        setMessage("Không thể tải thông tin profile!");
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser.id, navigate]);

  // ✅ Xử lý chọn ảnh
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("❌ Vui lòng chọn file ảnh!");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("❌ Ảnh không được vượt quá 2MB!");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, avatar: reader.result });
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // ✅ Xử lý cập nhật profile
  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await axios.put(`${API_URL}/api/auth/profile`, {
        ...form,
        userId: currentUser._id,
        hobbies: form.hobbies.split(",").map(i => i.trim())
      });

      setProfile(res.data.user);
      setIsEditing(false);
      setMessage("✅ Cập nhật profile thành công!");

      // ✅ Cập nhật sessionStorage nếu đổi tên hoặc avatar
      const updatedUser = {
        ...currentUser,
        name: res.data.user.name,
        avatar: res.data.user.avatar
      };
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("userChanged"));

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật:", err);
      setMessage("❌ Không thể cập nhật profile!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center">
        <div className="text-2xl text-pink-600">⏳ Đang tải...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center">
        <div className="text-2xl text-red-600">❌ Không tìm thấy profile</div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gradient-to-br from-pink-100 to-pink-200 p-8">
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-pink-600 h-32"></div>

      <div className="px-8 pb-8">
        {/* Avatar */}
        <div className="flex justify-center -mt-16 mb-4">
          <div className="relative">
            {isEditing ? (
              <label className="cursor-pointer">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-gray-100 flex items-center justify-center shadow-lg">
                  {previewImage ? (
                    <img src={previewImage} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl">👤</span>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 bg-pink-500 text-white rounded-full p-2 shadow-lg hover:bg-pink-600">
                  📷
                </div>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            ) : (
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-gray-100 flex items-center justify-center shadow-lg">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl">👤</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Thông báo */}
        {message && (
          <div
            className={`text-center mb-4 p-3 rounded-lg ${
              message.includes("✅") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* Chế độ xem */}
        {!isEditing ? (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{profile.name}</h1>
              <p className="text-gray-600">{profile.email}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-pink-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm mb-1">Tuổi</p>
                <p className="text-lg font-semibold text-gray-800">{profile.age || "Chưa cập nhật"}</p>
              </div>

              <div className="bg-pink-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm mb-1">Giới tính</p>
                <p className="text-lg font-semibold text-gray-800">{profile.gender || "Chưa cập nhật"}</p>
              </div>

              <div className="bg-pink-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm mb-1">Nghề nghiệp</p>
                <p className="text-lg font-semibold text-gray-800">{profile.career || "Chưa cập nhật"}</p>
              </div>

              <div className="bg-pink-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm mb-1">Quê quán</p>
                <p className="text-lg font-semibold text-gray-800">{profile.location || "Chưa cập nhật"}</p>
              </div>

              <div className="bg-pink-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm mb-1">Cung hoàng đạo</p>
                <p className="text-lg font-semibold text-gray-800">{profile.zodiac || "Chưa cập nhật"}</p>
              </div>

              <div className="bg-pink-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm mb-1">Đang tìm</p>
                <p className="text-lg font-semibold text-gray-800">{profile.lookingFor || "Tất cả"}</p>
              </div>

              <div className="bg-pink-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm mb-1">Khoảng tuổi</p>
                <p className="text-lg font-semibold text-gray-800">
                  {profile.ageRange ? `${profile.ageRange.min} - ${profile.ageRange.max}` : "Chưa cập nhật"}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 text-sm mb-2">Sở thích</p>
              <div className="flex flex-wrap gap-2">
                {profile.hobbies && profile.hobbies.length > 0 ? (
                  profile.hobbies.map((hobbie, index) => (
                    <span key={index} className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-sm">
                      {hobbie}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400">Chưa có sở thích</span>
                )}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 text-sm mb-2">Giới thiệu</p>
              <p className="text-lg font-semibold text-gray-800 bg-pink-50 p-4 rounded-lg">
                {profile.bio || "Chưa có giới thiệu"}
              </p>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition font-semibold"
            >
              ✏️ Chỉnh sửa profile
            </button>
          </div>
        ) : (
          // Chế độ chỉnh sửa
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Tên</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:outline-none"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Tuổi</label>
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Giới tính</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:outline-none"
                >
                  <option value="">Chọn giới tính</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Nghề nghiệp</label>
              <input
                type="text"
                value={form.career}
                onChange={(e) => setForm({ ...form, career: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Quê quán</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Cung hoàng đạo</label>
              <input
                type="text"
                value={form.zodiac}
                onChange={(e) => setForm({ ...form, zodiac: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Đang tìm</label>
              <input
                type="text"
                value={form.lookingFor}
                onChange={(e) => setForm({ ...form, lookingFor: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:outline-none"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Tuổi từ</label>
                <input
                  type="number"
                  min="18"
                  max="99"
                  value={form.ageRange.min}
                  onChange={(e) =>
                    setForm({ ...form, ageRange: { ...form.ageRange, min: e.target.value } })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Đến tuổi</label>
                <input
                  type="number"
                  min="18"
                  max="99"
                  value={form.ageRange.max}
                  onChange={(e) =>
                    setForm({ ...form, ageRange: { ...form.ageRange, max: e.target.value } })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Sở thích (Cách nhau bằng dấu phẩy)</label>
              <input
                type="text"
                value={form.hobbies}
                onChange={(e) => setForm({ ...form, hobbies: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Giới thiệu</label>
              <textarea
                rows="4"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:outline-none"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition font-semibold"
              >
                💾 Lưu thay đổi
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setMessage("");
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition font-semibold"
              >
                ❌ Hủy
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  </div>
);
}
