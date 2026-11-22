import test from 'node:test';
import assert from 'node:assert/strict';
import { loginSchema, registerSchema } from '../src/validation/auth.js';

test('registration defaults to student and normalizes display fields', () => {
  const result = registerSchema.parse({ name: '  Aisha Patel ', email: ' Aisha@Example.com ', password: 'eightchars' });
  assert.equal(result.name, 'Aisha Patel');
  assert.equal(result.email, 'Aisha@Example.com');
  assert.equal(result.role, 'student');
});

test('registration permits interviewer but never permits public admin registration', () => {
  const base = { name: 'Aisha Patel', email: 'aisha@example.com', password: 'eightchars' };
  assert.equal(registerSchema.parse({ ...base, role: 'interviewer' }).role, 'interviewer');
  assert.equal(registerSchema.safeParse({ ...base, role: 'admin' }).success, false);
});

test('registration rejects invalid email and short passwords', () => {
  assert.equal(registerSchema.safeParse({ name: 'Aisha', email: 'bad', password: 'short' }).success, false);
});

test('login requires a valid email and non-empty password', () => {
  assert.equal(loginSchema.safeParse({ email: 'aisha@example.com', password: 'secret' }).success, true);
  assert.equal(loginSchema.safeParse({ email: 'bad', password: '' }).success, false);
});
