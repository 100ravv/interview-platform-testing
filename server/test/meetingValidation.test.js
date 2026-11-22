import test from 'node:test';
import assert from 'node:assert/strict';
import { createMeetingSchema, evaluationSchema, meetingResponseSchema } from '../src/validation/meeting.js';

test('meeting request requires a valid participant, a future date, and supported duration', () => {
  const future = new Date(Date.now() + 86_400_000).toISOString();
  const valid = { participantEmail: 'interviewer@university.edu', title: 'Data structures mock', scheduledAt: future, durationMinutes: 45 };
  assert.equal(createMeetingSchema.safeParse(valid).success, true);
  assert.equal(createMeetingSchema.safeParse({ ...valid, participantEmail: 'not-an-email' }).success, false);
  assert.equal(createMeetingSchema.safeParse({ ...valid, scheduledAt: new Date(Date.now() - 1000).toISOString() }).success, false);
  assert.equal(createMeetingSchema.safeParse({ ...valid, durationMinutes: 90 }).success, false);
});

test('only accepted/declined responses and a one-to-five evaluation rating are valid', () => {
  assert.equal(meetingResponseSchema.safeParse({ status: 'accepted' }).success, true);
  assert.equal(meetingResponseSchema.safeParse({ status: 'cancelled' }).success, false);
  assert.equal(evaluationSchema.safeParse({ rating: 5, feedback: 'Clear explanation.' }).success, true);
  assert.equal(evaluationSchema.safeParse({ rating: 8 }).success, false);
  assert.equal(evaluationSchema.safeParse({ rating: 4, feedback: 'x'.repeat(1501) }).success, false);
});
