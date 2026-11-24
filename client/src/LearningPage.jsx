import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink, FileText, LoaderCircle, Search, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from './lib/api.js';
import './learning.css';

const typeLabels = { documentation: 'Documentation', article: 'Article', video: 'Video', course: 'Course' };
const typeIcons = { documentation: FileText, article: BookOpen, video: Video, course: BookOpen };
const readable = (value = '') => value.charAt(0).toUpperCase() + value.slice(1);

export function LearningPage() {
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('All subjects');
  const [type, setType] = useState('All formats');
  const [level, setLevel] = useState('All levels');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/learning/resources').then((data) => setResources(data.resources)).catch((problem) => setError(problem.message)).finally(() => setLoading(false));
  }, []);

  const subjects = useMemo(() => ['All subjects', ...new Set(resources.map((item) => item.subject))], [resources]);
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return resources.filter((item) => (subject === 'All subjects' || item.subject === subject)
      && (type === 'All formats' || item.type === type)
      && (level === 'All levels' || item.level === level)
      && (!query || `${item.title} ${item.description} ${item.subject} ${item.provider}`.toLowerCase().includes(query)));
  }, [resources, search, subject, type, level]);

  return <main className="learning-page"><header className="learning-header"><Link className="code-brand" to="/"><span><BookOpen size={17} /></span>interview<span>.studio</span></Link><Link to="/" className="learning-workspace">Workspace <ArrowRight size={14} /></Link></header><div className="learning-main"><Link to="/" className="code-back"><ArrowLeft size={14} /> Back to overview</Link><section className="learning-intro"><span className="code-eyebrow"><BookOpen size={14} /> LEARNING MATERIALS</span><h1>Learn from trusted sources.</h1><p>Browse documentation, articles, courses, and videos chosen for the technologies and subjects you’re studying.</p><span className="learning-storage-note">Materials open at their original source. We store links and descriptions, not copies of the content.</span></section><section className="learning-controls" aria-label="Filter learning materials"><label className="learning-search"><Search size={17} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search materials or subjects" aria-label="Search learning materials" /></label><div className="learning-filters"><label><span>Subject</span><select aria-label="Filter by subject" value={subject} onChange={(event) => setSubject(event.target.value)}>{subjects.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Format</span><select aria-label="Filter by format" value={type} onChange={(event) => setType(event.target.value)}><option>All formats</option>{Object.entries(typeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label><span>Level</span><select aria-label="Filter by level" value={level} onChange={(event) => setLevel(event.target.value)}><option>All levels</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label></div></section>{error && <div className="form-error" role="alert">{error}</div>}{loading ? <div className="learning-empty"><LoaderCircle className="spin" size={19} /> Loading learning materials…</div> : !resources.length ? <div className="learning-empty"><BookOpen size={21} /><strong>Materials are not set up yet.</strong><span>Run <code>npm run seed:learning</code> from the project folder, then refresh this page.</span></div> : visible.length ? <><div className="learning-results"><strong>{visible.length} materials</strong><span>Links open in a new tab</span></div><section className="learning-grid">{visible.map((item) => { const Icon = typeIcons[item.type] || BookOpen; return <article className="learning-card" key={item.id}><div className="learning-card-top"><span className="learning-type"><Icon size={15} />{typeLabels[item.type] || readable(item.type)}</span><span className={`learning-level level-${item.level}`}>{readable(item.level)}</span></div><span className="learning-subject">{item.subject}</span><h2>{item.title}</h2><p>{item.description}</p><div className="learning-card-foot"><span>{item.provider}</span><a href={item.url} target="_blank" rel="noopener noreferrer">Open material <ExternalLink size={14} /><span className="sr-only"> (opens in a new tab)</span></a></div></article>; })}</section></> : <div className="learning-empty"><Search size={20} /><strong>No materials match those filters.</strong><button onClick={() => { setSearch(''); setSubject('All subjects'); setType('All formats'); setLevel('All levels'); }}>Clear filters</button></div>}</div></main>;
}
