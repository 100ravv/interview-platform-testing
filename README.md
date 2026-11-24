# Interview Studio — AI Practice, Coding, Contests, and Mock Interviews

A college-project-sized MERN application: React + Vite client, Express API, MongoDB/Mongoose, JWT authentication, Student/Interviewer/Admin roles, adaptive AI interview practice, coding challenges with optional Judge0 execution, curated external learning materials, private WebRTC mock interviews with Socket.IO signaling/chat, and personal learning analytics with rule-based recommendations.

## Requirements

- Node.js 20.19+ (or 22.12+) and npm
- MongoDB running locally or a MongoDB Atlas connection string

## Start locally

1. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI` and a long random `JWT_SECRET`. Optionally set `GROQ_API_KEY` to enable AI answer feedback; keep it in the server environment only. Without it, practice uses a basic keyword-based evaluator.
2. From the repository root run `npm install`.
3. Run `npm run seed:questions`, `npm run seed:problems`, and `npm run seed:learning` once to add the curated materials to MongoDB.
4. Run `npm run seed:contests` to add a sample weekly contest. It requires the seeded coding problems and schedules the next weekly round.
5. Coding practice offers C++, Java, and Python 3. To execute coding and contest submissions, configure a reachable `JUDGE0_API_URL` in `server/.env` for your Judge0 CE deployment or provider. Add the required server-side key/header settings if your provider requires them. Language selection and editing remain available without Judge0; run and submit are disabled until it is configured.
6. Run `npm run dev`; the Express API and Socket.IO service listen on `http://localhost:5000`, and Vite listens on `http://localhost:5173`.
7. Register as a Student or Interviewer. Admin accounts are created only through the seed command below. For a human mock interview, one participant requests the other by the email on their account; the invitee must accept before either can join the room.

To create the first admin, set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `server/.env`, then run `npm run seed:admin`. The seed command will not overwrite an existing account.

## Environment variables (`server/.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No (5000) | API port |
| `HOST` | No (`127.0.0.1`) | Network interface for the API; use `0.0.0.0` only when intentionally exposing it on a network |
| `MONGODB_URI` | Yes | MongoDB connection URI |
| `JWT_SECRET` | Yes | Secret used to sign session tokens (use a random value, at least 32 characters) |
| `JWT_EXPIRES_IN` | No (`7d`) | Token lifetime |
| `CLIENT_ORIGIN` | No (`http://localhost:5173`) | Allowed browser origin |
| `GROQ_API_KEY` | No | Server-only Groq key for AI answer evaluation; omit to use basic offline keyword feedback |
| `GROQ_MODEL` | No (`openai/gpt-oss-20b`) | Groq model used for structured interview feedback |
| `JUDGE0_API_URL` | No | Judge0 CE/provider base URL for code execution |
| `JUDGE0_API_KEY` | No | Judge0 auth key, if your instance requires one |
| `JUDGE0_API_KEY_HEADER` | No (`X-Auth-Token`) | Header used for `JUDGE0_API_KEY`; use `X-RapidAPI-Key` for RapidAPI |
| `JUDGE0_RAPIDAPI_HOST` | No | Set `X-RapidAPI-Host` when using a RapidAPI-hosted Judge0 provider |
| `ADMIN_NAME` | For admin seed | Initial administrator's display name |
| `ADMIN_EMAIL` | For admin seed | Initial administrator's email |
| `ADMIN_PASSWORD` | For admin seed | Initial administrator's password (12+ characters) |

The client uses `VITE_API_URL` optionally; its default is `/api`, proxied to the local API by Vite. `VITE_SOCKET_URL` can point to a separate Socket.IO server; its default is the current site origin. Do not put secrets in client environment variables.

## API overview

- `GET /api/health` — service health
- `POST /api/auth/register` — create Student or Interviewer account
- `POST /api/auth/login` — issue JWT and user profile
- `GET /api/auth/me` — current authenticated user
- `GET /api/dashboard` — role-aware dashboard summary (authentication required)
- `GET /api/admin/users` — user listing (Admin only)
- `POST /api/interviews` — start an interview practice session
- `GET /api/interviews` — list your practice history
- `GET /api/interviews/:sessionId` — read your session and feedback
- `POST /api/interviews/:sessionId/answer` — evaluate an answer and continue the session
- `GET /api/code/problems` — list coding problems
- `GET /api/code/problems/:slug` — read a problem and public examples
- `GET /api/code/languages` — get supported Judge0 languages
- `POST /api/code/problems/:slug/submissions` — run public examples or submit public and hidden tests
- `GET /api/code/submissions` — list your recent coding submissions
- `GET /api/code/submissions/:submissionId` — refresh/view your result and code
- `GET /api/contests` — list scheduled contests and registration status
- `POST /api/contests/:contestId/join` — register for an upcoming contest
- `GET /api/contests/:contestId` — view contest details and unlock problems during the live window
- `POST /api/contests/:contestId/problems/:problemSlug/submissions` — submit a contest solution
- `GET /api/contests/:contestId/submissions/:submissionId` — refresh/view your contest result
- `GET /api/contests/:contestId/leaderboard` — view contest standings
- `GET /api/meetings` — list the signed-in user's scheduled interviews
- `POST /api/meetings` — request an interview with a registered participant of the opposite role
- `PATCH /api/meetings/:meetingId/respond` — accept or decline an interview request
- `PATCH /api/meetings/:meetingId/cancel` — cancel a pending or accepted session
- `POST /api/meetings/:meetingId/start` — mark an accepted room as started
- `POST /api/meetings/:meetingId/evaluation` — interviewer saves a 1–5 rating and feedback
- `GET /api/analytics` — private progress summary, weak topics, and next-step suggestions
- `GET /api/learning/resources` — curated documentation, articles, courses, and video links
- `GET /api/notifications` — list the signed-in user's latest notifications
- `PATCH /api/notifications/:notificationId/read` — mark one notification as read
- `PATCH /api/notifications/read-all` — mark all notifications as read
- `GET /api/admin/users` — list up to 100 recent accounts (Admin only)

All auth-protected API routes require `Authorization: Bearer <token>`. The JWT is held in browser session storage and cleared at sign out. This foundation uses a simple bearer token flow suitable for the project demo; production deployments should also add HTTPS and a stronger session strategy.

Human video rooms use browser WebRTC with a public STUN server for peer discovery. Both participants need a modern browser and camera/microphone permission. Some restrictive networks require a TURN server; this project does not include one. Room chat and WebRTC signaling use authenticated Socket.IO connections, and chat messages are transient rather than stored in MongoDB. Proctored rooms monitor the student candidate for tab-hidden events and use MediaPipe face landmarks in the browser for rough sustained gaze-away, face-missing, and multiple-face alerts. Only the alert type, participant, and timestamp are stored; camera frames are not saved by the app. The interviewer sees the alerts in the room. Gaze alerts are approximate and should not be treated as proof, and browsers cannot prevent a participant from switching tabs. Camera and gaze checks require camera permission, a supported browser, and internet access to load the MediaPipe WebAssembly runtime from jsDelivr; the face-landmark model itself is included at `client/public/models/face_landmarker.task`.

Recommendations are deterministic rules based on the signed-in user's own practice results. They do not call the AI provider.

## Checks

`npm run build` builds the React client. `npm run dev` requires a reachable MongoDB instance and seeded question banks. AI feedback requires a valid Groq API key and available API quota; without one, the app uses basic offline feedback. Code execution requires a reachable configured Judge0 service; code is sent to that service for sandboxed execution.

`npm test --workspace server` runs the API validation and scoring tests. Live MongoDB, OpenAI, Judge0, camera, and peer-to-peer connectivity checks require their respective local services or browser permissions.

## Interview history storage

AI interview sessions default to 10 questions (or can be set to 5) and have a server-enforced 20-minute limit. At timeout, a non-empty current answer is submitted for evaluation, while unanswered questions are recorded as zero and included in the session average. If the browser closes, the timeout is finalized the next time the session or history is opened.

Completed AI practice sessions keep topic, difficulty, score, and a short strengths/focus summary. Question prompts and submitted answers are removed from completed sessions, while in-progress sessions retain the data needed to continue. To compact completed sessions already in MongoDB, run `npm run compact:history` from the project root with the server environment configured. This permanently removes the stored prompts and answers from those completed records; back up the database first if you need to retain them. Human interview ratings are shown separately in History and Analytics.
