import { getExecution } from './judge0.js';

const active = (statusId) => statusId === 1 || statusId === 2;
const terminalErrors = ['Compilation Error', 'Runtime Error', 'Time Limit Exceeded', 'Internal Error', 'System Error'];

export function presentContestSubmission(submission, includeCode = false) {
  const result = {
    id: String(submission._id), contestId: String(submission.contest),
    problemSlug: submission.problemSlug, problemTitle: submission.problemTitle,
    languageName: submission.languageName, status: submission.status,
    submittedAt: submission.submittedAt, completedAt: submission.completedAt,
    testCases: submission.testCases.map((item, index) => ({
      number: index + 1, visibility: item.visibility, status: item.status,
      stdout: item.visibility === 'public' ? item.stdout : '',
      stderr: item.visibility === 'public' ? item.stderr : '',
      compileOutput: item.visibility === 'public' ? item.compileOutput : '',
      time: item.time, memory: item.memory,
    })),
  };
  if (includeCode) result.sourceCode = submission.sourceCode;
  return result;
}

export async function refreshContestSubmission(submission) {
  if (!['Queued', 'Processing'].includes(submission.status)) return submission;
  const results = await Promise.all((submission.judgeTokens || []).map(async (token, index) => ({ index, result: await getExecution(token) })));
  let pending = false;
  for (const { index, result } of results) {
    const testCase = submission.testCases[index];
    if (active(result.statusId)) { testCase.status = result.status; pending = true; continue; }
    testCase.status = result.status;
    testCase.stdout = result.stdout; testCase.stderr = result.stderr;
    testCase.compileOutput = result.compileOutput || result.message;
    testCase.time = result.time; testCase.memory = result.memory;
  }
  if (!results.length) submission.status = 'Error';
  else if (pending) submission.status = 'Processing';
  else if (submission.testCases.some((item) => terminalErrors.includes(item.status))) submission.status = submission.testCases.find((item) => terminalErrors.includes(item.status)).status;
  else submission.status = submission.testCases.every((item) => item.status === 'Accepted') ? 'Accepted' : 'Wrong Answer';
  if (!pending) submission.completedAt = new Date();
  await submission.save();
  return submission;
}
