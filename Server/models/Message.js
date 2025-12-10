import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chatRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
    index: true
  },
  
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, 
    index: true
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
  
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  
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


}, {
  timestamps: true
});

messageSchema.index({ chatRoomId: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
