import { Router } from 'express';
import { Notification } from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();
router.use(requireAuth);
router.get('/', asyncHandler(async (req, res) => {
  const [items, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.user.id }).populate('actor', 'name').sort({ createdAt: -1 }).limit(30).lean(),
    Notification.countDocuments({ recipient: req.user.id, readAt: null }),
  ]);
  return res.json({ notifications: items.map((item) => ({ id: String(item._id), type: item.type, title: item.title, message: item.message, href: item.href, read: Boolean(item.readAt), createdAt: item.createdAt, actor: item.actor?.name || null })), unreadCount });
}));
router.patch('/read-all', asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user.id, readAt: null }, { $set: { readAt: new Date() } });
  return res.json({ updated: true });
}));
router.patch('/:notificationId/read', asyncHandler(async (req, res) => {
  const item = await Notification.findOneAndUpdate({ _id: req.params.notificationId, recipient: req.user.id, readAt: null }, { $set: { readAt: new Date() } }, { new: true });
  if (!item) return res.status(404).json({ message: 'Notification not found.' });
  return res.json({ updated: true });
}));
export default router;
