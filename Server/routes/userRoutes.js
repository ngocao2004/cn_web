import express from 'express';
import { getProfile, updateProfile } from '../controllers/userController.js';

const router = express.Router();

router.get('/:userId/profile', getProfile);
router.put('/:userId/profile', updateProfile);

export default router;
