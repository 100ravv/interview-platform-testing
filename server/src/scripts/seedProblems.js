import { connectDatabase } from '../config/database.js';
import { Problem } from '../models/Problem.js';
import { problemDocuments } from '../data/problems.js';

try {
  await connectDatabase();
  await Problem.bulkWrite(problemDocuments.map((problem) => ({
    updateOne: { filter: { slug: problem.slug }, update: { $set: problem }, upsert: true },
  })));
  console.info(`Coding problem bank ready (${problemDocuments.length} problems).`);
} catch (error) {
  console.error(`Could not seed coding problems: ${error.message}`);
  process.exitCode = 1;
} finally {
  const mongoose = await import('mongoose');
  await mongoose.default.disconnect();
}
