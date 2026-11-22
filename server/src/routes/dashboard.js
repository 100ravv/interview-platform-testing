import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { InterviewSession } from '../models/InterviewSession.js';
import { Meeting } from '../models/Meeting.js';

const router = Router();
router.get('/', requireAuth, asyncHandler(async (req, res) => res.json({
  user: req.user.toSafeJSON(),
  summary: { sessionsCompleted: await InterviewSession.countDocuments({ user: req.user.id, status: 'completed' }), upcomingInterviews: await Meeting.countDocuments({ $or: [{ student: req.user.id }, { interviewer: req.user.id }], status: { $in: ['pending', 'accepted'] }, scheduledAt: { $gte: new Date() } }) },
})));
export default router;
