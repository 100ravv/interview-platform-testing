import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { Problem } from '../models/Problem.js';
import { CodeSubmission } from '../models/CodeSubmission.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { submitCodeSchema } from '../validation/code.js';
import { createExecution, getLanguages } from '../services/judge0.js';
import { presentSubmission, refreshSubmission } from '../services/codeSubmissions.js';
import { env } from '../config/env.js';

const router = Router();
router.use(requireAuth);
const submitLimiter = rateLimit({ windowMs: 60 * 1000, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'You have run several programs recently. Wait a minute, then try again.' } });

function presentProblem(problem, detail = false) {
  const result = {
    id: String(problem._id),
    slug: problem.slug,
    title: problem.title,
    difficulty: problem.difficulty,
    category: problem.category,
    summary: problem.summary,
  };
  if (detail) {
    result.statement = problem.statement;
    result.inputFormat = problem.inputFormat;
    result.outputFormat = problem.outputFormat;
    result.constraints = problem.constraints;
    result.examples = (problem.testCases || []).filter((item) => item.visibility === 'public').map(({ name, input, expectedOutput }) => ({ name, input, expectedOutput }));
  }
  return result;
}

router.get('/languages', asyncHandler(async (req, res) => {
  const languages = await getLanguages();
  return res.json({ languages, executionAvailable: Boolean(env.JUDGE0_API_URL) });
}));

router.get('/problems', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.difficulty && ['Easy', 'Medium', 'Hard'].includes(req.query.difficulty)) filter.difficulty = req.query.difficulty;
  if (req.query.category && typeof req.query.category === 'string' && req.query.category.length <= 30) filter.category = req.query.category;
  const problems = await Problem.find(filter).sort({ difficulty: 1, title: 1 }).limit(100);
  return res.json({ problems: problems.map((problem) => presentProblem(problem)) });
}));

router.get('/problems/:slug', asyncHandler(async (req, res) => {
  const problem = await Problem.findOne({ slug: req.params.slug }).select('+testCases');
  if (!problem) return res.status(404).json({ message: 'Coding problem not found.' });
  return res.json({ problem: presentProblem(problem, true) });
}));

router.post('/problems/:slug/submissions', submitLimiter, asyncHandler(async (req, res) => {
  const input = submitCodeSchema.parse(req.body);
  const [problem, languages] = await Promise.all([
    Problem.findOne({ slug: req.params.slug }).select('+testCases'),
    getLanguages(),
  ]);
  if (!problem) return res.status(404).json({ message: 'Coding problem not found.' });
  const language = languages.find((item) => item.id === input.languageId);
  if (!language) return res.status(400).json({ message: 'Choose one of the supported languages.' });

  const testCases = problem.testCases.filter((item) => input.mode === 'submit' || item.visibility === 'public');
  const submission = await CodeSubmission.create({
    user: req.user.id,
    problem: problem._id,
    problemSlug: problem.slug,
    problemTitle: problem.title,
    mode: input.mode,
    languageId: language.id,
    languageName: language.name,
    sourceCode: input.sourceCode,
    testCases: testCases.map((item) => ({ ...item.toObject(), status: 'Queued' })),
    status: 'Queued',
  });

  submission.judgeTokens = [];
  try {
    for (const testCase of submission.testCases) {
      const token = await createExecution({ sourceCode: input.sourceCode, languageId: language.id, input: testCase.input, expectedOutput: testCase.expectedOutput });
      submission.judgeTokens.push(token);
    }
    await submission.save();
  } catch (error) {
    submission.status = 'Error';
    submission.completedAt = new Date();
    await submission.save();
    throw error;
  }
  return res.status(202).json({ submission: presentSubmission(submission), message: 'Code sent to Judge0. Poll this submission for the result.' });
}));

router.get('/submissions', asyncHandler(async (req, res) => {
  const submissions = await CodeSubmission.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(30);
  return res.json({ submissions: submissions.map((item) => presentSubmission(item)) });
}));

router.get('/submissions/:submissionId', asyncHandler(async (req, res) => {
  const submission = await CodeSubmission.findOne({ _id: req.params.submissionId, user: req.user.id }).select('+sourceCode +judgeTokens');
  if (!submission) return res.status(404).json({ message: 'Code submission not found.' });
  await refreshSubmission(submission);
  return res.json({ submission: presentSubmission(submission, true) });
}));

export default router;
