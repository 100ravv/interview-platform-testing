import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Braces, Check, ChevronRight, CircleAlert, Clock3, Code2, Command, FileCode2, History, LoaderCircle, Play, Send, ShieldCheck, Terminal, Trophy } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from './lib/api.js';
import './code.css';

const difficulties = ['Easy', 'Medium', 'Hard'];
const fallbackLanguages = [
  { id: 54, name: 'C++ (GCC 9.2.0)' },
  { id: 62, name: 'Java (OpenJDK 13.0.1)' },
  { id: 71, name: 'Python (3.8.1)' },
];
const statusClass = (status = '') => status.toLowerCase().replaceAll(' ', '-');

function CodeHeader({ page = 'Coding practice' }) {
  return <header className="code-header"><Link to="/" className="code-brand"><span><Command size={17} /></span>interview<span>.studio</span></Link><div className="code-crumb"><Link to="/">Workspace</Link><ChevronRight size={14} />{page}</div><Link to="/code/submissions" className="code-history"><History size={15} /> Submission history</Link></header>;
}

function CodeShell({ children, page }) {
  return <div className="code-page"><CodeHeader page={page} /><main className="code-main">{children}</main></div>;
}

export function ProblemListPage() {
  const [problems, setProblems] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [filter, setFilter] = useState('All');
  useEffect(() => { api('/code/problems').then((data) => setProblems(data.problems)).catch((problem) => setError(problem.message)).finally(() => setLoading(false)); }, []);
  const categories = ['All', ...new Set(problems.map((item) => item.category))];
  const visible = problems.filter((item) => filter === 'All' || item.category === filter);
  return <CodeShell page="Coding practice"><Link to="/" className="code-back"><ArrowLeft size={14} /> Back to overview</Link><section className="code-intro"><span className="code-eyebrow"><Braces size={14} /> YOUR PRACTICE ARENA</span><h1>Make it work. Make it clear.</h1><p>Choose a problem, write your solution, and test it against examples and hidden cases.</p></section><div className="problem-controls"><div><span className="problem-count">{problems.length} CHALLENGES</span><span className="problem-count-detail">A growing set of coding exercises</span></div><div className="category-filters">{categories.map((category) => <button className={filter === category ? 'selected' : ''} key={category} onClick={() => setFilter(category)}>{category}</button>)}</div></div>{error && <div className="form-error">{error}</div>}{loading ? <div className="code-empty"><LoaderCircle className="spin" size={19} /> Loading the problem set…</div> : visible.length ? <div className="problem-grid">{visible.map((problem, index) => <Link to={`/code/problems/${problem.slug}`} className="problem-tile" key={problem.id}><div className="problem-tile-top"><span className="problem-number">{String(index + 1).padStart(2, '0')}</span><span className={`difficulty-tag ${statusClass(problem.difficulty)}`}>{problem.difficulty}</span></div><h2>{problem.title}</h2><p>{problem.summary}</p><div className="problem-tile-foot"><span>{problem.category}</span><span>Open challenge <ArrowRight size={13} /></span></div></Link>)}</div> : <div className="code-empty">No challenges in this category yet.</div>}</CodeShell>;
}

function starterCode(language = '') {
  const name = language.toLowerCase();
  if (/\bpython\b/.test(name)) return 'import sys\n\ndata = sys.stdin.read().strip().split()\n# Write your solution here\n';
  if (/\bc\+\+|\bgcc\s*c\+\+/.test(name)) return '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    // Read input from stdin and print the answer.\n    return 0;\n}\n';
  if (/\bjava\b/.test(name)) return 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        // Write your solution here\n    }\n}\n';
  return '';
}

function SubmissionResult({ submission, onDismiss }) {
  if (!submission) return null;
  const pending = ['Queued', 'Processing'].includes(submission.status);
  return <section className="result-card"><div className="result-heading"><span className="result-label"><Terminal size={14} /> {submission.mode === 'run' ? 'RUN RESULT' : 'SUBMISSION RESULT'}</span><span className={`result-status ${statusClass(submission.status)}`}>{pending && <LoaderCircle className="spin" size={12} />}{submission.status}</span></div><div className="result-summary">{submission.testCases.filter((item) => item.status === 'Accepted').length} / {submission.testCases.length} test cases passed <span>{submission.languageName}</span></div>{submission.testCases.map((item) => <div className="test-result" key={item.number}><span className={`test-result-dot ${item.status === 'Accepted' ? 'pass' : pending ? 'wait' : 'fail'}`}>{item.status === 'Accepted' ? <Check size={10} /> : pending ? <Clock3 size={10} /> : <CircleAlert size={10} />}</span><strong>{item.visibility === 'public' ? `Example ${item.number}` : `Hidden test ${item.number}`}</strong><span className={statusClass(item.status)}>{item.status}</span>{item.visibility === 'public' && item.stdout && <pre>{item.stdout}</pre>}{item.visibility === 'public' && item.stderr && <pre className="stderr">{item.stderr}</pre>}{item.compileOutput && <pre className="stderr">{item.compileOutput}</pre>}</div>)}<div className="result-foot"><span>{pending ? 'Waiting for Judge0 to finish…' : submission.completedAt ? `Finished ${new Date(submission.completedAt).toLocaleTimeString()}` : 'Result saved to your history.'}</span><Link to={`/code/submissions/${submission.id}`}>Open details <ArrowRight size={12} /></Link>{onDismiss && <button onClick={onDismiss}>Dismiss</button>}</div></section>;
}

export function ProblemDetailPage() {
  const { slug } = useParams(); const [searchParams] = useSearchParams(); const contestId = searchParams.get('contestId'); const [contest, setContest] = useState(null); const [problem, setProblem] = useState(null); const [languages, setLanguages] = useState([]); const [executionAvailable, setExecutionAvailable] = useState(false); const [languageId, setLanguageId] = useState(''); const [sourceCode, setSourceCode] = useState(''); const [submission, setSubmission] = useState(null); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [languageError, setLanguageError] = useState('');
  useEffect(() => {
    api(`/code/problems/${slug}`).then((data) => setProblem(data.problem)).catch((problemError) => setError(problemError.message)).finally(() => setLoading(false));
    if (contestId) api(`/contests/${contestId}`).then((data) => setContest(data.contest)).catch((problemError) => setError(problemError.message));
    api('/code/languages').then((data) => { setLanguages(data.languages); setExecutionAvailable(Boolean(data.executionAvailable)); const first = data.languages[0]; if (first) { setLanguageId(String(first.id)); setSourceCode(starterCode(first.name)); } }).catch((problemError) => { setLanguages(fallbackLanguages); setLanguageId(String(fallbackLanguages[0].id)); setSourceCode(starterCode(fallbackLanguages[0].name)); setLanguageError(problemError.message); });
  }, [slug, contestId]);
  useEffect(() => {
    if (!submission || !['Queued', 'Processing'].includes(submission.status)) return undefined;
    const timer = setTimeout(() => api(contestId ? `/contests/${contestId}/submissions/${submission.id}` : `/code/submissions/${submission.id}`).then((data) => setSubmission(data.submission)).catch((problemError) => setError(problemError.message)), 1600);
    return () => clearTimeout(timer);
  }, [submission, contestId]);

  async function runCode(mode) {
    setBusy(true); setError('');
    try { const path = contestId ? `/contests/${contestId}/problems/${slug}/submissions` : `/code/problems/${slug}/submissions`; const data = await api(path, { method: 'POST', body: JSON.stringify({ sourceCode, languageId: Number(languageId), mode }) }); setSubmission(data.submission); }
    catch (problemError) { setError(problemError.message); }
    finally { setBusy(false); }
  }
  function insertIndent(event) {
    if (event.key !== 'Tab') return;
    event.preventDefault(); const element = event.currentTarget; const start = element.selectionStart; const end = element.selectionEnd;
    setSourceCode(`${sourceCode.slice(0, start)}  ${sourceCode.slice(end)}`);
    requestAnimationFrame(() => { element.selectionStart = start + 2; element.selectionEnd = start + 2; });
  }
  function changeLanguage(value) { const selected = languages.find((item) => String(item.id) === value); setLanguageId(value); if (selected) setSourceCode(starterCode(selected.name)); }

  if (loading) return <CodeShell page="Coding problem"><div className="code-empty"><LoaderCircle className="spin" size={19} /> Loading challenge…</div></CodeShell>;
  if (!problem) return <CodeShell page="Coding problem"><div className="form-error">{error || 'Problem not found.'}</div></CodeShell>;
  return <CodeShell page={problem.title}><Link to={contestId ? `/contests/${contestId}` : '/code'} className="code-back"><ArrowLeft size={14} /> {contestId ? 'Back to contest' : 'All problems'}</Link>{contestId && contest && <div className="contest-code-note"><Trophy size={14} /> Contest submission · {contest.title} · {contest.status}</div>}<div className="coding-workspace"><section className="statement-pane"><div className="statement-heading"><div><span className="code-eyebrow">{problem.category.toUpperCase()}</span><h1>{problem.title}</h1></div><span className={`difficulty-tag ${statusClass(problem.difficulty)}`}>{problem.difficulty}</span></div><p className="problem-statement">{problem.statement}</p><h2>Input format</h2><p>{problem.inputFormat}</p><h2>Output format</h2><p>{problem.outputFormat}</p><h2>Constraints</h2><ul>{problem.constraints.map((item) => <li key={item}><code>{item}</code></li>)}</ul><h2>Examples</h2>{problem.examples.map((example, index) => <div className="example-block" key={example.name}><strong>{example.name || `Example ${index + 1}`}</strong><div><span>Input</span><pre>{example.input || '(empty)'}</pre></div><div><span>Output</span><pre>{example.expectedOutput}</pre></div></div>)}<div className="hidden-note"><ShieldCheck size={14} /> Additional test cases are hidden until you submit.</div></section><section className="editor-pane"><div className="editor-toolbar"><span><FileCode2 size={14} /> solution</span><select aria-label="Programming language" value={languageId} onChange={(event) => changeLanguage(event.target.value)} disabled={!languages.length}>{languages.length ? languages.map((language) => <option key={language.id} value={language.id}>{language.name}</option>) : <option>Choose language</option>}</select></div><div className="editor-body"><div className="line-numbers">{sourceCode.split('\n').map((_, index) => <span key={index}>{index + 1}</span>)}</div><textarea aria-label="Your code" spellCheck="false" autoCapitalize="off" autoCorrect="off" value={sourceCode} onChange={(event) => setSourceCode(event.target.value)} onKeyDown={insertIndent} placeholder="Write your solution here…" /></div>{!executionAvailable && <div className="judge-warning"><CircleAlert size={14} /><span>You can choose a language and write code. Configure a reachable Judge0 service in <code>server/.env</code> to run or submit it.</span></div>}{languageError && <div className="judge-warning"><CircleAlert size={14} /><span>{languageError} Check the Judge0 URL in <code>server/.env</code>.</span></div>}{error && <div className="form-error code-form-error" role="alert">{error}</div>}<div className="editor-actions"><div><Link to="/code/submissions" className="editor-history-link"><History size={14} /> History</Link><span className="editor-private"><ShieldCheck size={13} /> Private to you</span></div><div>{!contestId && <button className="run-button" disabled={busy || !executionAvailable || !languageId || !sourceCode.trim()} onClick={() => runCode('run')}>{busy ? <LoaderCircle className="spin" size={14} /> : <Play size={14} />} Run examples</button>}<button className="submit-button" disabled={busy || !executionAvailable || !languageId || !sourceCode.trim() || (contestId && contest?.status !== 'live') || (contestId && contest && !contest.joined)} onClick={() => runCode('submit')}>{busy ? <LoaderCircle className="spin" size={14} /> : <Send size={14} />} {contestId ? 'Submit to contest' : 'Submit'}</button></div></div><SubmissionResult submission={submission} /></section></div></CodeShell>;
}

export function SubmissionHistoryPage() {
  const [submissions, setSubmissions] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { api('/code/submissions').then((data) => setSubmissions(data.submissions)).catch((problem) => setError(problem.message)).finally(() => setLoading(false)); }, []);
  return <CodeShell page="Submission history"><Link to="/code" className="code-back"><ArrowLeft size={14} /> Back to problems</Link><div className="code-intro"><span className="code-eyebrow"><History size={14} /> YOUR ATTEMPTS</span><h1>Submission history.</h1><p>Review your recent runs and submitted solutions.</p></div>{error && <div className="form-error">{error}</div>}{loading ? <div className="code-empty">Loading your submissions…</div> : submissions.length ? <div className="submission-list">{submissions.map((item) => <Link to={`/code/submissions/${item.id}`} className="submission-row" key={item.id}><span className="submission-icon"><Code2 size={16} /></span><span className="submission-copy"><strong>{item.problemTitle}</strong><span>{item.languageName} · {new Date(item.createdAt).toLocaleString()} · {item.mode}</span></span><span className={`result-status ${statusClass(item.status)}`}>{item.status}</span><ArrowRight size={15} /></Link>)}</div> : <section className="code-empty history-empty"><span className="empty-icon"><Trophy size={20} /></span><h2>Your first solution is waiting.</h2><p>Choose a challenge to start writing code.</p><Link to="/code" className="submit-button">Browse problems <ArrowRight size={14} /></Link></section>}</CodeShell>;
}

export function SubmissionDetailPage() {
  const { submissionId } = useParams(); const [submission, setSubmission] = useState(null); const [error, setError] = useState('');
  useEffect(() => {
    let active = true; let timer;
    const refresh = async () => {
      try { const data = await api(`/code/submissions/${submissionId}`); if (!active) return; setSubmission(data.submission); if (['Queued', 'Processing'].includes(data.submission.status)) timer = setTimeout(refresh, 1600); }
      catch (problem) { if (active) setError(problem.message); }
    };
    refresh(); return () => { active = false; clearTimeout(timer); };
  }, [submissionId]);
  return <CodeShell page="Submission details"><Link to="/code/submissions" className="code-back"><ArrowLeft size={14} /> Back to submissions</Link>{error && <div className="form-error">{error}</div>}{!submission && !error ? <div className="code-empty"><LoaderCircle className="spin" size={19} /> Loading submission…</div> : submission && <><div className="code-intro"><span className="code-eyebrow"><Code2 size={14} /> {submission.languageName}</span><h1>{submission.problemTitle}</h1><p>{submission.mode === 'run' ? 'Run result' : 'Final submission'} · {new Date(submission.createdAt).toLocaleString()}</p></div><SubmissionResult submission={submission} /><section className="saved-code"><h2><FileCode2 size={15} /> Submitted code</h2><pre>{submission.sourceCode}</pre><Link to={`/code/problems/${submission.problemSlug}`} className="submit-button">Try this problem again <ArrowRight size={14} /></Link></section></>}</CodeShell>;
}
