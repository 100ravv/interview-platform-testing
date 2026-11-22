import { connectDatabase } from '../config/database.js';
import { Question } from '../models/Question.js';
import { questionDocuments } from '../data/questions.js';

try {
  await connectDatabase();
  await Question.bulkWrite(questionDocuments.map((question) => ({
    updateOne: { filter: { key: question.key }, update: { $set: question }, upsert: true },
  })));
  console.info(`Question bank ready (${questionDocuments.length} questions).`);
} catch (error) {
  console.error(`Could not seed question bank: ${error.message}`);
  process.exitCode = 1;
} finally {
  const mongoose = await import('mongoose');
  await mongoose.default.disconnect();
}
