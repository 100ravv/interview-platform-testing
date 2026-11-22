import { z } from 'zod';

export const submitCodeSchema = z.object({
  sourceCode: z.string().min(1).max(20000),
  languageId: z.coerce.number().int().positive(),
  mode: z.enum(['run', 'submit']).default('run'),
});
