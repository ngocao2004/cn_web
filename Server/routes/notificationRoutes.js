import { Notification } from '../models/Notification.js';
import express from 'express';

const notifRouter = express.Router();

// GET notifications
notifRouter.get('/notifications', async (req, res) => {
  try {
    const { userId, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('senderId', 'name avatar')
      .populate('postId', 'content images')
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipientId: userId,
      isRead: false
    });

    res.json({
      success: true,
      notifications,
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// MARK as read
notifRouter.put('/notifications/:notifId/read', async (req, res) => {
  try {
    const { notifId } = req.params;

    await Notification.findByIdAndUpdate(notifId, {
      isRead: true,
      readAt: new Date()
    });

    res.json({
      success: true
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// MARK all as read
notifRouter.put('/notifications/read-all', async (req, res) => {
  try {
    const { userId } = req.body;

    await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export { notifRouter };