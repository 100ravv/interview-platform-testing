import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { loginSchema, registerSchema } from '../validation/auth.js';

const router = Router();
const signToken = (user) => jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

router.post('/register', asyncHandler(async (req, res) => {
  const input = registerSchema.parse(req.body);
  const existing = await User.exists({ email: input.email.toLowerCase() });
  if (existing) return res.status(409).json({ message: 'An account with this email already exists.' });
  const user = await User.create(input);
  return res.status(201).json({ token: signToken(user), user: user.toSafeJSON() });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await User.findOne({ email: input.email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(input.password))) {
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }
  return res.json({ token: signToken(user), user: user.toSafeJSON() });
}));

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user.toSafeJSON() }));

export default router;
