import test from 'node:test';
import assert from 'node:assert/strict';
import { submitCodeSchema } from '../src/validation/code.js';
import { problemDocuments } from '../src/data/problems.js';
import { presentSubmission } from '../src/services/codeSubmissionView.js';

test('code submission validation limits the source and accepts run/submit modes', () => {
  const valid = { sourceCode: 'print(2 + 2)', languageId: 71 };
  assert.equal(submitCodeSchema.parse(valid).mode, 'run');
  assert.equal(submitCodeSchema.parse({ ...valid, mode: 'submit' }).mode, 'submit');
  assert.equal(submitCodeSchema.safeParse({ ...valid, sourceCode: '' }).success, false);
  assert.equal(submitCodeSchema.safeParse({ ...valid, sourceCode: 'x'.repeat(20001) }).success, false);
  assert.equal(submitCodeSchema.safeParse({ ...valid, mode: 'admin' }).success, false);
});

test('seeded problems have unique slugs and both public and hidden tests', () => {
  assert.equal(problemDocuments.length, 20);
  assert.equal(new Set(problemDocuments.map((problem) => problem.slug)).size, problemDocuments.length);
  for (const problem of problemDocuments) {
    assert.ok(problem.testCases.some((item) => item.visibility === 'public'));
    assert.ok(problem.testCases.some((item) => item.visibility === 'hidden'));
  }
});

test('submission responses never include hidden testcase data or Judge0 tokens', () => {
  const view = presentSubmission({
    _id: 'submission-1', problemSlug: 'sum-two-numbers', problemTitle: 'Sum of Two Numbers', mode: 'submit',
    languageId: 71, languageName: 'Python', status: 'Accepted', createdAt: new Date(), completedAt: new Date(),
    sourceCode: 'private source', judgeTokens: ['secret-token'], testCases: [
      { visibility: 'public', status: 'Accepted', stdout: '8\n', input: '3 5', expectedOutput: '8' },
      { visibility: 'hidden', status: 'Accepted', stdout: '2000000000\n', input: 'secret input', expectedOutput: 'secret expected' },
    ],
  }, true);
  assert.equal(view.sourceCode, 'private source');
  assert.equal(view.testCases[0].stdout, '8\n');
  assert.equal(view.testCases[1].stdout, undefined);
  assert.equal(JSON.stringify(view).includes('secret input'), false);
  assert.equal(JSON.stringify(view).includes('secret expected'), false);
  assert.equal(JSON.stringify(view).includes('secret-token'), false);
});
