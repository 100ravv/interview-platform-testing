import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { Contest } from '../models/Contest.js';
import { ContestParticipation } from '../models/ContestParticipation.js';
import { ContestSubmission } from '../models/ContestSubmission.js';
import { Problem } from '../models/Problem.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { contestState, presentContest, calculateContestScore } from '../services/contest.js';
import { submitCodeSchema } from '../validation/code.js';
import { createExecution, getLanguages } from '../services/judge0.js';
import { refreshContestSubmission, presentContestSubmission } from '../services/contestSubmissions.js';

const router = Router();
router.use(requireAuth);
const submitLimiter = rateLimit({ windowMs: 60 * 1000, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'You have submitted several solutions recently. Wait a minute, then try again.' } });

router.get('/', asyncHandler(async (req, res) => {
  const contests = await Contest.find().sort({ startsAt: -1 }).limit(30);
  const participation = await ContestParticipation.find({ user: req.user.id, contest: { $in: contests.map((item) => item._id) } }).select('contest').lean();
  const joined = new Set(participation.map((item) => String(item.contest)));
  const counts = await ContestParticipation.aggregate([
    { $match: { contest: { $in: contests.map((item) => item._id) } } },
    { $group: { _id: '$contest', count: { $sum: 1 } } },
  ]);
  const countByContest = new Map(counts.map((item) => [String(item._id), item.count]));
  return res.json({ contests: contests.map((item) => presentContest(item, { joined: joined.has(String(item._id)), participantCount: countByContest.get(String(item._id)) || 0 })) });
}));

router.post('/:contestId/join', asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.contestId);
  if (!contest) return res.status(404).json({ message: 'Contest not found.' });
  if (contestState(contest).status !== 'upcoming') return res.status(409).json({ message: 'Registration is closed after the contest starts.' });
  let participation = await ContestParticipation.findOne({ contest: contest._id, user: req.user.id });
  if (!participation) participation = await ContestParticipation.create({ contest: contest._id, user: req.user.id });
  return res.status(201).json({ joined: true, joinedAt: participation.joinedAt });
}));

router.post('/:contestId/problems/:problemSlug/submissions', submitLimiter, asyncHandler(async (req, res) => {
  const input = submitCodeSchema.parse({ ...req.body, mode: 'submit' });
  const contest = await Contest.findById(req.params.contestId);
  if (!contest) return res.status(404).json({ message: 'Contest not found.' });
  if (contestState(contest).status !== 'live') return res.status(409).json({ message: 'Contest submissions are accepted only while the contest is live.' });
  const participation = await ContestParticipation.findOne({ contest: contest._id, user: req.user.id });
  if (!participation) return res.status(403).json({ message: 'Join this contest before submitting.' });
  const contestProblem = contest.problems.find((item) => item.problemSlug === req.params.problemSlug);
  if (!contestProblem) return res.status(404).json({ message: 'Problem is not part of this contest.' });
  const [problem, languages] = await Promise.all([
    Problem.findOne({ slug: contestProblem.problemSlug }).select('+testCases'),
    getLanguages(),
  ]);
  if (!problem) return res.status(404).json({ message: 'Contest problem is unavailable.' });
  const language = languages.find((item) => item.id === input.languageId);
  if (!language) return res.status(400).json({ message: 'Choose one of the supported languages.' });
  const submission = await ContestSubmission.create({
    contest: contest._id, participant: participation._id, user: req.user.id,
    problemSlug: problem.slug, problemTitle: problem.title,
    languageId: language.id, languageName: language.name, sourceCode: input.sourceCode,
    testCases: problem.testCases.map((item) => ({ ...item.toObject(), status: 'Queued' })), status: 'Queued',
  });
  submission.judgeTokens = [];
  try {
    for (const testCase of submission.testCases) {
      submission.judgeTokens.push(await createExecution({ sourceCode: input.sourceCode, languageId: language.id, input: testCase.input, expectedOutput: testCase.expectedOutput }));
    }
    await submission.save();
  } catch (error) {
    submission.status = 'Error'; submission.completedAt = new Date(); await submission.save(); throw error;
  }
  return res.status(202).json({ submission: presentContestSubmission(submission), message: 'Code sent to Judge0.' });
}));

router.get('/:contestId', asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.contestId);
  if (!contest) return res.status(404).json({ message: 'Contest not found.' });
  const [participation, participantCount] = await Promise.all([
    ContestParticipation.findOne({ contest: contest._id, user: req.user.id }).select('_id').lean(),
    ContestParticipation.countDocuments({ contest: contest._id }),
  ]);
  const includeProblems = Boolean(participation) && contestState(contest).status !== 'upcoming';
  return res.json({ contest: presentContest(contest, { includeProblems, joined: Boolean(participation), participantCount }) });
}));

router.get('/:contestId/leaderboard', asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.contestId);
  if (!contest) return res.status(404).json({ message: 'Contest not found.' });
  const participants = await ContestParticipation.find({ contest: contest._id }).populate('user', 'name').lean();
  const submissions = await ContestSubmission.find({ contest: contest._id }).select('user problemSlug status submittedAt completedAt').lean();
  const rows = participants.map((participant) => {
    const scores = calculateContestScore(submissions.filter((item) => String(item.user) === String(participant.user._id)), contest.problems, contest.startsAt);
    return { userId: String(participant.user._id), name: participant.user.name, ...scores };
  }).sort((a, b) => b.score - a.score || a.penaltyMinutes - b.penaltyMinutes || (a.lastAcceptedAt || Infinity) - (b.lastAcceptedAt || Infinity) || a.name.localeCompare(b.name));
  return res.json({ leaderboard: rows.map((row, index) => ({ rank: index + 1, ...row })), status: contestState(contest).status });
}));

router.get('/:contestId/submissions/:submissionId', asyncHandler(async (req, res) => {
  const submission = await ContestSubmission.findOne({ _id: req.params.submissionId, contest: req.params.contestId, user: req.user.id }).select('+sourceCode +judgeTokens');
  if (!submission) return res.status(404).json({ message: 'Contest submission not found.' });
  await refreshContestSubmission(submission);
  return res.json({ submission: presentContestSubmission(submission, true) });
}));

export default router;
