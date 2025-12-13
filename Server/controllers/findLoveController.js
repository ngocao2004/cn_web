import httpStatus from 'http-status';
import { findLoveService } from '../services/findLoveService.js';

export const getSwipeDeck = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;

    const result = await findLoveService.getSwipeDeck(userId, { limit });

    return res.status(httpStatus.OK).json({
      success: true,
      data: result.deck,
      total: result.total,
    });
  } catch (error) {
    const status = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || 'Không thể tải danh sách hồ sơ.';
    return res.status(status).json({ success: false, message });
  }
};

export const submitSwipe = async (req, res) => {
  try {
    const { userId } = req.params;
    const { targetId, action } = req.body || {};

    if (!targetId) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Thiếu targetId.',
      });
    }

    const result = await findLoveService.registerSwipe(userId, targetId, action);

    return res.status(httpStatus.OK).json({
      success: true,
      ...result,
    });
  } catch (error) {
    const status = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || 'Không thể lưu hành động swiping.';
    return res.status(status).json({ success: false, message });
  }
};
