import { z } from 'zod';

export const createMeetingSchema = z.object({
  participantEmail: z.string().trim().email().max(254),
  title: z.string().trim().min(3).max(100),
  scheduledAt: z.string().datetime().refine((value) => new Date(value) > new Date(), 'Choose a future date and time.'),
  durationMinutes: z.coerce.number().int().refine((value) => [30, 45, 60].includes(value), 'Choose a 30, 45, or 60 minute session.'),
});

export const meetingResponseSchema = z.object({ status: z.enum(['accepted', 'declined']) });
export const evaluationSchema = z.object({ rating: z.coerce.number().int().min(1).max(5), feedback: z.string().trim().max(1500).default('') });
