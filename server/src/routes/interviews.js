import { Router } from 'express';
import { InterviewSession } from '../models/InterviewSession.js';
import { Question } from '../models/Question.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { answerSchema, startInterviewSchema } from '../validation/interview.js';
import { adaptDifficulty, chooseQuestion, compactCompletedSession, presentSession, presentSessionSummary } from '../services/interview.js';
import { evaluateAnswer } from '../services/evaluateAnswer.js';

const router = Router();
router.use(requireAuth);
async function previouslyAskedBy(userId, subject, excludeSessionId) {
  const filter = { user: userId, subject };
  if (excludeSessionId) filter._id = { $ne: excludeSessionId };
  const sessions = await InterviewSession.find(filter).select('questions.questionId').lean();
  return sessions.flatMap((session) => session.questions.map((question) => String(question.questionId)));
}

router.post('/', asyncHandler(async (req, res) => {
  const input = startInterviewSchema.parse(req.body);
  const bankCount = await Question.countDocuments({ subject: input.subject });
  if (!bankCount) return res.status(503).json({ message: 'The interview question bank is empty. Run `npm run seed:questions` from the project root.' });
  const askedQuestionIds = await previouslyAskedBy(req.user.id, input.subject);
  const first = await chooseQuestion(input.subject, input.difficulty, [], askedQuestionIds);
  if (!first) return res.status(503).json({ message: 'No questions are available for this subject yet.' });
  const session = await InterviewSession.create({
    user: req.user.id,
    subject: input.subject,
    startingDifficulty: input.difficulty,
    currentDifficulty: first.difficulty,
    questionCount: input.questionCount,
    questions: [first],
  });
  return res.status(201).json({ session: presentSession(session) });
}));

router.get('/', asyncHandler(async (req, res) => {
  const sessions = await InterviewSession.find({ user: req.user.id })
    .select('subject startingDifficulty status overallScore startedAt completedAt questionCount strengthsSummary focusSummary questions.topic questions.score questions.answeredAt questions.strengths questions.improvements')
    .sort({ createdAt: -1 }).limit(30).lean();
  return res.json({ sessions: sessions.map(presentSessionSummary) });
}));

router.get('/:sessionId', asyncHandler(async (req, res) => {
  const session = await InterviewSession.findOne({ _id: req.params.sessionId, user: req.user.id });
  if (!session) return res.status(404).json({ message: 'Interview session not found.' });
  return res.json({ session: presentSession(session) });
}));

router.post('/:sessionId/answer', asyncHandler(async (req, res) => {
  const { answer } = answerSchema.parse(req.body);
  const session = await InterviewSession.findOne({ _id: req.params.sessionId, user: req.user.id });
  if (!session) return res.status(404).json({ message: 'Interview session not found.' });
  if (session.status === 'completed') return res.status(409).json({ message: 'This interview is already complete.' });

  const current = session.questions[session.questions.length - 1];
  if (current.answeredAt) return res.status(409).json({ message: 'This answer has already been submitted.' });
  const evaluation = await evaluateAnswer(current, answer);
  current.answer = answer;
  current.score = evaluation.score;
  current.feedback = evaluation.feedback;
  current.strengths = evaluation.strengths;
  current.improvements = evaluation.improvements;
  current.evaluationMode = evaluation.mode;
  current.answeredAt = new Date();

  const updatedDifficulty = adaptDifficulty(current.difficulty, evaluation.score);
  session.currentDifficulty = updatedDifficulty;
  const done = session.questions.length >= session.questionCount;
  if (done) {
    session.status = 'completed';
    session.completedAt = new Date();
    session.overallScore = Math.round(session.questions.reduce((sum, item) => sum + item.score, 0) / session.questions.length * 10) / 10;
    compactCompletedSession(session);
  } else {
    const askedQuestionIds = await previouslyAskedBy(req.user.id, session.subject, session._id);
    const next = await chooseQuestion(session.subject, updatedDifficulty, session.questions.map((item) => item.questionId), askedQuestionIds);
    if (next) session.questions.push(next);
    else {
      session.status = 'completed';
      session.completedAt = new Date();
      session.overallScore = Math.round(session.questions.reduce((sum, item) => sum + item.score, 0) / session.questions.length * 10) / 10;
      compactCompletedSession(session);
    }
  }
  await session.save();
  return res.json({ session: presentSession(session), evaluation: { ...evaluation, nextDifficulty: updatedDifficulty } });
}));

export default router;
