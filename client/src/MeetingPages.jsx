import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ArrowLeft, ArrowRight, Camera, Check, Clock3, LoaderCircle, Mic, MicOff, MonitorUp, PhoneOff, Send, Video, X } from 'lucide-react';
import { api } from './lib/api.js';
import './meeting.css';

const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
const dateTime = (value) => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
const minimumLocalDateTime = () => { const date = new Date(Date.now() + 60_000); date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); return date.toISOString().slice(0, 16); };
const proctorLabels = { tab_hidden: 'Switched away from the interview tab', gaze_away: 'Eye-direction check indicated a sustained look away', face_missing: 'Face was not visible to the camera', multiple_faces: 'More than one face was visible', camera_disabled: 'Camera stopped during the interview' };

function MeetingFrame({ children }) {
  return <main className="meeting-page"><header className="meeting-header"><Link className="code-brand" to="/"><span><Video size={17} /></span>interview<span>.studio</span></Link><Link to="/" className="contest-overview">Workspace <ArrowRight size={14} /></Link></header><div className="meeting-main">{children}</div></main>;
}

export function MeetingListPage({ user }) {
  const [meetings, setMeetings] = useState([]); const [participantEmail, setParticipantEmail] = useState(''); const [title, setTitle] = useState('Technical interview practice'); const [scheduledAt, setScheduledAt] = useState(''); const [durationMinutes, setDurationMinutes] = useState(30); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const load = async () => { try { const data = await api('/meetings'); setMeetings(data.meetings); } catch (problem) { setError(problem.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  async function schedule(event) { event.preventDefault(); setBusy(true); setError(''); setNotice(''); try { const date = new Date(scheduledAt); await api('/meetings', { method: 'POST', body: JSON.stringify({ participantEmail, title, scheduledAt: date.toISOString(), durationMinutes }) }); setNotice('Interview request sent. The other participant needs to accept before the room opens.'); setParticipantEmail(''); await load(); } catch (problem) { setError(problem.message); } finally { setBusy(false); } }
  async function update(meetingId, action, body) { setBusy(true); setError(''); try { await api(`/meetings/${meetingId}/${action}`, { method: 'PATCH', body: JSON.stringify(body || {}) }); await load(); } catch (problem) { setError(problem.message); } finally { setBusy(false); } }
  const received = meetings.filter((item) => item.status === 'pending' && item.requestedBy !== user.id);
  return <MeetingFrame><Link to="/" className="code-back"><ArrowLeft size={14} /> Back to overview</Link><section className="meeting-intro"><span className="code-eyebrow"><Video size={14} /> HUMAN PRACTICE</span><h1>Meet. Practice. Improve.</h1><p>Schedule a mock interview with a fellow student or interviewer. Accepted sessions open a private video room with chat and screen sharing.</p></section>{error && <div className="form-error">{error}</div>}{notice && <div className="meeting-notice"><Check size={15} />{notice}</div>}<div className="meeting-grid"><section className="meeting-panel"><span className="section-kicker">MAKE A REQUEST</span><h2>Schedule a session</h2><p className="meeting-help">{user.role === 'student' ? 'Enter an interviewer’s account email.' : 'Enter a student’s account email.'}</p><form className="meeting-form" onSubmit={schedule}><label>Participant email<input type="email" required value={participantEmail} onChange={(event) => setParticipantEmail(event.target.value)} placeholder="person@university.edu" /></label><label>Session focus<input required minLength={3} maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} /></label><div className="meeting-form-row"><label>Date and time<input type="datetime-local" required min={minimumLocalDateTime()} value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /></label><label>Length<select value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))}><option value={30}>30 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option></select></label></div><button className="submit-button" disabled={busy}>{busy ? 'Sending…' : 'Send interview request'} <ArrowRight size={14} /></button></form></section><section className="meeting-panel meeting-list-panel"><div className="meeting-list-heading"><div><span className="section-kicker">YOUR SESSIONS</span><h2>Interview schedule</h2></div><button onClick={load} className="refresh-button">Refresh</button></div>{received.length > 0 && <div className="received-note">You have {received.length} request{received.length > 1 ? 's' : ''} waiting for your response.</div>}{loading ? <div className="meeting-empty"><LoaderCircle className="spin" size={18} /> Loading sessions…</div> : meetings.length ? <div className="meeting-list">{meetings.map((meeting) => { const own = meeting.requestedBy === user.id; const other = user.id === meeting.student.id ? meeting.interviewer : meeting.student; return <article className="meeting-row" key={meeting.id}><div className="meeting-row-top"><span className={`meeting-state state-${meeting.status}`}>{meeting.status}</span><span>{meeting.durationMinutes} min</span></div><h3>{meeting.title}</h3><p>With {other?.name} · {other?.role}</p><div className="meeting-row-time"><Clock3 size={14} /> {dateTime(meeting.scheduledAt)}</div><div className="meeting-row-actions">{meeting.status === 'pending' && !own && <><button className="submit-button" disabled={busy} onClick={() => update(meeting.id, 'respond', { status: 'accepted' })}>Accept <Check size={13} /></button><button className="quiet-button" disabled={busy} onClick={() => update(meeting.id, 'respond', { status: 'declined' })}>Decline <X size={13} /></button></>}{meeting.status === 'accepted' && <Link className="submit-button" to={`/meetings/${meeting.id}/room`}>Open interview room <ArrowRight size={13} /></Link>}{['pending', 'accepted'].includes(meeting.status) && <button className="quiet-button cancel-action" disabled={busy} onClick={() => update(meeting.id, 'cancel')}>Cancel</button>}{meeting.status === 'completed' && meeting.evaluation && <span className="meeting-rating">Interviewer rating: {meeting.evaluation.rating}/5</span>}{meeting.status === 'pending' && own && <span className="meeting-awaiting">Waiting for response</span>}</div></article>; })}</div> : <div className="meeting-empty">Your scheduled interviews will appear here.</div>}</section></div></MeetingFrame>;
}

export function MeetingResultPage({ user }) {
  const { meetingId } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api(`/meetings/${meetingId}`).then((data) => setMeeting(data.meeting)).catch((problem) => setError(problem.message)); }, [meetingId]);
  const isInterviewer = meeting && user.id === meeting.interviewer.id;
  return <MeetingFrame><Link to="/history" className="code-back"><ArrowLeft size={14} /> Back to history</Link>{error ? <div className="form-error">{error}</div> : !meeting ? <div className="meeting-empty"><LoaderCircle className="spin" size={18} /> Loading interview result…</div> : meeting.status !== 'completed' || !meeting.evaluation ? <div className="meeting-panel room-locked">This interview does not have a saved evaluation yet.</div> : <section className="meeting-panel result-card"><span className="code-eyebrow">HUMAN INTERVIEW RESULT</span><h1>{meeting.title}</h1><p className="meeting-help">{dateTime(meeting.endedAt || meeting.scheduledAt)} · {isInterviewer ? 'Rating you submitted' : 'Rating received'}</p><div className="result-rating">{meeting.evaluation.rating}<span>/5</span></div><h2>Interviewer feedback</h2><p className="result-feedback">{meeting.evaluation.feedback?.trim() || 'No written feedback was added.'}</p><p className="meeting-help">{isInterviewer ? `Student: ${meeting.student.name}` : `Interviewer: ${meeting.interviewer.name}`}</p></section>}</MeetingFrame>;
}

export function MeetingRoomPage({ user }) {
  const { meetingId } = useParams(); const navigate = useNavigate(); const [meeting, setMeeting] = useState(null); const [error, setError] = useState(''); const [joined, setJoined] = useState(false); const [joining, setJoining] = useState(false); const [audioOn, setAudioOn] = useState(true); const [remoteReady, setRemoteReady] = useState(false); const [messages, setMessages] = useState([]); const [message, setMessage] = useState(''); const [rating, setRating] = useState(5); const [feedback, setFeedback] = useState(''); const [localStream, setLocalStream] = useState(null); const [proctorEvents, setProctorEvents] = useState([]); const [proctorStatus, setProctorStatus] = useState('Starting local camera checks…');
  const socketRef = useRef(null); const peerRef = useRef(null); const localRef = useRef(null); const remoteRef = useRef(null); const chatEndRef = useRef(null); const iceQueueRef = useRef([]); const cameraTrackRef = useRef(null); const pendingProctorRef = useRef([]);
  useEffect(() => { api(`/meetings/${meetingId}`).then((data) => { setMeeting(data.meeting); setProctorEvents(data.meeting.proctorEvents || []); }).catch((problem) => setError(problem.message)); }, [meetingId]);
  useEffect(() => { if (localRef.current && localStream) localRef.current.srcObject = localStream; }, [localStream]);
  useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  function makePeer(socket) {
    if (peerRef.current) return peerRef.current;
    const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    peerRef.current = peer;
    for (const track of localRef.current?.srcObject?.getTracks() || []) peer.addTrack(track, localRef.current.srcObject);
    peer.ontrack = (event) => { if (remoteRef.current) remoteRef.current.srcObject = event.streams[0]; setRemoteReady(true); };
    peer.onicecandidate = (event) => { if (event.candidate) socket.emit('rtc:ice', event.candidate); };
    peer.onconnectionstatechange = () => { if (['failed', 'disconnected', 'closed'].includes(peer.connectionState)) setRemoteReady(false); };
    return peer;
  }
  async function addPendingIce(peer) { for (const item of iceQueueRef.current.splice(0)) await peer.addIceCandidate(item).catch(() => {}); }
  async function joinRoom() {
    setJoining(true); setError('');
    let stream;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        const message = window.isSecureContext
          ? 'This browser does not provide camera and microphone access for this page.'
          : 'Camera and microphone need a secure connection. On Android, use an HTTPS address; localhost is secure only on the device running the app.';
        throw new Error(message);
      }
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setLocalStream(stream); setJoined(true);
      cameraTrackRef.current = stream.getVideoTracks()[0] || null;
      await api(`/meetings/${meetingId}/start`, { method: 'POST', body: JSON.stringify({}) });
      const socket = io(socketUrl, { autoConnect: false, auth: { token: sessionStorage.getItem('token') } });
      socketRef.current = socket;
      socket.on('connect', () => socket.emit('room:join', meetingId, (result) => { if (result?.error) setError(result.error); else { setJoined(true); for (const type of pendingProctorRef.current.splice(0)) socket.emit('proctor:alert', { type }); } }));
      socket.on('connect_error', (problem) => setError(problem.message));
      socket.on('room:peer-joined', async () => { try { const peer = makePeer(socket); const offer = await peer.createOffer(); await peer.setLocalDescription(offer); socket.emit('rtc:offer', peer.localDescription); } catch (problem) { setError(`Could not start video connection: ${problem.message}`); } });
      socket.on('rtc:offer', async (description) => { try { const peer = makePeer(socket); await peer.setRemoteDescription(description); await addPendingIce(peer); const answer = await peer.createAnswer(); await peer.setLocalDescription(answer); socket.emit('rtc:answer', peer.localDescription); } catch (problem) { setError(`Could not accept video connection: ${problem.message}`); } });
      socket.on('rtc:answer', async (description) => { try { const peer = makePeer(socket); await peer.setRemoteDescription(description); await addPendingIce(peer); } catch (problem) { setError(`Could not finish video connection: ${problem.message}`); } });
      socket.on('rtc:ice', async (candidate) => { const peer = peerRef.current; if (!peer || !peer.remoteDescription) iceQueueRef.current.push(candidate); else await peer.addIceCandidate(candidate).catch(() => {}); });
      socket.on('room:peer-left', () => { setRemoteReady(false); if (remoteRef.current) remoteRef.current.srcObject = null; peerRef.current?.close(); peerRef.current = null; });
      socket.on('room:ended', (event) => { setError(event?.message || 'This interview room has ended.'); peerRef.current?.close(); peerRef.current = null; localRef.current?.srcObject?.getTracks().forEach((track) => track.stop()); if (remoteRef.current) remoteRef.current.srcObject = null; socket.disconnect(); socketRef.current = null; setLocalStream(null); setJoined(false); setRemoteReady(false); navigate('/meetings'); });
      socket.on('chat:message', (item) => setMessages((items) => [...items.slice(-99), { ...item, own: false }]));
      socket.on('proctor:alert', (item) => setProctorEvents((items) => [...items.slice(-99), item]));
      socket.on('media:state', (state) => setMessages((items) => [...items.slice(-99), { own: false, system: true, message: `${state.name} ${state.audio ? 'enabled' : 'muted'} their microphone and turned ${state.video ? 'on' : 'off'} their camera.` }]));
      socket.connect();
    } catch (problem) {
      stream?.getTracks().forEach((track) => track.stop()); setLocalStream(null); setJoined(false);
      setError(problem.name === 'NotAllowedError' ? 'Allow camera and microphone access in your browser, then try again.' : problem.message || 'Could not start your camera and microphone.');
    } finally { setJoining(false); }
  }
  function leaveRoom() {
    if (cameraTrackRef.current) cameraTrackRef.current.onended = null;
    socketRef.current?.emit('room:leave'); socketRef.current?.disconnect(); socketRef.current = null;
    peerRef.current?.close(); peerRef.current = null; localRef.current?.srcObject?.getTracks().forEach((track) => track.stop());
    if (remoteRef.current) remoteRef.current.srcObject = null;
    setLocalStream(null); setJoined(false); setRemoteReady(false); navigate(`/meetings/${meetingId}/room`);
  }
  useEffect(() => () => { socketRef.current?.disconnect(); peerRef.current?.close(); localRef.current?.srcObject?.getTracks().forEach((track) => track.stop()); }, []);
  useEffect(() => {
    if (!joined) return undefined;
    if (user.role !== 'student') { setProctorStatus('Monitoring candidate proctoring alerts'); return undefined; }
    const report = (type) => {
      const event = { type, participant: user.id, participantName: user.name, occurredAt: new Date().toISOString() };
      setProctorEvents((items) => [...items.slice(-99), event]);
      if (socketRef.current?.connected) socketRef.current.emit('proctor:alert', { type });
      else pendingProctorRef.current.push(type);
    };
    const cameraTrack = localRef.current?.srcObject?.getVideoTracks()[0];
    const onCameraEnded = () => { report('camera_disabled'); setProctorStatus('Camera stopped · interviewer was notified'); };
    if (cameraTrack) cameraTrack.onended = onCameraEnded;
    const onVisibilityChange = () => { if (document.visibilityState === 'hidden') report('tab_hidden'); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    let landmarker; let frameTimer; let stopped = false; let missingSince = 0; let gazeSince = 0; let lastFaceWarning = 0; let lastGazeWarning = 0;
    (async () => {
      try {
        const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
        const files = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm');
        if (stopped) return;
        try {
          landmarker = await FaceLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: '/models/face_landmarker.task', delegate: 'GPU' }, runningMode: 'VIDEO', numFaces: 2, outputFaceBlendshapes: true });
        } catch {
          landmarker = await FaceLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: '/models/face_landmarker.task', delegate: 'CPU' }, runningMode: 'VIDEO', numFaces: 2, outputFaceBlendshapes: true });
        }
        if (stopped) { landmarker.close(); return; }
        setProctorStatus('Camera checks active · video is analyzed on this device');
        const inspectFrame = () => {
          if (stopped) return;
          const video = localRef.current;
          if (!landmarker || !video || video.readyState < 2) { frameTimer = window.setTimeout(inspectFrame, 500); return; }
          try {
            const now = performance.now(); const result = landmarker.detectForVideo(video, now); const faces = result.faceLandmarks || [];
            if (!faces.length) {
              if (!missingSince) missingSince = now;
              if (now - missingSince > 3000 && now - lastFaceWarning > 15000) { report('face_missing'); lastFaceWarning = now; }
              gazeSince = 0;
            } else {
              missingSince = 0;
              if (faces.length > 1 && now - lastFaceWarning > 15000) { report('multiple_faces'); lastFaceWarning = now; }
              const face = faces[0];
              const eyeRatio = (iris, a, b) => {
                const min = Math.min(face[a].x, face[b].x); const width = Math.abs(face[a].x - face[b].x);
                return width ? (face[iris].x - min) / width : 0.5;
              };
              const left = eyeRatio(468, 33, 133); const right = eyeRatio(473, 362, 263);
              const gazeCategories = result.faceBlendshapes?.[0]?.categories || [];
              const gazeScore = gazeCategories.reduce((highest, category) => /^eyeLook/.test(category.categoryName) ? Math.max(highest, category.score) : highest, 0);
              const irisLookingSideways = (left < 0.3 && right < 0.3) || (left > 0.7 && right > 0.7);
              const lookingAway = gazeScore >= 0.5 || irisLookingSideways;
              if (lookingAway) {
                if (!gazeSince) gazeSince = now;
                if (now - gazeSince > 1800 && now - lastGazeWarning > 15000) { report('gaze_away'); lastGazeWarning = now; gazeSince = now; }
              } else gazeSince = 0;
            }
          } catch { /* Keep the call running if one camera frame cannot be analyzed. */ }
          frameTimer = window.setTimeout(inspectFrame, 500);
        };
        inspectFrame();
      } catch {
        setProctorStatus('Tab alerts active · eye checks unavailable');
      }
    })();
    return () => { stopped = true; document.removeEventListener('visibilitychange', onVisibilityChange); if (cameraTrack?.onended === onCameraEnded) cameraTrack.onended = null; window.clearTimeout(frameTimer); landmarker?.close(); };
  }, [joined, user.id, user.name, user.role]);
  function toggleAudio() { const next = !audioOn; localRef.current?.srcObject?.getAudioTracks().forEach((track) => { track.enabled = next; }); setAudioOn(next); socketRef.current?.emit('media:state', { audio: next, video: true }); }
  async function shareScreen() { if (!peerRef.current) return; try { const display = await navigator.mediaDevices.getDisplayMedia({ video: true }); const track = display.getVideoTracks()[0]; const sender = peerRef.current.getSenders().find((item) => item.track?.kind === 'video'); if (sender) await sender.replaceTrack(track); track.onended = async () => { if (sender && cameraTrackRef.current) await sender.replaceTrack(cameraTrackRef.current); }; } catch (problem) { if (problem.name !== 'NotAllowedError') setError(problem.message); } }
  function sendMessage(event) { event.preventDefault(); const value = message.trim(); if (!value || !socketRef.current) return; const sentAt = new Date().toISOString(); socketRef.current.emit('chat:message', { message: value }); setMessages((items) => [...items.slice(-99), { message: value, sentAt, name: user.name, own: true }]); setMessage(''); }
  async function finishInterview(event) { event.preventDefault(); try { const data = await api(`/meetings/${meetingId}/evaluation`, { method: 'POST', body: JSON.stringify({ rating, feedback }) }); setMeeting(data.meeting); leaveRoom(); } catch (problem) { setError(problem.message); } }
  if (!meeting) return <MeetingFrame><div className="meeting-empty">{error || 'Loading interview room…'}</div></MeetingFrame>;
  const other = user.id === meeting.student.id ? meeting.interviewer : meeting.student;
  return <MeetingFrame><Link to="/meetings" className="code-back"><ArrowLeft size={14} /> Interview schedule</Link><div className="room-heading"><div><span className="code-eyebrow">PRIVATE MOCK INTERVIEW</span><h1>{meeting.title}</h1><p>With {other.name} · {dateTime(meeting.scheduledAt)}</p></div><span className={`meeting-state state-${meeting.status}`}>{meeting.status}</span></div>{error && <div className="form-error">{error}</div>}{meeting.status !== 'accepted' ? <div className="meeting-panel room-locked">This room is available after the interview request is accepted.</div> : !joined ? <div className="meeting-panel room-join-card"><span className="room-camera-icon"><Video size={25} /></span><h2>Ready to join?</h2><p>Camera and microphone access are required. The camera feed is shared with the other participant, but the app does not record or save video. Tab changes and sustained looking away are logged as alerts. Browsers cannot fully block tab switching.</p><button className="submit-button" onClick={joinRoom} disabled={joining}>{joining ? 'Connecting…' : 'Enable camera and join'} <ArrowRight size={14} /></button></div> : <div className="room-layout"><section className="room-video-panel"><div className="video-grid"><div className="video-tile remote-video-tile">{remoteReady ? <video ref={remoteRef} autoPlay playsInline /> : <div className="video-placeholder"><Video size={24} /><strong>Waiting for {other.name}</strong><span>They can join from the interview schedule.</span></div>}<span className="video-name">{other.name}</span></div><div className="video-tile local-video-tile"><video ref={localRef} autoPlay playsInline muted /><span className="video-name">You</span></div></div><div className="proctor-status"><span className="proctor-dot" />{proctorStatus}<span>{proctorEvents.length} alert{proctorEvents.length === 1 ? '' : 's'}</span></div>{user.role === 'interviewer' && <section className="proctor-feed"><strong>Proctoring alerts</strong>{proctorEvents.length ? <ul>{proctorEvents.slice(-8).reverse().map((item, index) => <li key={`${item.occurredAt}-${index}`}><span>{item.participantName}: {proctorLabels[item.type] || 'Proctoring alert'}</span><time>{new Date(item.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></li>)}</ul> : <p>No alerts recorded.</p>}<small>Automated alerts can be inaccurate and should be reviewed in context.</small></section>}<div className="room-controls"><button className={!audioOn ? 'control-off' : ''} onClick={toggleAudio} aria-label={audioOn ? 'Mute microphone' : 'Unmute microphone'}>{audioOn ? <Mic size={17} /> : <MicOff size={17} />}</button><button className="camera-required" disabled title="Camera stays on during proctored interviews" aria-label="Camera required and on"><Camera size={17} /></button><button onClick={shareScreen} aria-label="Share screen"><MonitorUp size={17} /></button><button className="leave-button" onClick={leaveRoom} aria-label="Leave room"><PhoneOff size={17} /></button></div>{user.role === 'interviewer' && <form className="evaluation-form" onSubmit={finishInterview}><span className="section-kicker">WRAP UP</span><h2>Interview evaluation</h2><label>Rating<select value={rating} onChange={(event) => setRating(Number(event.target.value))}><option value={5}>5 — Excellent</option><option value={4}>4 — Strong</option><option value={3}>3 — Developing</option><option value={2}>2 — Needs practice</option><option value={1}>1 — Needs significant practice</option></select></label><label>Feedback<textarea rows={3} maxLength={1500} value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Share a few helpful, specific observations." /></label><button className="submit-button">Finish and save evaluation <Check size={14} /></button></form>}</section><aside className="chat-panel"><div className="chat-heading"><div><strong>Session chat</strong><span>Only participants can see messages</span></div><Clock3 size={16} /></div><div className="chat-messages">{messages.length ? messages.map((item, index) => <div key={`${item.sentAt || index}-${index}`} className={`chat-message ${item.own ? 'chat-own' : ''} ${item.system ? 'chat-system' : ''}`}>{!item.system && <strong>{item.name}</strong>}<p>{item.message}</p>{item.sentAt && <small>{new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>}</div>) : <div className="chat-empty">Say hello, share a prompt, or leave a helpful note.</div>}<div ref={chatEndRef} /></div><form className="chat-form" onSubmit={sendMessage}><input maxLength={1000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a message…" aria-label="Chat message" /><button disabled={!message.trim()} aria-label="Send message"><Send size={16} /></button></form></aside></div>}</MeetingFrame>;
}
