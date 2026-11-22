import mongoose from 'mongoose';

const contestProblemSchema = new mongoose.Schema({
  problemSlug: { type: String, required: true },
  title: { type: String, required: true },
  points: { type: Number, min: 1, required: true },
}, { _id: false });

const contestSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  startsAt: { type: Date, required: true },
  durationMinutes: { type: Number, min: 15, max: 240, required: true },
  problems: { type: [contestProblemSchema], required: true },
}, { timestamps: true, versionKey: false });

export const Contest = mongoose.model('Contest', contestSchema);
