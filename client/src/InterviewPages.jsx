import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, CircleHelp, Clock3, Command, History, LoaderCircle, Play, RotateCcw, Sparkles, Target, Trophy, Video } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from './lib/api.js';
import './interview.css';

const subjects = ['JavaScript', 'React', 'Data Structures', 'DBMS', 'Operating Systems'];
const difficulties = ['beginner', 'intermediate', 'advanced'];
const readable = (value = '') => value.replace('_', ' ').replace(/^\w/, (letter) => letter.toUpperCase());

function PracticeHeader({ eyebrow = 'AI INTERVIEW PRACTICE' }) {
  return <header className="practice-header"><Link to="/" className="practice-brand"><span><Command size={17} /></span>interview<span className="brand-purple">.studio</span></Link><div className="practice-breadcrumb"><Link to="/">Workspace</Link><ChevronRight size={14} />{eyebrow}</div><Link className="practice-history-link" to="/history"><History size={15} /> History</Link></header>;
}

export function InterviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [subject, setSubject] = useState('JavaScript');
  const [difficulty, setDifficulty] = useState('beginner');
  const [questionCount, setQuestionCount] = useState(10);
  const [session, setSession] = useState(null);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [timeLeftMs, setTimeLeftMs] = useState(20 * 60 * 1000);
  const timeoutRequestedRef = useRef(null);
  const timeoutRetryAfterRef = useRef(0);

  useEffect(() => {
    const sessionId = searchParams.get('sessionId');
    if (!sessionId) return;
    setBusy(true);
    api(`/interviews/${sessionId}`).then((data) => setSession(data.session)).catch((problem) => setError(problem.message)).finally(() => setBusy(false));
  }, [searchParams]);

  useEffect(() => {
    if (!session || session.status !== 'in_progress' || !session.expiresAt) return undefined;
    if (timeoutRequestedRef.current !== session.id) timeoutRequestedRef.current = null;
    const updateTimer = () => {
      const remaining = Math.max(0, new Date(session.expiresAt).getTime() - Date.now());
      setTimeLeftMs(remaining);
      if (remaining === 0 && !busy && timeoutRequestedRef.current !== session.id && Date.now() >= timeoutRetryAfterRef.current) {
        timeoutRequestedRef.current = session.id;
        const current = session.questions.at(-1);
        const autoSubmit = Boolean(answer.trim() && current && !current.answeredAt);
        const request = autoSubmit
          ? api(`/interviews/${session.id}/answer`, { method: 'POST', body: JSON.stringify({ answer, autoSubmit: true }) })
          : api(`/interviews/${session.id}`);
        if (autoSubmit) setBusy(true);
        request.then((data) => {
          setError(''); setSession(data.session);
          if (autoSubmit) setAnswer('');
          if (data.session.status === 'in_progress') { timeoutRequestedRef.current = null; timeoutRetryAfterRef.current = Date.now() + 500; }
        }).catch((problem) => {
          setError(problem.message);
          timeoutRequestedRef.current = null;
          timeoutRetryAfterRef.current = Date.now() + 3000;
        }).finally(() => { if (autoSubmit) setBusy(false); });
      }
    };
    updateTimer();
    const interval = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(interval);
  }, [session?.id, session?.status, session?.expiresAt, busy, answer]);

  async function start() {
    setBusy(true); setError(''); setNotice('');
    try { const data = await api('/interviews', { method: 'POST', body: JSON.stringify({ subject, difficulty, questionCount }) }); setSearchParams({}, { replace: true }); setSession(data.session); setAnswer(''); }
    catch (problem) { setError(problem.message); }
    finally { setBusy(false); }
  }
  async function submit(event) {
    event.preventDefault(); if (!session || !answer.trim()) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const data = await api(`/interviews/${session.id}/answer`, { method: 'POST', body: JSON.stringify({ answer }) });
      setSession(data.session); setAnswer('');
      if (data.evaluation?.mode === 'basic') setNotice('Basic offline feedback is being used. Add GROQ_API_KEY to server/.env for AI evaluation.');
    } catch (problem) { setError(problem.message); }
    finally { setBusy(false); }
  }

  const current = session?.questions.at(-1);
  const formattedTime = `${String(Math.floor(timeLeftMs / 60_000)).padStart(2, '0')}:${String(Math.floor(timeLeftMs % 60_000 / 1000)).padStart(2, '0')}`;
  const progressPercent = session?.status === 'completed' ? 100 : Math.round(session?.questions.filter((item) => item.answeredAt).length / session?.questionCount * 100);
  return <div className="practice-page"><PracticeHeader /><main className="practice-main">
    {!session ? <>
      <Link to="/" className="back-link"><ArrowLeft size={14} /> Back to overview</Link>
      <div className="practice-intro"><span className="practice-eyebrow"><Sparkles size={13} /> YOUR PRIVATE PRACTICE ROOM</span><h1>Practice with intention.</h1><p>Choose a subject and starting level. Questions will adjust as you go.</p></div>
      <section className="setup-card"><div className="setup-heading"><div className="setup-symbol"><Target size={20} /></div><div><h2>Set up a practice session</h2><p>Pick a focus. We’ll take it one question at a time.</p></div></div>
        <div className="setup-fields"><label>Subject<select value={subject} onChange={(event) => setSubject(event.target.value)}>{subjects.map((item) => <option key={item}>{item}</option>)}</select></label><label>Starting difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>{difficulties.map((item) => <option key={item} value={item}>{readable(item)}</option>)}</select></label><label>Questions<select value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))}>{[5, 10].map((count) => <option key={count} value={count}>{count} questions</option>)}</select></label></div>
        {error && <div className="form-error" role="alert">{error}</div>}<button className="practice-primary" disabled={busy} onClick={start}>{busy ? <LoaderCircle className="spin" size={17} /> : <Play size={16} />}{busy ? 'Preparing your session…' : 'Start practice'}<ArrowRight size={16} /></button>
      </section>
      <div className="practice-note"><CircleHelp size={15} /><span>Your answers and feedback are saved privately to your account. You can review them from history at any time.</span></div>
    </> : <>
      <div className="room-topline"><div><Link to="/" className="back-link"><ArrowLeft size={14} /> Leave practice</Link><span className="room-topic">{session.subject} <i>·</i> {readable(session.currentDifficulty)}</span></div><div className="session-indicators">{session.status === 'in_progress' && <span className={`interview-timer ${timeLeftMs <= 60_000 ? 'timer-warning' : ''}`} aria-live="off"><Clock3 size={14} /> {formattedTime} left</span>}<span className={`session-state ${session.status}`}>{session.status === 'completed' ? <Check size={13} /> : <span className="live-dot" />}{readable(session.status)}</span></div></div>
      <div className="room-title"><span className="practice-eyebrow"><Sparkles size={13} /> FOCUSED PRACTICE</span><h1>{session.status === 'completed' ? session.completionReason === 'time_expired' ? 'Time is up.' : 'Look how far you got.' : 'Think it through.'}</h1><p>{session.subject} interview practice{session.completionReason === 'time_expired' ? ' · Unanswered questions received 0 points.' : ''}</p></div>
      <div className="room-progress"><div className="progress-copy"><span>QUESTION {Math.min(session.questions.length, session.questionCount)} <i>OF</i> {session.questionCount}</span><span>{progressPercent}% complete</span></div><div className="progress-track"><span style={{ width: `${session.questions.filter((item) => item.answeredAt).length / session.questionCount * 100}%` }} /></div></div>
      {session.status === 'completed' ? <article className="answer-review"><div className="review-title"><span>WHAT WENT WELL</span></div>{session.strengthsSummary?.length ? session.strengthsSummary.map((point) => <p className="review-feedback" key={point}>{point}</p>) : <p className="review-feedback">Keep building on the concepts you handled confidently.</p>}<div className="review-title" style={{ marginTop: 18 }}><span>WHAT TO FOCUS ON</span></div>{session.focusSummary?.length ? session.focusSummary.map((point) => <p className="review-feedback" key={point}>{point}</p>) : <p className="review-feedback">Continue practicing clear explanations and examples.</p>}<div className="review-lists">{session.questions.map((item, index) => <div key={item.id + '-' + index}><strong>{item.skipped ? `Question ${index + 1} · Not attempted` : item.topic}</strong><p>{item.score}/5 · {readable(item.difficulty)}</p></div>)}</div></article> : session.questions.filter((item) => item.answeredAt).map((item, index) => <article className="answer-review" key={item.id}><div className="review-title"><span>QUESTION {index + 1} REVIEW</span><span className="score-pill">{item.score}/5</span></div><p className="review-prompt">{item.prompt}</p><div className="review-answer"><span>Your answer</span><p>{item.answer}</p></div><p className="review-feedback">{item.feedback}</p><div className="review-lists">{item.strengths?.length > 0 && <div><strong>What you did well</strong>{item.strengths.map((point) => <p key={point}><Check size={13} />{point}</p>)}</div>}{item.improvements?.length > 0 && <div><strong>Try next time</strong>{item.improvements.map((point) => <p key={point}><ArrowRight size={13} />{point}</p>)}</div>}</div></article>)}      {session.status === 'completed' ? <section className="completion-card"><div className="completion-icon"><Trophy size={23} /></div><div><span className="practice-eyebrow">SESSION COMPLETE</span><h2>Your average score: {session.overallScore}/5</h2><p>Every attempt gives you something to build on.</p></div><div className="completion-actions"><button className="practice-secondary" onClick={() => { setSession(null); setNotice(''); }}><RotateCcw size={15} /> New session</button><Link to="/history" className="practice-primary compact">See history <ArrowRight size={15} /></Link></div></section> : <section className="question-card"><div className="question-card-top"><span><span className="question-number">{String(session.questions.filter((item) => item.answeredAt).length + 1).padStart(2, '0')}</span><span className="question-of">/ {String(session.questionCount).padStart(2, '0')}</span></span><span className="question-difficulty">{readable(current?.difficulty)}</span></div><span className="question-topic">{current?.topic}</span><h2>{current?.prompt}</h2><form onSubmit={submit}><label htmlFor="answer">Your answer</label><textarea id="answer" rows="7" maxLength="3000" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Take your time. Explain your thinking as if you were talking it through with an interviewer…" required /><div className="answer-meta"><span>{answer.length} / 3000</span><span>Keep it clear and use examples where you can.</span></div>{error && <div className="form-error" role="alert">{error}</div>}{notice && <div className="offline-notice" role="status">{notice}</div>}<button className="practice-primary submit-answer" disabled={busy || !answer.trim() || timeLeftMs <= 0}>{busy ? <LoaderCircle className="spin" size={17} /> : <Check size={16} />}{busy ? 'Reviewing your answer…' : 'Submit answer'}<ArrowRight size={16} /></button></form></section>}
  </>}
  </main></div>;
}

export function HistoryPage({ user }) {
  const [sessions, setSessions] = useState([]); const [meetings, setMeetings] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([api('/interviews'), api('/meetings')])
      .then(([interviewData, meetingData]) => {
        setSessions(interviewData.sessions);
        setMeetings(meetingData.meetings.filter((meeting) => meeting.status === 'completed' && meeting.evaluation?.rating != null));
      })
      .catch((problem) => setError(problem.message)).finally(() => setLoading(false));
  }, []);
  const entries = [
    ...sessions.map((session) => ({ ...session, type: 'ai', time: session.completedAt || session.startedAt })),
    ...meetings.map((meeting) => ({ ...meeting, type: 'human', time: meeting.endedAt || meeting.scheduledAt })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time));
  return <div className="practice-page"><PracticeHeader eyebrow="PRACTICE HISTORY" /><main className="practice-main"><Link to="/" className="back-link"><ArrowLeft size={14} /> Back to overview</Link><div className="practice-intro"><span className="practice-eyebrow"><History size={13} /> YOUR GROWTH, IN ONE PLACE</span><h1>Practice history.</h1><p>AI practice summaries and completed human interview evaluations.</p></div>{error && <div className="form-error">{error}</div>}{loading ? <div className="history-empty">Loading your sessions…</div> : entries.length ? <div className="history-list">{entries.map((entry) => entry.type === 'ai' ? <Link to={'/history/' + entry.id} className="history-card" key={'ai-' + entry.id}><span className="history-icon"><Target size={18} /></span><span className="history-main"><strong>{entry.subject} · AI interview</strong><span>{new Date(entry.time).toLocaleString()} <i>·</i> {entry.answeredCount} questions</span></span><span className={'history-status ' + entry.status}>{readable(entry.status)}</span>{entry.overallScore != null && <span className="history-score">{entry.overallScore}<i>/5</i></span>}<ArrowRight className="history-arrow" size={16} /></Link> : <Link to={'/meetings/' + entry.id + '/result'} className="history-card" key={'human-' + entry.id}><span className="history-icon"><Video size={18} /></span><span className="history-main"><strong>{entry.title} · Human interview</strong><span>{new Date(entry.time).toLocaleString()} <i>·</i> {user?.role === 'student' ? 'Rating received' : 'Rating given'}</span></span><span className="history-status completed">Completed</span><span className="history-score">{entry.evaluation.rating}<i>/5</i></span><ArrowRight className="history-arrow" size={16} /></Link>)}</div> : <section className="history-empty"><span className="empty-icon"><Clock3 size={22} /></span><h2>Your story starts here.</h2><p>Complete an AI practice session or human interview to see its results here.</p><Link to="/interview" className="practice-primary compact">Start practicing <ArrowRight size={15} /></Link></section>}</main></div>;
}

export function SessionDetailPage() {
  const { sessionId } = useParams(); const [session, setSession] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api('/interviews/' + sessionId).then((data) => setSession(data.session)).catch((problem) => setError(problem.message)); }, [sessionId]);
  return <div className="practice-page"><PracticeHeader eyebrow="SESSION REVIEW" /><main className="practice-main"><Link to="/history" className="back-link"><ArrowLeft size={14} /> Back to history</Link>{error && <div className="form-error">{error}</div>}{!session && !error ? <div className="history-empty">Loading session…</div> : session && <><div className="practice-intro"><span className="practice-eyebrow"><Target size={13} /> AI SESSION SUMMARY</span><h1>{session.subject} practice.</h1><p>Started {new Date(session.startedAt).toLocaleString()} <i>·</i> {session.status === 'completed' ? (session.completionReason === 'time_expired' ? 'Time expired · ' : '') + 'Average score ' + session.overallScore + '/5' : 'In progress'}</p></div>{session.status === 'in_progress' && <Link to={'/interview?sessionId=' + session.id} className="practice-primary compact">Continue this session <ArrowRight size={15} /></Link>}{session.status === 'completed' ? <><article className="answer-review"><div className="review-title"><span>WHAT WENT WELL</span></div>{session.strengthsSummary?.length ? session.strengthsSummary.map((point) => <p className="review-feedback" key={point}>{point}</p>) : <p className="review-feedback">Keep building on the concepts you handled confidently.</p>}<div className="review-title" style={{ marginTop: 18 }}><span>WHAT TO FOCUS ON</span></div>{session.focusSummary?.length ? session.focusSummary.map((point) => <p className="review-feedback" key={point}>{point}</p>) : <p className="review-feedback">Continue practicing clear explanations and examples.</p>}</article><article className="answer-review"><div className="review-title"><span>TOPIC SCORES</span></div><div className="review-lists">{session.questions.map((item, index) => <div key={item.id + '-' + index}><strong>{item.skipped ? `Question ${index + 1} · Not attempted` : item.topic}</strong><p>{item.difficulty} · {item.score}/5</p></div>)}</div></article></> : session.questions.map((item, index) => <article className="answer-review" key={item.id}><div className="review-title"><span>QUESTION {index + 1} · {readable(item.difficulty)}</span>{item.score && <span className="score-pill">{item.score}/5</span>}</div><p className="review-prompt">{item.prompt}</p>{item.answer ? <><p className="review-feedback">Your answer has been evaluated.</p><div className="review-lists">{item.strengths?.length > 0 && <div><strong>What you did well</strong>{item.strengths.map((point) => <p key={point}><Check size={13} />{point}</p>)}</div>}{item.improvements?.length > 0 && <div><strong>Try next time</strong>{item.improvements.map((point) => <p key={point}><ArrowRight size={13} />{point}</p>)}</div>}</div></> : <div className="review-answer"><span>Not answered yet</span></div>}</article>)}</>}</main></div>;
}
