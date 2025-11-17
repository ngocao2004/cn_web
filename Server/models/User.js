// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  
  // Profile info - CẦN CHO MATCHING
  gender: { 
    type: String, 
    enum: ['Nam', 'Nữ', 'Khác'], 
    default: 'Khác'  // Thêm default
  },
  lookingFor: { 
    type: String, 
    enum: ['Nam', 'Nữ', 'Tất cả'],
    default: 'Tất cả'
  },
  age: { 
    type: Number,
    default: 18  // Thêm default
  },
  career: { 
    type: String,
    default: 'Chưa cập nhật'  // Thêm default
  },
  hobbies: { 
    type: [String],
    default: []
  },
  location: { 
    type: String,
    default: 'Chưa cập nhật'  // Thêm default
  },
  zodiac: { 
    type: String,
    default: 'Chưa rõ'  // Thêm default
  },
  
  // Bio
  bio: {
    type: String,
    default: ''
  },
  
  // Avatar
  avatar: {
    type: String,
    default: ''
  },
  
  // Matching preferences
  ageRange: {
    min: { type: Number, default: 18 },
    max: { type: Number, default: 99 }
  },
  
  // Profile completion status
  profileCompleted: {
    type: Boolean,
    default: false
  },
  
  // Matching history
  matches: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: { type: Number },
    matchedAt: { type: Date, default: Date.now }
  }],
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true  // Tự động tạo createdAt và updatedAt
});

// Method để check profile đã hoàn thiện chưa
userSchema.methods.isProfileComplete = function() {
  return this.gender && 
         this.age && 
         this.career !== 'Chưa cập nhật' && 
         this.location !== 'Chưa cập nhật' && 
         this.zodiac !== 'Chưa rõ';
};

export default mongoose.model('User', userSchema);