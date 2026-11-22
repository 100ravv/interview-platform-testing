import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateContestScore, contestState, presentContest } from '../src/services/contest.js';

test('contest state respects the scheduled start and duration', () => {
  const contest = { startsAt: new Date('2026-10-26T12:00:00Z'), durationMinutes: 90 };
  assert.equal(contestState(contest, new Date('2026-10-26T11:59:59Z')).status, 'upcoming');
  assert.equal(contestState(contest, new Date('2026-10-26T12:45:00Z')).status, 'live');
  assert.equal(contestState(contest, new Date('2026-10-26T13:30:00Z')).status, 'completed');
});

test('contest problems are only included when unlocked', () => {
  const contest = { _id: 'c1', slug: 'week-1', title: 'Sprint', description: 'Practice', startsAt: new Date('2026-10-26T12:00:00Z'), durationMinutes: 90, problems: [{ problemSlug: 'sum', title: 'Sum', points: 100 }] };
  assert.equal(presentContest(contest, { now: new Date('2026-10-26T11:00:00Z') }).problems, undefined);
  assert.equal(presentContest(contest, { joined: true, includeProblems: true, now: new Date('2026-10-26T12:00:00Z') }).problems[0].points, 100);
});

test('score uses best accepted attempt and applies a 20-minute wrong-attempt penalty', () => {
  const start = new Date('2026-10-26T12:00:00Z');
  const result = calculateContestScore([
    { problemSlug: 'sum', status: 'Wrong Answer', submittedAt: new Date('2026-10-26T12:02:00Z') },
    { problemSlug: 'sum', status: 'Accepted', submittedAt: new Date('2026-10-26T12:08:00Z'), completedAt: new Date('2026-10-26T12:09:00Z') },
    { problemSlug: 'max', status: 'Processing', submittedAt: new Date('2026-10-26T12:10:00Z') },
  ], [{ problemSlug: 'sum', points: 100 }, { problemSlug: 'max', points: 150 }], start);
  assert.equal(result.score, 100);
  assert.equal(result.penaltyMinutes, 29);
  assert.equal(result.lastAcceptedAt.toISOString(), '2026-10-26T12:09:00.000Z');
});
