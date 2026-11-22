import { connectDatabase } from '../config/database.js';
import { Contest } from '../models/Contest.js';
import { Problem } from '../models/Problem.js';

function nextMondayAtNoon(from) {
  const date = new Date(from);
  date.setUTCHours(12, 0, 0, 0);
  const daysUntilMonday = (8 - date.getUTCDay()) % 7;
  date.setUTCDate(date.getUTCDate() + daysUntilMonday);
  if (date <= from) date.setUTCDate(date.getUTCDate() + 7);
  return date;
}

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return { year: d.getUTCFullYear(), week: Math.ceil((((d - yearStart) / 86400000) + 1) / 7) };
}

try {
  await connectDatabase();
  const selected = await Problem.find({ slug: { $in: ['sum-two-numbers', 'maximum-in-array', 'factorial'] } }).select('slug title');
  if (selected.length !== 3) throw new Error('Seed coding problems first with `npm run seed:problems`.');
  const startsAt = nextMondayAtNoon(new Date());
  const { year, week } = isoWeek(startsAt);
  const slug = `weekly-practice-${year}-w${String(week).padStart(2, '0')}`;
  const exists = await Contest.exists({ slug });
  if (exists) {
    console.info(`Contest ${slug} already exists; no changes were made.`);
  } else {
    const bySlug = new Map(selected.map((item) => [item.slug, item]));
    await Contest.create({
      slug,
      title: `Weekly Coding Sprint · Week ${String(week).padStart(2, '0')}`,
      description: 'A 90-minute coding sprint with three problems that progress from warm-up to stretch challenge. Solve as many as you can and compare your score on the live leaderboard.',
      startsAt,
      durationMinutes: 90,
      problems: [
        { problemSlug: 'sum-two-numbers', title: bySlug.get('sum-two-numbers').title, points: 100 },
        { problemSlug: 'maximum-in-array', title: bySlug.get('maximum-in-array').title, points: 150 },
        { problemSlug: 'factorial', title: bySlug.get('factorial').title, points: 200 },
      ],
    });
    console.info(`Created ${slug}, starting ${startsAt.toISOString()} (UTC).`);
  }
} catch (error) {
  console.error(`Could not seed weekly contest: ${error.message}`);
  process.exitCode = 1;
} finally {
  const mongoose = await import('mongoose');
  await mongoose.default.disconnect();
}
