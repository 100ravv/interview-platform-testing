import { CodeSubmission } from '../models/CodeSubmission.js';
import { getExecution } from './judge0.js';
export { presentSubmission } from './codeSubmissionView.js';

const running = (statusId) => statusId === 1 || statusId === 2;

function overallStatus(submission) {
  if (submission.testCases.some((item) => ['Compilation Error', 'Runtime Error', 'Time Limit Exceeded', 'Internal Error', 'System Error'].includes(item.status))) {
    return submission.testCases.find((item) => item.status !== 'Accepted' && item.status !== 'Queued' && item.status !== 'Processing')?.status || 'Error';
  }
  if (submission.testCases.some((item) => item.status === 'Queued' || item.status === 'Processing')) return 'Processing';
  if (submission.testCases.every((item) => item.status === 'Accepted')) return 'Accepted';
  return 'Wrong Answer';
}

export async function refreshSubmission(submission) {
  if (submission.status !== 'Queued' && submission.status !== 'Processing') return submission;
  const tokens = submission.judgeTokens || [];
  const indices = tokens.map((token, index) => ({ token, index })).filter(({ token }) => token);
  if (!indices.length) return submission;
  const results = await Promise.all(indices.map(async ({ token, index }) => ({ index, result: await getExecution(token) })));
  let stillRunning = false;
  for (const { index, result } of results) {
    const testCase = submission.testCases[index];
    if (running(result.statusId)) {
      testCase.status = result.status;
      stillRunning = true;
      continue;
    }
    testCase.status = result.status;
    testCase.stdout = result.stdout;
    testCase.stderr = result.stderr;
    testCase.compileOutput = result.compileOutput || result.message;
    testCase.time = result.time;
    testCase.memory = result.memory;
  }
  submission.status = stillRunning ? 'Processing' : overallStatus(submission);
  if (!stillRunning) submission.completedAt = new Date();
  await submission.save();
  return submission;
}
