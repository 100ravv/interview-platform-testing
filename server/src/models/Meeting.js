import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  rating: { type: Number, min: 1, max: 5 },
  feedback: { type: String, maxlength: 1500, default: '' },
  evaluatedAt: { type: Date, default: null },
}, { _id: false });

const proctorEventSchema = new mongoose.Schema({
  type: { type: String, enum: ['tab_hidden', 'gaze_away', 'face_missing', 'multiple_faces', 'camera_disabled'], required: true },
  participant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participantName: { type: String, required: true, maxlength: 60 },
  occurredAt: { type: Date, required: true },
}, { _id: false });

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  scheduledAt: { type: Date, required: true, index: true },
  durationMinutes: { type: Number, enum: [30, 45, 60], default: 30 },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  interviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'cancelled', 'completed'], default: 'pending', index: true },
  startedAt: { type: Date, default: null },
  endedAt: { type: Date, default: null },
  evaluation: { type: evaluationSchema, default: () => ({}) },
  proctorEvents: { type: [proctorEventSchema], default: [] },
}, { timestamps: true, versionKey: false });

meetingSchema.index({ student: 1, scheduledAt: 1 });
meetingSchema.index({ interviewer: 1, scheduledAt: 1 });
export const Meeting = mongoose.model('Meeting', meetingSchema);
