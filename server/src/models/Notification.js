import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  type: { type: String, enum: ['meeting_request', 'meeting_response', 'meeting_cancelled', 'meeting_evaluation'], required: true },
  title: { type: String, required: true, maxlength: 100 },
  message: { type: String, required: true, maxlength: 240 },
  href: { type: String, required: true, maxlength: 200 },
  readAt: { type: Date, default: null, index: true },
}, { timestamps: true, versionKey: false });

notificationSchema.index({ recipient: 1, createdAt: -1 });
export const Notification = mongoose.model('Notification', notificationSchema);
