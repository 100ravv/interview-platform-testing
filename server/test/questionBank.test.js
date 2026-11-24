import test from 'node:test';
import assert from 'node:assert/strict';
import { questionDocuments } from '../src/data/questions.js';

test('question bank has unique questions across all supported subjects and levels', () => {
  const keys = new Set(questionDocuments.map((question) => question.key));
  assert.equal(keys.size, questionDocuments.length);
  assert.equal(questionDocuments.length, 100);
  for (const subject of ['JavaScript', 'React', 'Data Structures', 'DBMS', 'Operating Systems']) {
    const subjectQuestions = questionDocuments.filter((question) => question.subject === subject);
    assert.equal(subjectQuestions.length, 20, `${subject} should have 20 practice questions`);
    for (const difficulty of ['beginner', 'intermediate', 'advanced']) {
      assert.ok(subjectQuestions.filter((question) => question.difficulty === difficulty).length >= 3);
    }
  }
});
