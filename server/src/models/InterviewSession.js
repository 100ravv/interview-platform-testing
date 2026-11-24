import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  topic: { type: String, required: true },
  prompt: { type: String },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  answerGuide: { type: String },
  keywords: { type: [String] },
  answer: { type: String, default: '' },
  score: { type: Number, min: 0, max: 5, default: null },
  skipped: { type: Boolean, default: false },
  feedback: { type: String, default: '' },
  strengths: { type: [String], default: [] },
  improvements: { type: [String], default: [] },
  evaluationMode: { type: String, enum: ['ai', 'basic'], default: null },
  answeredAt: { type: Date, default: null },
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject: { type: String, enum: ['JavaScript', 'React', 'Data Structures', 'DBMS', 'Operating Systems'], required: true },
  startingDifficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  currentDifficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  questionCount: { type: Number, min: 1, max: 10, required: true },
  questions: { type: [responseSchema], default: [] },
  status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress', index: true },
  overallScore: { type: Number, min: 0, max: 5, default: null },
  strengthsSummary: { type: [String], default: [] },
  focusSummary: { type: [String], default: [] },
  startedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  completionReason: { type: String, enum: ['time_expired'], default: null },
}, { timestamps: true, versionKey: false });

sessionSchema.index({ user: 1, createdAt: -1 });
export const InterviewSession = mongoose.model('InterviewSession', sessionSchema);
