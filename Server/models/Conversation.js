import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  
  // ✅ THÊM field messages này
  messages: [{
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  
  // Link to match
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match'
  },
  
  // Last message (để hiển thị preview)
  lastMessage: {
    text: String,
    senderId: mongoose.Schema.Types.ObjectId,
    timestamp: Date
  },
  
  // Unread count cho mỗi user
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  
  // Typing indicator
  typing: {
    type: Map,
    of: Boolean,
    default: new Map()
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
}, {
  timestamps: true
});

conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

export default mongoose.model('Conversation', conversationSchema);