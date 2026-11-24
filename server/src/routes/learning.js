import { Router } from 'express';
import { LearningResource } from '../models/LearningResource.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();
router.use(requireAuth);

router.get('/resources', asyncHandler(async (req, res) => {
  const resources = await LearningResource.find().select('subject title description type level provider url order').sort({ subject: 1, order: 1, title: 1 }).limit(200).lean();
  return res.json({ resources: resources.map(({ _id, subject, title, description, type, level, provider, url }) => ({ id: String(_id), subject, title, description, type, level, provider, url })) });
}));

export default router;
