import test from 'node:test';
import assert from 'node:assert/strict';
import { questionDocuments } from '../src/data/questions.js';

test('question bank has unique questions across all supported subjects and levels', () => {
  const keys = new Set(questionDocuments.map((question) => question.key));
  assert.equal(keys.size, questionDocuments.length);
  for (const subject of ['JavaScript', 'React', 'Data Structures', 'DBMS', 'Operating Systems']) {
    for (const difficulty of ['beginner', 'intermediate', 'advanced']) {
      assert.ok(questionDocuments.filter((question) => question.subject === subject && question.difficulty === difficulty).length >= 3);
    }
  }
});
