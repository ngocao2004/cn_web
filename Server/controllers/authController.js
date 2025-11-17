// controllers/authController.js
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // ✅ CHECK: Profile có đầy đủ thông tin không
    const isProfileComplete = !!(
      user.gender && 
      user.age && 
      user.career && 
      user.career !== 'Chưa cập nhật' && 
      user.location && 
      user.location !== 'Chưa cập nhật' && 
      user.zodiac && 
      user.zodiac !== 'Chưa rõ'
    );

    // ✅ TRẢ VỀ đúng format mà frontend cần
    res.json({
      success: true,
      message: `Đăng nhập thành công! Chào ${user.name} 💖`,
      user: {
        id: user._id.toString(),        // ✅ Thêm field 'id'
        _id: user._id.toString(),       // ✅ Giữ lại '_id'
        name: user.name,
        email: user.email,
        gender: user.gender || '',
        age: user.age || null,
        avatar: user.avatar || '',
        job: user.career || '',         // ✅ Map 'career' -> 'job'
        hometown: user.location || '',   // ✅ Map 'location' -> 'hometown'
        career: user.career || '',      // ✅ Giữ lại 'career'
        location: user.location || '',  // ✅ Giữ lại 'location'
        zodiac: user.zodiac || '',
        hobbies: user.hobbies || [],
        bio: user.bio || '',
        lookingFor: user.lookingFor || 'Tất cả',
        ageRange: user.ageRange || { min: 18, max: 99 },
        isProfileComplete,              // ✅ Field quan trọng nhất
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// Register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // ✅ TRẢ VỀ đúng format
    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công!',
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        gender: user.gender || '',
        age: user.age || null,
        avatar: user.avatar || '',
        job: user.career || '',
        hometown: user.location || '',
        career: user.career || '',
        location: user.location || '',
        zodiac: user.zodiac || '',
        hobbies: user.hobbies || [],
        bio: user.bio || '',
        lookingFor: user.lookingFor || 'Tất cả',
        ageRange: user.ageRange || { min: 18, max: 99 },
        isProfileComplete: false,  // ✅ Mới đăng ký = chưa hoàn thiện
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};



// Update Profile
export const updateProfile = async (req, res) => {
  try {
    // ✅ LẤY userId từ sessionStorage (tạm thời)
    // Trong production nên dùng JWT token
    const userId = req.body.userId || req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu userId'
      });
    }

    const { 
      gender, 
      age, 
      career, 
      hobbies, 
      location, 
      zodiac,
      bio,
      lookingFor,
      ageRange
    } = req.body;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User không tồn tại'
      });
    }

    // Update fields
    if (gender) user.gender = gender;
    if (age) user.age = age;
    if (career) user.career = career;
    if (hobbies) user.hobbies = hobbies;
    if (location) user.location = location;
    if (zodiac) user.zodiac = zodiac;
    if (bio !== undefined) user.bio = bio;
    if (lookingFor) user.lookingFor = lookingFor;
    if (ageRange) user.ageRange = ageRange;

    await user.save();

    // Check if profile is complete
    const isProfileComplete = !!(
      user.gender && 
      user.age && 
      user.career && 
      user.career !== 'Chưa cập nhật' && 
      user.location && 
      user.location !== 'Chưa cập nhật' && 
      user.zodiac && 
      user.zodiac !== 'Chưa rõ'
    );

    // ✅ TRẢ VỀ đúng format
    res.json({
      success: true,
      message: 'Cập nhật profile thành công!',
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        gender: user.gender || '',
        age: user.age || null,
        avatar: user.avatar || '',
        job: user.career || '',
        hometown: user.location || '',
        career: user.career || '',
        location: user.location || '',
        zodiac: user.zodiac || '',
        hobbies: user.hobbies || [],
        bio: user.bio || '',
        lookingFor: user.lookingFor || 'Tất cả',
        ageRange: user.ageRange || { min: 18, max: 99 },
        isProfileComplete,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};




// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        gender: user.gender || '',
        age: user.age || null,
        avatar: user.avatar || '',
        job: user.career || '',
        hometown: user.location || '',
        career: user.career || '',
        location: user.location || '',
        zodiac: user.zodiac || '',
        hobbies: user.hobbies || [],
        bio: user.bio || '',
        lookingFor: user.lookingFor || 'Tất cả',
        ageRange: user.ageRange || { min: 18, max: 99 },
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy profile:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message
    });
  }
};





