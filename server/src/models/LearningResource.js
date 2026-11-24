import mongoose from 'mongoose';

const learningResourceSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true },
  subject: { type: String, required: true, trim: true, maxlength: 60 },
  title: { type: String, required: true, trim: true, maxlength: 140 },
  description: { type: String, required: true, trim: true, maxlength: 300 },
  type: { type: String, enum: ['documentation', 'article', 'video', 'course'], required: true },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  provider: { type: String, required: true, trim: true, maxlength: 80 },
  url: { type: String, required: true, match: /^https:\/\// },
  order: { type: Number, default: 0 },
}, { timestamps: true, versionKey: false });

learningResourceSchema.index({ subject: 1, level: 1, order: 1 });
export const LearningResource = mongoose.model('LearningResource', learningResourceSchema);
