export function contestState(contest, now = new Date()) {
  const startsAt = new Date(contest.startsAt);
  const endsAt = new Date(startsAt.getTime() + contest.durationMinutes * 60_000);
  return { startsAt, endsAt, status: now < startsAt ? 'upcoming' : now < endsAt ? 'live' : 'completed' };
}

export function presentContest(contest, { includeProblems = false, joined = false, participantCount = 0, now = new Date() } = {}) {
  const state = contestState(contest, now);
  return {
    id: String(contest._id),
    slug: contest.slug,
    title: contest.title,
    description: contest.description,
    startsAt: state.startsAt,
    endsAt: state.endsAt,
    durationMinutes: contest.durationMinutes,
    status: state.status,
    joined,
    participantCount,
    problemCount: contest.problems.length,
    problems: includeProblems ? contest.problems.map((item) => ({ slug: item.problemSlug, title: item.title, points: item.points })) : undefined,
  };
}

export function calculateContestScore(submissions, problems, contestStartedAt) {
  const byProblem = new Map();
  for (const submission of submissions) {
    const entries = byProblem.get(submission.problemSlug) || [];
    entries.push(submission);
    byProblem.set(submission.problemSlug, entries);
  }
  let score = 0;
  let penaltyMinutes = 0;
  let lastAcceptedAt = null;
  for (const problem of problems) {
    const attempts = (byProblem.get(problem.problemSlug) || []).sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
    let incorrect = 0;
    for (const attempt of attempts) {
      if (attempt.status === 'Accepted') {
        score += problem.points;
        const acceptedAt = new Date(attempt.completedAt || attempt.submittedAt);
        penaltyMinutes += Math.max(0, Math.floor((acceptedAt - new Date(contestStartedAt)) / 60_000)) + incorrect * 20;
        if (!lastAcceptedAt || acceptedAt > lastAcceptedAt) lastAcceptedAt = acceptedAt;
        break;
      }
      if (!['Queued', 'Processing'].includes(attempt.status)) incorrect += 1;
    }
  }
  return { score, penaltyMinutes, lastAcceptedAt };
}
