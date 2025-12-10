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
  gender: { 
    type: String, 
    enum: ['Male', 'Female', 'Other'], 
    default: 'Other'  // Thêm default
  },

  classYear: {
    type: String,
    default: 'Not updated'
  },

  preferences: {
    lookingFor: { 
      type: String, 
      enum: ['Male', 'Female', 'All'],
      default: 'All'
    },
    connectionGoal: {
      type: String,
      enum: ['study', 'friendship', 'relationship', ''],
      default: ''
    },
    studySubjects: {
      type: [String],
      default: []
    },
    ageRange: {
      min: { type: Number, default: 18 },
      max: { type: Number, default: 99 }
    },
    distance: { type: Number, default: 50 } 
  },

  dob: { 
    type: Date,
    default: null
  },
  career: { 
    type: String,
    default: 'Not updated'  // Thêm default
  },
  hobbies: { 
    type: [String],
    default: []
  },
  studySubjects: {
    type: [String],
    default: []
  },
  academicHighlights: {
    type: String,
    default: ''
  },
  connectionGoal: {
    type: String,
    enum: ['friendship', 'relationship', ''],
    default: ''
  },
  location: {
    type: String,
    default: 'Not updated'
  },
  geoLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    } // [longitude, latitude]
  },
  hometown: {
    type: String,
    default: 'Not updated'
  },
  zodiac: { 
    type: String,
    default: 'Unknown'  // Thêm default
  },
  bio: {
    type: String,
    default: 'Not updated'
  },
  
  photoGallery: {
    type: [String],
    default: []
  },

  
  // Profile completion status
  profileCompleted: {
    type: Boolean,
    default: false
  },
  
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastActive: { 
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true  // Tự động tạo createdAt và updatedAt
});

userSchema.index({ geoLocation: '2dsphere' });
userSchema.methods.isProfileComplete = function() {
  const hasHobbies = Array.isArray(this.hobbies) && this.hobbies.length > 0;
  const hasStudySubjects = Array.isArray(this.studySubjects) && this.studySubjects.length > 0;
  const hasDob = this.dob instanceof Date && !Number.isNaN(this.dob.valueOf());
  const hometownFilled = typeof this.hometown === 'string' && this.hometown.trim() !== '' && this.hometown !== 'Not updated';
  const locationFilled = typeof this.location === 'string' && this.location !== 'Not updated';
  const careerFilled = typeof this.career === 'string' && this.career !== 'Not updated';
  const classYearFilled = typeof this.classYear === 'string' && this.classYear !== 'Not updated';
  const bioFilled = typeof this.bio === 'string' && this.bio !== 'Not updated' && this.bio.trim().length > 0;
  const zodiacFilled = typeof this.zodiac === 'string' && this.zodiac !== 'Unknown';
  const connectionGoalFilled = typeof this.connectionGoal === 'string' && this.connectionGoal !== '';

  return Boolean(
    this.gender
    && hasDob
    && careerFilled
    && locationFilled
    && bioFilled
    && hasHobbies
    && hasStudySubjects
    && typeof this.academicHighlights === 'string' && this.academicHighlights.trim().length > 0
    && connectionGoalFilled
    && classYearFilled
    && hometownFilled
    && zodiacFilled
  );
};

userSchema.virtual('age').get(function() {
    if (!this.dob) return null;
    const today = new Date();
    const birthDate = new Date(this.dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
});

// Thiết lập JSON/Object để bao gồm Virtuals
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

export default mongoose.model('User', userSchema);