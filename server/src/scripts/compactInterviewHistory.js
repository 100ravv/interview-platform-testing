import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { InterviewSession } from '../models/InterviewSession.js';
import { compactCompletedSession } from '../services/interview.js';

let compacted = 0;
try {
  await connectDatabase();
  const cursor = InterviewSession.find({ status: 'completed' }).cursor();
  for await (const session of cursor) {
    compactCompletedSession(session);
    await session.save();
    compacted += 1;
  }
  console.info(`Compacted ${compacted} completed AI interview sessions.`);
} catch (error) {
  console.error(`Could not compact interview history: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
