import { z } from 'zod';

export const startInterviewSchema = z.object({
  subject: z.enum(['JavaScript', 'React', 'Data Structures', 'DBMS', 'Operating Systems']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  questionCount: z.coerce.number().int().min(1).max(10).default(10),
});

export const answerSchema = z.object({ answer: z.string().trim().min(1).max(3000), autoSubmit: z.boolean().default(false) });
