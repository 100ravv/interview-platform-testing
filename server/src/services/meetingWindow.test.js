import test from 'node:test';
import assert from 'node:assert/strict';
import { isWithinMeetingWindow } from './meetingWindow.js';

test('meeting room window opens 15 minutes before start and closes at end', () => {
  const start = Date.parse('2026-10-23T10:00:00Z');
  const meeting = { scheduledAt: new Date(start), durationMinutes: 30 };
  assert.equal(isWithinMeetingWindow(meeting, start - 15 * 60_000), true);
  assert.equal(isWithinMeetingWindow(meeting, start - 15 * 60_000 - 1), false);
  assert.equal(isWithinMeetingWindow(meeting, start + 30 * 60_000 - 1), true);
  assert.equal(isWithinMeetingWindow(meeting, start + 30 * 60_000), false);
});

test('invalid meeting schedule is rejected', () => {
  assert.equal(isWithinMeetingWindow({ scheduledAt: 'bad-date', durationMinutes: 30 }), false);
});
