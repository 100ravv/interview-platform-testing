import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { InterviewSession } from '../models/InterviewSession.js';
import { CodeSubmission } from '../models/CodeSubmission.js';
import { Meeting } from '../models/Meeting.js';

const router = Router();
router.use(requireAuth);
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const [interviewSummary, subjectBreakdown, weakTopics, codeSummary, languageBreakdown, recentSessions, humanSummary] = await Promise.all([
    InterviewSession.aggregate([{ $match: { user: userId, status: 'completed' } }, { $group: { _id: null, count: { $sum: 1 }, averageScore: { $avg: '$overallScore' } } }]),
    InterviewSession.aggregate([{ $match: { user: userId, status: 'completed' } }, { $group: { _id: '$subject', sessions: { $sum: 1 }, averageScore: { $avg: '$overallScore' } } }, { $sort: { averageScore: 1 } }]),
    InterviewSession.aggregate([{ $match: { user: userId, status: 'completed' } }, { $unwind: '$questions' }, { $match: { 'questions.score': { $ne: null }, 'questions.skipped': { $ne: true } } }, { $group: { _id: '$questions.topic', averageScore: { $avg: '$questions.score' }, answers: { $sum: 1 } } }, { $sort: { averageScore: 1, answers: -1 } }, { $limit: 5 }]),
    CodeSubmission.aggregate([{ $match: { user: userId, mode: 'submit' } }, { $group: { _id: null, total: { $sum: 1 }, accepted: { $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] } } } }]),
    CodeSubmission.aggregate([{ $match: { user: userId, mode: 'submit' } }, { $group: { _id: '$languageName', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]),
    InterviewSession.find({ user: userId, status: 'completed' }).select('subject overallScore completedAt').sort({ completedAt: -1 }).limit(8).lean(),
    Meeting.aggregate([{ $match: { [req.user.role === 'interviewer' ? 'interviewer' : 'student']: userId, status: 'completed', 'evaluation.rating': { $gte: 1 } } }, { $group: { _id: null, count: { $sum: 1 }, averageRating: { $avg: '$evaluation.rating' } } }]),
  ]);
  const summary = {
    interviewSessions: interviewSummary[0]?.count || 0,
    interviewAverage: interviewSummary[0]?.averageScore != null ? Math.round(interviewSummary[0].averageScore * 10) / 10 : null,
    codingSubmissions: codeSummary[0]?.total || 0,
    acceptedSubmissions: codeSummary[0]?.accepted || 0,
    humanInterviewCount: humanSummary[0]?.count || 0,
    humanInterviewAverage: humanSummary[0]?.averageRating ? Math.round(humanSummary[0].averageRating * 10) / 10 : null,
    humanInterviewLabel: req.user.role === 'interviewer' ? 'Evaluations submitted' : 'Human interviews completed',
  };
  const recommendations = [];
  if (weakTopics.length) recommendations.push(...weakTopics.slice(0, 3).map((topic) => ({ title: `Review ${topic._id}`, detail: `Your average answer score is ${topic.averageScore.toFixed(1)} out of 5 across ${topic.answers} response${topic.answers === 1 ? '' : 's'}. Practice explaining the core idea with an example.`, to: '/interview', kind: 'topic' })));
  else recommendations.push({ title: 'Start an AI practice session', detail: 'Complete a short interview to get your first topic-level feedback.', to: '/interview', kind: 'interview' });
  const codingRate = summary.codingSubmissions ? summary.acceptedSubmissions / summary.codingSubmissions : null;
  if (codingRate === null) recommendations.push({ title: 'Try a coding challenge', detail: 'Submit a solution to start tracking your coding practice and accepted results.', to: '/code', kind: 'coding' });
  else if (codingRate < 0.6) recommendations.push({ title: 'Revisit recent coding attempts', detail: `${summary.acceptedSubmissions} of ${summary.codingSubmissions} submitted solutions were accepted. Read the constraints and edge cases before submitting again.`, to: '/code/submissions', kind: 'coding' });
  return res.json({ summary, subjects: subjectBreakdown.map((item) => ({ subject: item._id, sessions: item.sessions, averageScore: Math.round(item.averageScore * 10) / 10 })), weakTopics: weakTopics.map((item) => ({ topic: item._id, averageScore: Math.round(item.averageScore * 10) / 10, answers: item.answers })), languages: languageBreakdown.map((item) => ({ language: item._id, submissions: item.count })), recentSessions: recentSessions.map((item) => ({ subject: item.subject, score: item.overallScore, completedAt: item.completedAt })), recommendations });
}));
export default router;
