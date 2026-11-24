import test from 'node:test';
import assert from 'node:assert/strict';
import { answerSchema, startInterviewSchema } from '../src/validation/interview.js';
import { adaptDifficulty, ensureInterviewDeadline, expireInterviewSession, INTERVIEW_DURATION_MS, repeatableQuestionCandidates } from '../src/services/interview.js';

test('interview setup accepts supported subjects and defaults to ten beginner questions', () => {
  const result = startInterviewSchema.parse({ subject: 'React' });
  assert.equal(result.difficulty, 'beginner');
  assert.equal(result.questionCount, 10);
});

test('interview setup rejects unsupported subjects and out-of-range counts', () => {
  assert.equal(startInterviewSchema.safeParse({ subject: 'Rust' }).success, false);
  assert.equal(startInterviewSchema.safeParse({ subject: 'React', questionCount: 11 }).success, false);
  assert.equal(startInterviewSchema.safeParse({ subject: 'React', questionCount: 10 }).success, true);
});

test('answers must contain non-empty text no longer than 3000 characters', () => {
  assert.equal(answerSchema.safeParse({ answer: 'A considered answer.' }).success, true);
  assert.equal(answerSchema.parse({ answer: 'Auto submitted answer.', autoSubmit: true }).autoSubmit, true);
  assert.equal(answerSchema.safeParse({ answer: '   ' }).success, false);
  assert.equal(answerSchema.safeParse({ answer: 'x'.repeat(3001) }).success, false);
});

test('difficulty moves up for strong answers and down for weak answers, within bounds', () => {
  assert.equal(adaptDifficulty('beginner', 5), 'intermediate');
  assert.equal(adaptDifficulty('intermediate', 2), 'beginner');
  assert.equal(adaptDifficulty('advanced', 5), 'advanced');
  assert.equal(adaptDifficulty('beginner', 1), 'beginner');
  assert.equal(adaptDifficulty('intermediate', 3), 'intermediate');
});

test('interview timeout fills every unanswered question with zero and averages across the full count', () => {
  const startedAt = new Date('2026-01-01T10:00:00Z');
  const session = {
    status: 'in_progress',
    questionCount: 10,
    currentDifficulty: 'beginner',
    expiresAt: new Date(startedAt.getTime() + INTERVIEW_DURATION_MS),
    questions: [
      { questionId: 'question-1', topic: 'JavaScript', difficulty: 'beginner', score: 4, answeredAt: startedAt },
      { questionId: 'question-2', topic: 'React', difficulty: 'beginner', score: null, answeredAt: null },
    ],
  };

  assert.equal(expireInterviewSession(session), true);
  assert.equal(session.status, 'completed');
  assert.equal(session.completionReason, 'time_expired');
  assert.equal(session.questions.length, 10);
  assert.equal(session.questions[0].score, 4);
  assert.equal(session.questions.slice(1).every((question) => question.score === 0 && question.skipped), true);
  assert.equal(session.overallScore, 0.4);
});

test('interview deadline is twenty minutes after it is first assigned', () => {
  const session = {};
  const startedAt = new Date('2026-01-01T10:00:00Z');
  assert.equal(ensureInterviewDeadline(session, startedAt).toISOString(), '2026-01-01T10:20:00.000Z');
});

test('question selection can reuse an earlier question when a bank has fewer than the requested count', () => {
  const questions = Array.from({ length: 9 }, (_, index) => ({ _id: `question-${index + 1}` }));
  const selected = repeatableQuestionCandidates(questions, questions.map((question) => question._id), []);
  assert.ok(selected.length > 0);
  assert.equal(selected.some((question) => question._id === 'question-9'), false);
});
