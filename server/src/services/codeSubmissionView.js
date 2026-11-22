export function presentSubmission(submission, includeSource = false) {
  return {
    id: String(submission._id),
    problemSlug: submission.problemSlug,
    problemTitle: submission.problemTitle,
    mode: submission.mode,
    languageId: submission.languageId,
    languageName: submission.languageName,
    status: submission.status,
    createdAt: submission.createdAt,
    completedAt: submission.completedAt,
    sourceCode: includeSource ? submission.sourceCode : undefined,
    testCases: submission.testCases.map((item, index) => ({
      number: index + 1,
      visibility: item.visibility,
      status: item.status,
      stdout: item.visibility === 'public' ? item.stdout : undefined,
      stderr: item.visibility === 'public' ? item.stderr : undefined,
      compileOutput: item.compileOutput || undefined,
      time: item.time,
      memory: item.memory,
    })),
  };
}
