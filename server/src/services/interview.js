import { Question } from '../models/Question.js';

const levels = ['beginner', 'intermediate', 'advanced'];

export function adaptDifficulty(current, score) {
  const index = levels.indexOf(current);
  if (score >= 4) return levels[Math.min(index + 1, levels.length - 1)];
  if (score <= 2) return levels[Math.max(index - 1, 0)];
  return current;
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
    const allQuestions = available(await Question.find({ subject }).select('+answerGuide +keywords'));
    candidates = preferUnseen(allQuestions);
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
    questions: plain.questions.map((question) => completed
      ? ({ id: String(question.questionId), topic: question.topic, difficulty: question.difficulty, score: question.score, answeredAt: question.answeredAt })
      : ({ ...question, answerGuide: undefined, keywords: undefined, id: String(question.questionId) })),
  };
}
