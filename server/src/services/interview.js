import { Question } from '../models/Question.js';

const levels = ['beginner', 'intermediate', 'advanced'];
export const INTERVIEW_DURATION_MS = 20 * 60 * 1000;

export function ensureInterviewDeadline(session, now = new Date()) {
  if (!session.expiresAt) session.expiresAt = new Date(now.getTime() + INTERVIEW_DURATION_MS);
  return session.expiresAt;
}

export function expireInterviewSession(session) {
  if (session.status === 'completed') return false;
  const expiredAt = new Date(session.expiresAt || Date.now());
  for (const question of session.questions) {
    if (!question.answeredAt) {
      question.score = 0;
      question.skipped = true;
      question.feedback = 'Not attempted before the 20-minute limit.';
      question.evaluationMode = null;
    }
  }
  while (session.questions.length < session.questionCount) {
    session.questions.push({
      topic: 'Not attempted',
      difficulty: session.currentDifficulty,
      score: 0,
      skipped: true,
      feedback: 'Not attempted before the 20-minute limit.',
    });
  }
  session.status = 'completed';
  session.completionReason = 'time_expired';
  session.completedAt = expiredAt;
  session.overallScore = Math.round(session.questions.slice(0, session.questionCount).reduce((sum, question) => sum + (question.score ?? 0), 0) / session.questionCount * 10) / 10;
  compactCompletedSession(session);
  return true;
}

export function adaptDifficulty(current, score) {
  const index = levels.indexOf(current);
  if (score >= 4) return levels[Math.min(index + 1, levels.length - 1)];
  if (score <= 2) return levels[Math.max(index - 1, 0)];
  return current;
}

export function repeatableQuestionCandidates(questions, excludedIds = [], previouslyAskedIds = []) {
  const lastQuestionId = String(excludedIds.at(-1) || '');
  const withoutLast = questions.filter((question) => String(question._id) !== lastQuestionId);
  const unseen = withoutLast.filter((question) => !previouslyAskedIds.includes(String(question._id)));
  return unseen.length ? unseen : withoutLast.length ? withoutLast : questions;
}

export async function chooseQuestion(subject, difficulty, excludedIds = [], previouslyAskedIds = []) {
  const exclude = new Set(excludedIds.map(String));
  const previouslyAsked = new Set(previouslyAskedIds.map(String));
  const available = (questions) => questions.filter((question) => !exclude.has(String(question._id)));
  const preferUnseen = (questions) => {
    const unseen = questions.filter((question) => !previouslyAsked.has(String(question._id)));
    return unseen.length ? unseen : questions;
  };

  let candidates = available(await Question.find({ subject, difficulty }).select('+answerGuide +keywords'));
  candidates = preferUnseen(candidates);
  if (!candidates.length) {
    const allQuestions = await Question.find({ subject }).select('+answerGuide +keywords');
    const unusedInSession = available(allQuestions);
    candidates = unusedInSession.length
      ? preferUnseen(unusedInSession)
      : repeatableQuestionCandidates(allQuestions, excludedIds, previouslyAskedIds);
  }
  if (!candidates.length) return null;
  const question = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    questionId: question._id,
    topic: question.topic,
    prompt: question.prompt,
    difficulty: question.difficulty,
    answerGuide: question.answerGuide,
    keywords: question.keywords,
  };
}

function uniquePoints(points, limit = 4) {
  const seen = new Set();
  return points.map((point) => String(point || '').trim()).filter((point) => {
    const key = point.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}

export function compactCompletedSession(session) {
  session.strengthsSummary = session.strengthsSummary?.length ? session.strengthsSummary : uniquePoints(session.questions.flatMap((question) => question.strengths || []));
  session.focusSummary = session.focusSummary?.length ? session.focusSummary : uniquePoints(session.questions.flatMap((question) => question.improvements || []));
  session.questions = session.questions.map((question) => ({
    questionId: question.questionId,
    topic: question.topic,
    difficulty: question.difficulty,
    score: question.score,
    skipped: question.skipped,
    evaluationMode: question.evaluationMode,
    answeredAt: question.answeredAt,
  }));
  return session;
}

function summaryFromQuestions(questions, field) {
  return uniquePoints((questions || []).flatMap((question) => question[field] || []));
}

export function presentSessionSummary(session) {
  const plain = session.toObject ? session.toObject() : session;
  return {
    id: String(plain._id),
    subject: plain.subject,
    startingDifficulty: plain.startingDifficulty,
    status: plain.status,
    overallScore: plain.overallScore,
    startedAt: plain.startedAt,
    completedAt: plain.completedAt,
    questionCount: plain.questionCount,
    answeredCount: (plain.questions || []).filter((question) => question.answeredAt).length,
    strengthsSummary: plain.strengthsSummary?.length ? plain.strengthsSummary : summaryFromQuestions(plain.questions, 'strengths'),
    focusSummary: plain.focusSummary?.length ? plain.focusSummary : summaryFromQuestions(plain.questions, 'improvements'),
  };
}

export function presentSession(session) {
  const plain = session.toObject ? session.toObject() : session;
  const completed = plain.status === 'completed';
  return {
    id: String(plain._id),
    subject: plain.subject,
    startingDifficulty: plain.startingDifficulty,
    currentDifficulty: plain.currentDifficulty,
    questionCount: plain.questionCount,
    status: plain.status,
    overallScore: plain.overallScore,
    startedAt: plain.startedAt,
    completedAt: plain.completedAt,
    questionCount: plain.questionCount,
    strengthsSummary: plain.strengthsSummary?.length ? plain.strengthsSummary : summaryFromQuestions(plain.questions, 'strengths'),
    focusSummary: plain.focusSummary?.length ? plain.focusSummary : summaryFromQuestions(plain.questions, 'improvements'),
    expiresAt: plain.expiresAt,
    completionReason: plain.completionReason,
    questions: plain.questions.map((question, index) => completed
      ? ({ id: question.questionId ? String(question.questionId) : `skipped-${index}`, topic: question.topic, difficulty: question.difficulty, score: question.score, skipped: question.skipped, answeredAt: question.answeredAt })
      : ({ ...question, answerGuide: undefined, keywords: undefined, id: String(question.questionId) })),
  };
}
