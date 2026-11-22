import mongoose from 'mongoose';

const testcaseSchema = new mongoose.Schema({
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

const contestSubmissionSchema = new mongoose.Schema({
  contest: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', required: true },
  participant: { type: mongoose.Schema.Types.ObjectId, ref: 'ContestParticipation', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemSlug: { type: String, required: true },
  problemTitle: { type: String, required: true },
  languageId: { type: Number, required: true },
  languageName: { type: String, required: true },
  sourceCode: { type: String, required: true, select: false },
  judgeTokens: { type: [String], default: [], select: false },
  testCases: { type: [testcaseSchema], default: [] },
  status: { type: String, default: 'Queued', index: true },
  submittedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
}, { versionKey: false });

contestSubmissionSchema.index({ contest: 1, user: 1, submittedAt: -1 });
export const ContestSubmission = mongoose.model('ContestSubmission', contestSubmissionSchema);
