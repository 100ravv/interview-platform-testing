import mongoose from 'mongoose';

const resultCaseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  input: { type: String, default: '' },
  expectedOutput: { type: String, required: true },
  visibility: { type: String, enum: ['public', 'hidden'], required: true },
  status: { type: String, default: 'Queued' },
  stdout: { type: String, default: '' },
  stderr: { type: String, default: '' },
  compileOutput: { type: String, default: '' },
  time: { type: String, default: null },
  memory: { type: Number, default: null },
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  problemSlug: { type: String, required: true },
  problemTitle: { type: String, required: true },
  mode: { type: String, enum: ['run', 'submit'], required: true },
  languageId: { type: Number, required: true },
  languageName: { type: String, required: true },
  sourceCode: { type: String, required: true, select: false },
  judgeTokens: { type: [String], default: [], select: false },
  testCases: { type: [resultCaseSchema], default: [] },
  status: { type: String, default: 'Queued', index: true },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
}, { versionKey: false });

submissionSchema.index({ user: 1, createdAt: -1 });
export const CodeSubmission = mongoose.model('CodeSubmission', submissionSchema);
