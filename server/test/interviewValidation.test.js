import test from 'node:test';
import assert from 'node:assert/strict';
import { answerSchema, startInterviewSchema } from '../src/validation/interview.js';
import { adaptDifficulty } from '../src/services/interview.js';

test('interview setup accepts supported subjects and defaults to five beginner questions', () => {
  const result = startInterviewSchema.parse({ subject: 'React' });
  assert.equal(result.difficulty, 'beginner');
  assert.equal(result.questionCount, 5);
});

test('interview setup rejects unsupported subjects and out-of-range counts', () => {
  assert.equal(startInterviewSchema.safeParse({ subject: 'Rust' }).success, false);
  assert.equal(startInterviewSchema.safeParse({ subject: 'React', questionCount: 6 }).success, false);
});

test('answers must contain non-empty text no longer than 3000 characters', () => {
  assert.equal(answerSchema.safeParse({ answer: 'A considered answer.' }).success, true);
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
