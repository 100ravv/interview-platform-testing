import mongoose from 'mongoose';

const participationSchema = new mongoose.Schema({
  contest: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joinedAt: { type: Date, default: Date.now },
}, { timestamps: true, versionKey: false });

participationSchema.index({ contest: 1, user: 1 }, { unique: true });
export const ContestParticipation = mongoose.model('ContestParticipation', participationSchema);
