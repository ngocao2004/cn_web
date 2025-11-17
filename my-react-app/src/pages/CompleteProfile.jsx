// src/pages/CompleteProfile.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;
  const [formData, setFormData] = useState({
    gender: '',
    age: '',
    career: '',
    hobbies: [],
    location: '',
    zodiac: '',
    bio: '',
    lookingFor: 'Tất cả'
  });
  const [hobbyInput, setHobbyInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const userData = sessionStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    console.log('📦 Current user data:', parsedUser);
    setUser(parsedUser);
    
    // Pre-fill existing data
    setFormData({
      gender: parsedUser.gender || '',
      age: parsedUser.age || '',
      career: parsedUser.career || parsedUser.job || '',
      hobbies: parsedUser.hobbies || [],
      location: parsedUser.location || parsedUser.hometown || '',
      zodiac: parsedUser.zodiac || '',
      bio: parsedUser.bio || '',
      lookingFor: parsedUser.lookingFor || 'Tất cả'
    });
  }, [navigate]);

  const handleAddHobby = () => {
    if (hobbyInput.trim() && !formData.hobbies.includes(hobbyInput.trim())) {
      setFormData({
        ...formData,
        hobbies: [...formData.hobbies, hobbyInput.trim()]
      });
      setHobbyInput('');
    }
  };

  const handleRemoveHobby = (hobby) => {
    setFormData({
      ...formData,
      hobbies: formData.hobbies.filter(h => h !== hobby)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('Không tìm thấy thông tin user');
      return;
    }

    // Validation
    if (!formData.gender || !formData.age || !formData.career || !formData.location || !formData.zodiac) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc (*)');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📤 Sending update:', { 
        ...formData, 
        userId: user.id || user._id 
      });

      const res = await axios.put(
        `${API_URL}/api/auth/profile`,
        {
          ...formData,
          userId: user.id || user._id  // ✅ Hỗ trợ cả 2 format
        }
      );

      console.log('✅ Update response:', res.data);

      if (res.data.success) {
        // ✅ CẬP NHẬT sessionStorage với FULL fields
        const updatedUser = {
          // Giữ lại các field cũ
          ...user,
          // Override với data mới từ server
          ...res.data.user,
          // ✅ MAP thêm để tương thích với Chat.jsx
          id: res.data.user.id || res.data.user._id,
          _id: res.data.user._id || res.data.user.id,
          job: res.data.user.career || res.data.user.job,
          hometown: res.data.user.location || res.data.user.hometown,
          // Đảm bảo có đủ các field cho matching
          gender: res.data.user.gender,
          age: res.data.user.age,
          career: res.data.user.career,
          location: res.data.user.location,
          zodiac: res.data.user.zodiac,
          hobbies: res.data.user.hobbies || [],
          bio: res.data.user.bio || '',
          lookingFor: res.data.user.lookingFor || 'Tất cả',
          isProfileComplete: res.data.user.isProfileComplete
        };
        
        console.log('💾 Saving to sessionStorage:', updatedUser);
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        
        // ✅ Trigger event để các component khác update
        window.dispatchEvent(new Event('userChanged'));
        
        alert('✅ Cập nhật profile thành công!');
        
        // Redirect về home
        setTimeout(() => {
          navigate('/');
        }, 500);
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      console.error('Error response:', error.response?.data);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 p-8 pt-20">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          Hoàn thiện hồ sơ 💖
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Chào {user.name}! Hãy cho chúng tôi biết thêm về bạn
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Gender */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Giới tính <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({...formData, gender: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-400"
              required
            >
              <option value="">Chọn giới tính</option>
              <option value="Nam">Nam 👨</option>
              <option value="Nữ">Nữ 👩</option>
              <option value="Khác">Khác 🌈</option>
            </select>
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Tuổi <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({...formData, age: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-400"
              required
              min="18"
              max="99"
              placeholder="VD: 25"
            />
          </div>

          {/* Career */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Nghề nghiệp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.career}
              onChange={(e) => setFormData({...formData, career: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-400"
              placeholder="VD: Lập trình viên, Giáo viên, Bác sĩ..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Tip: Càng cụ thể càng tốt để tìm người phù hợp!
            </p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Quê quán <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-400"
              placeholder="VD: Hà Nội, TP.HCM, Đà Nẵng..."
              required
            />
          </div>

          {/* Zodiac */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Cung hoàng đạo <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.zodiac}
              onChange={(e) => setFormData({...formData, zodiac: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-400"
              required
            >
              <option value="">Chọn cung hoàng đạo</option>
              <option value="Bạch Dương">♈ Bạch Dương (21/3 - 19/4)</option>
              <option value="Kim Ngưu">♉ Kim Ngưu (20/4 - 20/5)</option>
              <option value="Song Tử">♊ Song Tử (21/5 - 20/6)</option>
              <option value="Cự Giải">♋ Cự Giải (21/6 - 22/7)</option>
              <option value="Sư Tử">♌ Sư Tử (23/7 - 22/8)</option>
              <option value="Xử Nữ">♍ Xử Nữ (23/8 - 22/9)</option>
              <option value="Thiên Bình">♎ Thiên Bình (23/9 - 22/10)</option>
              <option value="Bọ Cạp">♏ Bọ Cạp (23/10 - 21/11)</option>
              <option value="Nhân Mã">♐ Nhân Mã (22/11 - 21/12)</option>
              <option value="Ma Kết">♑ Ma Kết (22/12 - 19/1)</option>
              <option value="Bảo Bình">♒ Bảo Bình (20/1 - 18/2)</option>
              <option value="Song Ngư">♓ Song Ngư (19/2 - 20/3)</option>
            </select>
          </div>

          {/* Hobbies */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Sở thích ({formData.hobbies.length})
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={hobbyInput}
                onChange={(e) => setHobbyInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddHobby();
                  }
                }}
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-400"
                placeholder="VD: Đọc sách, Du lịch, Gym, Xem phim..."
              />
              <button
                type="button"
                onClick={handleAddHobby}
                className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition"
              >
                Thêm
              </button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {formData.hobbies.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Chưa có sở thích nào. Hãy thêm vào!</p>
              ) : (
                formData.hobbies.map((hobby, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm flex items-center gap-2 hover:bg-pink-200 transition"
                  >
                    {hobby}
                    <button
                      type="button"
                      onClick={() => handleRemoveHobby(hobby)}
                      className="text-pink-700 hover:text-pink-900 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              💡 Sở thích giúp tìm người có cùng đam mê!
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Giới thiệu bản thân ({formData.bio.length}/500)
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setFormData({...formData, bio: e.target.value});
                }
              }}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-400"
              rows="4"
              placeholder="Viết vài dòng về bản thân... Bạn thích làm gì? Điều gì khiến bạn hạnh phúc?"
            />
          </div>

          {/* Looking For */}
          <div>
            <label className="block text-sm font-medium mb-2">Bạn muốn tìm</label>
            <select
              value={formData.lookingFor}
              onChange={(e) => setFormData({...formData, lookingFor: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-400"
            >
              <option value="Tất cả">Tất cả 🌈</option>
              <option value="Nam">Nam 👨</option>
              <option value="Nữ">Nữ 👩</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang lưu...
              </span>
            ) : (
              '✨ Hoàn tất'
            )}
          </button>

          {/* Skip button (optional) */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full text-gray-500 hover:text-gray-700 text-sm underline"
          >
            Bỏ qua, cập nhật sau
          </button>
        </form>
      </div>
    </div>
  );
}