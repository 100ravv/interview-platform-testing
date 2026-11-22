import { Router } from 'express';
import { User } from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();
router.get('/users', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).limit(100);
  return res.json({ users: users.map((user) => user.toSafeJSON()) });
}));
export default router;
