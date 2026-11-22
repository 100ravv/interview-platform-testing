import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  subject: { type: String, enum: ['JavaScript', 'React', 'Data Structures', 'DBMS', 'Operating Systems'], required: true },
  topic: { type: String, required: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  prompt: { type: String, required: true },
  answerGuide: { type: String, required: true, select: false },
  keywords: { type: [String], required: true, select: false },
}, { timestamps: true, versionKey: false });

questionSchema.index({ subject: 1, difficulty: 1 });
export const Question = mongoose.model('Question', questionSchema);
