import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  input: { type: String, default: '' },
  expectedOutput: { type: String, required: true },
  visibility: { type: String, enum: ['public', 'hidden'], required: true },
}, { _id: false });

const problemSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  category: { type: String, required: true },
  summary: { type: String, required: true },
  statement: { type: String, required: true },
  inputFormat: { type: String, required: true },
  outputFormat: { type: String, required: true },
  constraints: { type: [String], default: [] },
  testCases: { type: [testCaseSchema], required: true, select: false },
}, { timestamps: true, versionKey: false });

problemSchema.index({ difficulty: 1, category: 1 });
export const Problem = mongoose.model('Problem', problemSchema);
