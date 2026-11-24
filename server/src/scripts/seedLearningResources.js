import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { LearningResource } from '../models/LearningResource.js';
import { learningResourceDocuments } from '../data/learningResources.js';

try {
  await connectDatabase();
  await LearningResource.bulkWrite(learningResourceDocuments.map((resource) => ({
    updateOne: { filter: { key: resource.key }, update: { $set: resource }, upsert: true },
  })));
  console.info(`Learning materials ready (${learningResourceDocuments.length} resources).`);
} catch (error) {
  console.error(`Could not seed learning materials: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
