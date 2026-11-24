import test from 'node:test';
import assert from 'node:assert/strict';
import { learningResourceDocuments } from '../src/data/learningResources.js';

test('learning materials have unique keys and valid external metadata', () => {
  const keys = learningResourceDocuments.map((item) => item.key);
  assert.equal(new Set(keys).size, keys.length);
  for (const item of learningResourceDocuments) {
    assert.ok(item.subject);
    assert.ok(item.title);
    assert.ok(item.description);
    assert.ok(item.provider);
    assert.match(item.url, /^https:\/\//);
    assert.ok(['documentation', 'article', 'video', 'course'].includes(item.type));
    assert.ok(['beginner', 'intermediate', 'advanced'].includes(item.level));
  }
});

test('learning materials cover the planned subjects and resource formats', () => {
  const subjects = new Set(learningResourceDocuments.map((item) => item.subject));
  const formats = new Set(learningResourceDocuments.map((item) => item.type));
  for (const subject of ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Data Structures', 'DBMS', 'Operating Systems']) assert.ok(subjects.has(subject));
  for (const format of ['documentation', 'article', 'video']) assert.ok(formats.has(format));
});
