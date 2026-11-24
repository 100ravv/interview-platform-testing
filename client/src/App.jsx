import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Activity, ArrowDownLeft, ArrowRight, ArrowUpRight, Bell, BookOpen, Braces, CalendarDays, Check, ChevronDown, Clock3, Code2, Command, Compass, FileText, History, LayoutDashboard, LogOut, Menu, Monitor, Moon, MoreHorizontal, ShieldCheck, Sparkles, Sun, Users, Video, X } from 'lucide-react';
import { api } from './lib/api.js';
import { HistoryPage, InterviewPage, SessionDetailPage } from './InterviewPages.jsx';
import { ProblemDetailPage, ProblemListPage, SubmissionDetailPage, SubmissionHistoryPage } from './CodePages.jsx';
import { MeetingListPage, MeetingRoomPage, MeetingResultPage } from './MeetingPages.jsx';
import { AnalyticsPage } from './AnalyticsPage.jsx';
import { AdminUsersPage } from './AdminPages.jsx';
import { LearningPage } from './LearningPage.jsx';
import './notifications.css';

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);
const initials = (name = 'User') => name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
const titleCase = (value = '') => value.charAt(0).toUpperCase() + value.slice(1);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(sessionStorage.getItem('token')));
  const [theme, setThemeState] = useState(() => localStorage.getItem('interview-studio-theme') || 'system');
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => { document.documentElement.dataset.theme = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme; };
    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [theme]);
  useEffect(() => {
    if (!sessionStorage.getItem('token')) return;
    api('/auth/me').then((data) => setUser(data.user)).catch(() => sessionStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);
  const value = useMemo(() => ({ user, loading, theme, setTheme(value) { localStorage.setItem('interview-studio-theme', value); setThemeState(value); }, async signIn(email, password, isRegister, name, role) {
    const data = await api(isRegister ? '/auth/register' : '/auth/login', { method: 'POST', body: JSON.stringify(isRegister ? { name, email, password, role } : { email, password }) });
    sessionStorage.setItem('token', data.token); setUser(data.user); return data.user;
  }, signOut() { sessionStorage.removeItem('token'); setUser(null); } }), [user, loading, theme]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function App() {
  return <AuthProvider><Routes><Route path="/login" element={<AuthPage />} /><Route path="/register" element={<AuthPage register />} /><Route path="/interview" element={<ProtectedRoute><InterviewPage /></ProtectedRoute>} /><Route path="/history" element={<ProtectedRoute><HistoryRoute /></ProtectedRoute>} /><Route path="/history/:sessionId" element={<ProtectedRoute><SessionDetailPage /></ProtectedRoute>} /><Route path="/code" element={<ProtectedRoute><ProblemListPage /></ProtectedRoute>} /><Route path="/code/problems/:slug" element={<ProtectedRoute><ProblemDetailPage /></ProtectedRoute>} /><Route path="/code/submissions" element={<ProtectedRoute><SubmissionHistoryPage /></ProtectedRoute>} /><Route path="/code/submissions/:submissionId" element={<ProtectedRoute><SubmissionDetailPage /></ProtectedRoute>} /><Route path="/learning" element={<ProtectedRoute><LearningPage /></ProtectedRoute>} /><Route path="/meetings" element={<ProtectedRoute><MeetingsRoute /></ProtectedRoute>} /><Route path="/meetings/:meetingId/room" element={<ProtectedRoute><MeetingRoomRoute /></ProtectedRoute>} /><Route path="/meetings/:meetingId/result" element={<ProtectedRoute><MeetingResultRoute /></ProtectedRoute>} /><Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} /><Route path="/admin/users" element={<ProtectedRoute><AdminUsersRoute /></ProtectedRoute>} /><Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></AuthProvider>;
}

function MeetingsRoute() { const { user } = useAuth(); return <MeetingListPage user={user} />; }
function MeetingRoomRoute() { const { user } = useAuth(); return <MeetingRoomPage user={user} />; }
function MeetingResultRoute() { const { user } = useAuth(); return <MeetingResultPage user={user} />; }
function HistoryRoute() { const { user } = useAuth(); return <HistoryPage user={user} />; }
function AdminUsersRoute() { const { user } = useAuth(); return <AdminUsersPage user={user} />; }

function NotificationMenu() {
  const navigate = useNavigate(); const [open, setOpen] = useState(false); const [items, setItems] = useState([]); const [unreadCount, setUnreadCount] = useState(0);
  async function refresh() { try { const data = await api('/notifications'); setItems(data.notifications); setUnreadCount(data.unreadCount); } catch { /* The menu remains usable if notifications are temporarily unavailable. */ } }
  useEffect(() => { refresh(); const timer = setInterval(refresh, 30_000); return () => clearInterval(timer); }, []);
  async function openNotification(item) { if (!item.read) { await api(`/notifications/${item.id}/read`, { method: 'PATCH' }).catch(() => {}); setItems((all) => all.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry)); setUnreadCount((count) => Math.max(0, count - 1)); } setOpen(false); navigate(item.href); }
  async function markAll() { await api('/notifications/read-all', { method: 'PATCH' }).catch(() => {}); setItems((all) => all.map((item) => ({ ...item, read: true }))); setUnreadCount(0); }
  return <div className="notification-wrap"><button className="icon-button notification-button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={open} onClick={() => { setOpen((value) => !value); refresh(); }}><Bell size={17} />{unreadCount > 0 && <i />}</button>{open && <section className="notification-popover"><div className="notification-popover-head"><div><strong>Notifications</strong><span>{unreadCount ? `${unreadCount} unread` : 'You’re all caught up'}</span></div>{unreadCount > 0 && <button onClick={markAll}>Mark all read</button>}</div><div className="notification-items">{items.length ? items.map((item) => <button className={`notification-item ${item.read ? '' : 'notification-unread'}`} key={item.id} onClick={() => openNotification(item)}><span className="notification-dot" /><span><strong>{item.title}</strong><small>{item.message}</small><time>{new Date(item.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</time></span></button>) : <div className="notification-empty">Interview requests and feedback will appear here.</div>}</div></section>}</div>;
}

function ThemeControl() {
  const { theme, setTheme } = useAuth();
  const [open, setOpen] = useState(false);
  const choices = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];
  const CurrentIcon = choices.find((choice) => choice.value === theme)?.icon || Monitor;
  return <div className="theme-control"><button className="icon-button theme-trigger" aria-label={`Theme: ${theme}`} aria-expanded={open} onClick={() => setOpen((value) => !value)}><CurrentIcon size={18} /></button>{open && <div className="theme-menu" role="group" aria-label="Choose appearance">{choices.map(({ value, label, icon: Icon }) => <button key={value} className={theme === value ? 'theme-choice theme-choice-active' : 'theme-choice'} aria-pressed={theme === value} onClick={() => { setTheme(value); setOpen(false); }}><Icon size={16} /><span>{label}</span>{theme === value && <Check size={15} />}</button>)}</div>}</div>;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth(); const location = useLocation();
  if (loading) return <div className="loading"><span className="spinner" />Loading your workspace</div>;
  return user ? children : <Navigate to="/login" state={{ from: location }} replace />;
}

function AuthPage({ register = false }) {
  const { user, signIn } = useAuth(); const navigate = useNavigate();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [role, setRole] = useState('student'); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;
  async function submit(event) { event.preventDefault(); setError(''); setBusy(true); try { await signIn(email, password, register, name, role); navigate('/'); } catch (problem) { setError(problem.message); } finally { setBusy(false); } }
  return <main className="auth-layout"><section className="auth-story"><Link to="/login" className="brand brand-light"><span className="brand-mark"><Command size={20} /></span>interview<span className="brand-accent">.studio</span></Link><div className="story-content"><div className="eyebrow"><span className="pulse-dot" /> YOUR NEXT CHAPTER STARTS HERE</div><h1>Make every<br />conversation<br /><em>count.</em></h1><p>A focused space to sharpen your skills, meet great people, and show up with confidence.</p><div className="story-foot"><span><Check size={15} /> Built for curious minds</span><span><Check size={15} /> Made to grow with you</span></div></div><div className="story-orbit orbit-one" /><div className="story-orbit orbit-two" /><div className="story-footer">A better way to get interview-ready.</div></section><section className="auth-panel"><div className="auth-top"><span>Already have an account?</span><Link to={register ? '/login' : '/register'} className="text-link">{register ? 'Log in' : 'Create account'} <ArrowRight size={14} /></Link></div><div className="auth-card"><span className="auth-kicker">{register ? 'GET STARTED' : 'WELCOME BACK'}</span><h2>{register ? 'Create your account' : 'Sign in to your space'}</h2><p className="auth-sub">{register ? 'A few details and you’re ready to begin.' : 'Your practice space is right where you left it.'}</p><form onSubmit={submit} className="auth-form">{register && <label>Your name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aisha Patel" autoComplete="name" required minLength={2} maxLength={60} /></label>}<label>Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" autoComplete="email" required /></label><label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={register ? 'At least 8 characters' : 'Enter your password'} autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 8 : 1} /></label>{register && <label>I’m joining as<select value={role} onChange={(e) => setRole(e.target.value)}><option value="student">Student</option><option value="interviewer">Interviewer</option></select></label>}{error && <div className="form-error" role="alert">{error}</div>}<button className="button button-dark button-full" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'} <ArrowRight size={16} /></button></form><div className="secure-note"><ShieldCheck size={15} /> Your information stays private and secure</div></div><div className="auth-bottom">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</div></section></main>;
}

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, to: '/' },
  { label: 'AI practice', icon: Code2, to: '/interview' },
  { label: 'History', icon: History, to: '/history' },
  { label: 'Coding practice', icon: Braces, to: '/code' },
  { label: 'Submissions', icon: FileText, to: '/code/submissions' },
  { label: 'Learning materials', icon: BookOpen, to: '/learning' },
  { label: 'Human interviews', icon: Video, to: '/meetings' },
  { label: 'Analytics & tips', icon: Activity, to: '/analytics' },
];
const quickLinks = [
  { label: 'Solve a coding challenge', detail: 'Practice problem solving hands-on', icon: Compass, color: 'lavender', to: '/code' },
  { label: 'Practice a skill', detail: 'A little progress goes a long way', icon: Braces, color: 'mint', to: '/interview' },
  { label: 'Review your practice', detail: 'Revisit answers and feedback', icon: FileText, color: 'peach', to: '/history' },
];

function Dashboard() {
  const { user, signOut } = useAuth(); const navigate = useNavigate(); const [summary, setSummary] = useState(null); const [error, setError] = useState(''); const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => { api('/dashboard').then((data) => setSummary(data)).catch((problem) => setError(problem.message)); }, []);
  const role = titleCase(user.role); const greetingName = user.name.trim().split(/\s+/)[0];
  const logout = () => { signOut(); navigate('/login'); };
  return <div className="app-shell"><aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}><div className="sidebar-brand"><Link to="/" className="brand"><span className="brand-mark"><Command size={19} /></span>interview<span className="brand-accent">.studio</span></Link><button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button></div><div className="workspace-switch"><div className="workspace-icon"><BookOpen size={16} /></div><div className="workspace-copy"><strong>My workspace</strong><span>{role} account</span></div><ChevronDown size={15} className="workspace-chevron" /></div><div className="nav-label">WORKSPACE</div><nav className="main-nav">{navItems.filter((item) => user.role !== 'admin' || item.to !== '/meetings').map(({ label, icon: Icon, to }, index) => <Link key={label} to={to} className={`nav-item ${index === 0 ? 'nav-active' : ''}`}><Icon size={18} /><span>{label}</span>{index === 0 && <span className="active-indicator" />}</Link>)}{user.role === 'admin' && <Link className="nav-item" to="/admin/users"><Users size={18} /><span>People</span></Link>}</nav><div className="nav-label nav-label-bottom">YOUR SPACE</div><nav className="main-nav"><button className="nav-item" onClick={logout}><LogOut size={18} /><span>Log out</span></button></nav><div className="sidebar-spacer" /><div className="sidebar-tip"><span className="tip-icon"><Sparkles size={16} /></span><strong>Small steps add up.</strong><p>Your next great opportunity begins with showing up.</p><span className="tip-stars">✳ &nbsp; KEEP GOING</span></div><div className="profile-row"><span className="avatar">{initials(user.name)}</span><span className="profile-copy"><strong>{user.name}</strong><span>{role}</span></span></div></aside><div className="mobile-scrim" onClick={() => setMobileOpen(false)} /><main className="main-area"><header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>Overview</strong></div><div className="topbar-actions"><div className="topbar-date"><CalendarDays size={15} /> {new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</div><ThemeControl /><NotificationMenu /><span className="topbar-divider" /><span className="avatar avatar-small">{initials(user.name)}</span></div></header><div className="content"><section className="welcome-row"><div><div className="eyebrow welcome-eyebrow"><span className="pulse-dot" /> YOUR INTERVIEW STUDIO</div><h1>Good to have you here, {greetingName}<span className="wave">✳</span></h1><p>This is your space. Take a breath, find your focus, and take it one step at a time.</p></div><button className="button button-outline" disabled title="Coming in a future phase"><Clock3 size={15} /> Your activity <ArrowUpRight size={14} /></button></section>{error && <div className="form-error dashboard-error" role="alert">Couldn’t load your workspace: {error}</div>}<section className="banner"><div className="banner-orb banner-orb-a" /><div className="banner-orb banner-orb-b" /><div className="banner-content"><span className="banner-kicker"><Sparkles size={14} /> YOUR NEXT PRACTICE</span><h2>A focused practice<br />starts with one step.</h2><p>Pick a subject, answer thoughtfully, and get feedback.</p><Link className="button banner-button" to="/interview">Explore your practice <ArrowRight size={15} /></Link></div><div className="banner-art" aria-hidden="true"><div className="art-ring ring-back" /><div className="art-ring ring-front" /><div className="art-center"><Command size={34} /></div><span className="art-spark spark-a">✳</span><span className="art-spark spark-b">✦</span><span className="art-spark spark-c">✧</span></div><span className="banner-index">01 <i /> 03</span></section><div className="section-heading"><div><span className="section-kicker">YOUR STARTING POINT</span><h2>A little direction goes a long way</h2></div><button className="icon-button more-button" aria-label="More options"><MoreHorizontal size={19} /></button></div><section className="quick-grid">{quickLinks.map(({ label, detail, icon: Icon, color, to, disabled }, index) => <article className="quick-card" key={label}><div className="quick-card-top"><span className={`quick-icon ${color}`}><Icon size={19} /></span><span className="card-index">0{index + 1}</span></div><h3>{label}</h3><p>{detail}</p>{disabled ? <button className="card-link" disabled>Coming soon <ArrowRight size={14} /></button> : <Link className="card-link" to={to}>Open <ArrowRight size={14} /></Link>}</article>)}</section><section className="bottom-grid"><article className="panel snapshot-panel"><div className="panel-heading"><div><span className="section-kicker">YOUR JOURNEY</span><h2>{summary?.summary?.sessionsCompleted ? 'Keep your momentum' : 'Just getting started'}</h2></div><span className="snapshot-icon"><Activity size={17} /></span></div><p className="snapshot-text">{summary?.summary?.sessionsCompleted ? 'Every practice session builds confidence. Review your feedback and come back for another round.' : 'Your practice sessions and feedback will find a home here. You’ve taken the first step.'}</p><div className="snapshot-footer"><div className="snapshot-metric"><strong>{summary?.summary?.sessionsCompleted ?? 0}</strong><span>sessions</span></div><div className="snapshot-divider" /><div className="snapshot-metric"><strong>{summary?.summary?.upcomingInterviews ?? 0}</strong><span>upcoming</span></div><div className="snapshot-spacer" /><Link to="/history" className="snapshot-trend">View history <ArrowRight size={13} /></Link></div></article><article className="panel role-panel"><span className="section-kicker">YOUR PROFILE</span><div className="role-card"><div className="role-avatar">{initials(user.name)}</div><div className="role-copy"><strong>{user.name}</strong><span>{user.email}</span></div><span className="role-tag"><span />{role}</span></div><div className="role-note"><ShieldCheck size={15} /><span>{user.role === 'admin' ? 'Administrator access is enabled.' : user.role === 'interviewer' ? 'Your interviewer profile is ready.' : 'Your student profile is ready.'}</span></div></article></section><footer className="page-footer"><span>MADE FOR THE NEXT BIG THING</span><span>INTERVIEW STUDIO <i>·</i> 2026</span></footer></div></main></div>;
}

export default App;
