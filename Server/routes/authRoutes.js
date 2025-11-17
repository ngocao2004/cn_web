// routes/authRoutes.js
import express from 'express';
import { 
  register, 
  login, 
  updateProfile ,
  getUserProfile
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/profile', updateProfile);
router.get("/profile/:id", getUserProfile);

export default router;