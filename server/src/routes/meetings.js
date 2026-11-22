import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { Meeting } from '../models/Meeting.js';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { createMeetingSchema, evaluationSchema, meetingResponseSchema } from '../validation/meeting.js';
import { createNotification } from '../services/notifications.js';
import { endMeetingRoom } from '../realtime.js';
import { isWithinMeetingWindow } from '../services/meetingWindow.js';

const router = Router();
router.use(requireAuth);
const meetingRequestLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'You have sent several interview requests. Try again later.' } });
const idOf = (value) => String(value?._id ?? value);
const isParticipant = (meeting, userId) => idOf(meeting.student) === String(userId) || idOf(meeting.interviewer) === String(userId);
const present = (meeting) => ({
  id: String(meeting._id), title: meeting.title, scheduledAt: meeting.scheduledAt,
  durationMinutes: meeting.durationMinutes, status: meeting.status,
  startedAt: meeting.startedAt, endedAt: meeting.endedAt,
  student: meeting.student?.toSafeJSON ? meeting.student.toSafeJSON() : { id: String(meeting.student?._id), name: meeting.student?.name, email: meeting.student?.email },
  interviewer: meeting.interviewer?.toSafeJSON ? meeting.interviewer.toSafeJSON() : { id: String(meeting.interviewer?._id), name: meeting.interviewer?.name, email: meeting.interviewer?.email },
  requestedBy: String(meeting.requestedBy), evaluation: meeting.status === 'completed' ? meeting.evaluation : undefined,
});

router.get('/', asyncHandler(async (req, res) => {
  const meetings = await Meeting.find({ $or: [{ student: req.user.id }, { interviewer: req.user.id }] })
    .populate('student', 'name email role').populate('interviewer', 'name email role').sort({ scheduledAt: -1 }).limit(100);
  return res.json({ meetings: meetings.map(present) });
}));

router.get('/:meetingId', asyncHandler(async (req, res) => {
  const meeting = await Meeting.findById(req.params.meetingId).populate('student', 'name email role').populate('interviewer', 'name email role');
  if (!meeting || !isParticipant(meeting, req.user.id)) return res.status(404).json({ message: 'Interview session not found.' });
  return res.json({ meeting: present(meeting) });
}));

router.post('/', meetingRequestLimiter, asyncHandler(async (req, res) => {
  if (!['student', 'interviewer'].includes(req.user.role)) return res.status(403).json({ message: 'Only students and interviewers can schedule a session.' });
  const input = createMeetingSchema.parse(req.body);
  const other = await User.findOne({ email: input.participantEmail.toLowerCase() });
  if (!other) return res.status(404).json({ message: 'No account was found for that email.' });
  if (String(other._id) === String(req.user.id)) return res.status(400).json({ message: 'Choose another participant.' });
  const expectedRole = req.user.role === 'student' ? 'interviewer' : 'student';
  if (other.role !== expectedRole) return res.status(400).json({ message: `Enter the email of an ${expectedRole} account.` });
  const student = req.user.role === 'student' ? req.user._id : other._id;
  const interviewer = req.user.role === 'interviewer' ? req.user._id : other._id;
  const startsAt = new Date(input.scheduledAt);
  const endsAt = new Date(startsAt.getTime() + input.durationMinutes * 60_000);
  const overlapping = await Meeting.find({
    $or: [{ student }, { interviewer }], status: { $in: ['pending', 'accepted'] }, scheduledAt: { $lt: endsAt },
  }).select('scheduledAt durationMinutes').lean();
  if (overlapping.some((item) => new Date(item.scheduledAt).getTime() + item.durationMinutes * 60_000 > startsAt.getTime())) {
    return res.status(409).json({ message: 'One of the participants already has an interview at that time.' });
  }
  const meeting = await Meeting.create({ title: input.title, scheduledAt: input.scheduledAt, durationMinutes: input.durationMinutes, student, interviewer, requestedBy: req.user.id });
  await createNotification({ recipient: other._id, actor: req.user.id, type: 'meeting_request', title: 'New mock interview request', message: `${req.user.name} invited you to: ${meeting.title}`, href: '/meetings' });
  await meeting.populate('student', 'name email role'); await meeting.populate('interviewer', 'name email role');
  return res.status(201).json({ meeting: present(meeting) });
}));

router.patch('/:meetingId/respond', asyncHandler(async (req, res) => {
  const input = meetingResponseSchema.parse(req.body);
  const meeting = await Meeting.findById(req.params.meetingId);
  if (!meeting || !isParticipant(meeting, req.user.id)) return res.status(404).json({ message: 'Interview session not found.' });
  if (String(meeting.requestedBy) === String(req.user.id)) return res.status(403).json({ message: 'Only the invited participant can respond to this request.' });
  if (meeting.status !== 'pending') return res.status(409).json({ message: 'This request is no longer pending.' });
  meeting.status = input.status; await meeting.save();
  const inviter = meeting.requestedBy;
  const responseVerb = input.status === 'accepted' ? 'accepted' : 'declined';
  await createNotification({ recipient: inviter, actor: req.user.id, type: 'meeting_response', title: `Interview request ${responseVerb}`, message: `${req.user.name} ${responseVerb} “${meeting.title}”.`, href: '/meetings' });
  await meeting.populate('student', 'name email role'); await meeting.populate('interviewer', 'name email role');
  return res.json({ meeting: present(meeting) });
}));

router.patch('/:meetingId/cancel', asyncHandler(async (req, res) => {
  const meeting = await Meeting.findById(req.params.meetingId);
  if (!meeting || !isParticipant(meeting, req.user.id)) return res.status(404).json({ message: 'Interview session not found.' });
  if (!['pending', 'accepted'].includes(meeting.status)) return res.status(409).json({ message: 'This session can no longer be cancelled.' });
  meeting.status = 'cancelled'; await meeting.save();
  endMeetingRoom(meeting._id, 'The interview was cancelled by a participant.');
  const otherUser = String(meeting.student) === String(req.user.id) ? meeting.interviewer : meeting.student;
  await createNotification({ recipient: otherUser, actor: req.user.id, type: 'meeting_cancelled', title: 'Interview session cancelled', message: `${req.user.name} cancelled “${meeting.title}”.`, href: '/meetings' });
  await meeting.populate('student', 'name email role'); await meeting.populate('interviewer', 'name email role');
  return res.json({ meeting: present(meeting) });
}));

router.post('/:meetingId/start', asyncHandler(async (req, res) => {
  const meeting = await Meeting.findById(req.params.meetingId);
  if (!meeting || !isParticipant(meeting, req.user.id)) return res.status(404).json({ message: 'Interview session not found.' });
  if (meeting.status !== 'accepted') return res.status(409).json({ message: 'This interview is not ready to join.' });
  if (!isWithinMeetingWindow(meeting)) {
    const startsAt = new Date(meeting.scheduledAt).getTime();
    if (Date.now() < startsAt - 15 * 60_000) return res.status(409).json({ message: 'The room opens 15 minutes before the scheduled start.' });
    return res.status(409).json({ message: 'The scheduled interview time has ended.' });
  }
  if (!meeting.startedAt) { meeting.startedAt = new Date(); await meeting.save(); }
  return res.json({ startedAt: meeting.startedAt });
}));

router.post('/:meetingId/evaluation', asyncHandler(async (req, res) => {
  const input = evaluationSchema.parse(req.body);
  const meeting = await Meeting.findById(req.params.meetingId);
  if (!meeting || String(meeting.interviewer) !== String(req.user.id)) return res.status(404).json({ message: 'Interview session not found.' });
  if (!['accepted', 'completed'].includes(meeting.status)) return res.status(409).json({ message: 'Only an accepted interview can be evaluated.' });
  meeting.status = 'completed'; meeting.endedAt = meeting.endedAt || new Date();
  meeting.evaluation = { ...input, evaluatedAt: new Date() };
  await meeting.save(); endMeetingRoom(meeting._id, 'The interviewer has finished and saved this evaluation.');
  await meeting.populate('student', 'name email role'); await meeting.populate('interviewer', 'name email role');
  await createNotification({ recipient: meeting.student._id, actor: req.user.id, type: 'meeting_evaluation', title: 'Your interview feedback is ready', message: `${req.user.name} saved feedback for “${meeting.title}”.`, href: '/meetings' });
  return res.json({ meeting: present(meeting) });
}));

export default router;
