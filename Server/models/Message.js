import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Content
  content: {
    type: String,
    required: true
  },
  
  // Type: text, image, file, emoji
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'emoji'],
    default: 'text'
  },
  
  // Read status
  readBy: [{
    userId: mongoose.Schema.Types.ObjectId,
    readAt: Date
  }],
  
  // Reactions
  reactions: [{
    userId: mongoose.Schema.Types.ObjectId,
    emoji: String
  }],
  
  // Reply to message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

messageSchema.index({ conversationId: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
