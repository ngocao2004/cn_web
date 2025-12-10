import httpStatus from 'http-status';
import { getUserProfile, updateUserProfile } from '../services/UserService.js';

export const getProfile = async (req, res) => {
    try {
        const userId = req.params.userId || req.query.userId;
        if (!userId) {
            return res.status(httpStatus.BAD_REQUEST).send({ message: 'Thiếu userId.' });
        }

        const user = await getUserProfile(userId);
        res.send({ user });
    } catch (error) {
        const status = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
        const message = error.message || 'Không thể lấy thông tin hồ sơ.';
        res.status(status).send({ message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { userId: bodyUserId, ...profileData } = req.body || {};
        const targetUserId = req.params.userId || bodyUserId;
        if (!targetUserId) {
            return res.status(httpStatus.BAD_REQUEST).send({ message: 'Thiếu userId.' });
        }

        const user = await updateUserProfile(targetUserId, profileData);

        res.send({
            success: true,
            message: 'Cập nhật profile thành công.',
            user,
        });
    } catch (error) {
        const status = error.statusCode || httpStatus.BAD_REQUEST;
        const message = error.message || 'Cập nhật profile thất bại.';
        res.status(status).send({ message });
    }
};
