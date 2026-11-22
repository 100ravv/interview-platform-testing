import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './config/env.js';
import { User } from './models/User.js';
import { Meeting } from './models/Meeting.js';
import { isWithinMeetingWindow } from './services/meetingWindow.js';

let ioServer = null;
export function attachRealtime(server) {
  const io = new Server(server, { maxHttpBufferSize: 64 * 1024, cors: { origin: env.CLIENT_ORIGIN, methods: ['GET', 'POST'] } });
  ioServer = io;
  io.use(async (socket, next) => {
    try {
      const payload = jwt.verify(socket.handshake.auth?.token || '', env.JWT_SECRET);
      const user = await User.findById(payload.sub);
      if (!user) return next(new Error('Sign in to join the interview room.'));
      socket.data.user = { id: String(user._id), name: user.name };
      return next();
    } catch { return next(new Error('Your session has expired. Sign in again.')); }
  });

  io.on('connection', (socket) => {
    let windowStartedAt = Date.now();
    let eventCount = 0;
    let chatCount = 0;
    const allowEvent = (isChat = false) => {
      const now = Date.now();
      if (now - windowStartedAt >= 10_000) { windowStartedAt = now; eventCount = 0; chatCount = 0; }
      eventCount += 1;
      if (isChat) chatCount += 1;
      return eventCount <= 100 && (!isChat || chatCount <= 8);
    };
    socket.on('room:join', async (meetingId, acknowledge = () => {}) => {
      const reply = typeof acknowledge === 'function' ? acknowledge : () => {};
      if (!allowEvent()) { reply({ error: 'Too many real-time events. Please slow down.' }); return; }
      try {
        const meeting = await Meeting.findById(meetingId).select('student interviewer status scheduledAt durationMinutes startedAt');
        const userId = socket.data.user.id;
        if (!meeting || meeting.status !== 'accepted' || !meeting.startedAt || ![String(meeting.student), String(meeting.interviewer)].includes(userId)) {
          reply({ error: 'You do not have access to this accepted interview room.' }); return;
        }
        if (!isWithinMeetingWindow(meeting)) { reply({ error: 'This interview room is outside its scheduled time.' }); return; }
        const room = `meeting:${meetingId}`;
        if (socket.data.meetingRoom && socket.data.meetingRoom !== room) {
          socket.to(socket.data.meetingRoom).emit('room:peer-left');
          await socket.leave(socket.data.meetingRoom);
        }
        await socket.join(room);
        socket.data.meetingRoom = room;
        reply({ userId, name: socket.data.user.name });
        socket.to(room).emit('room:peer-joined', { userId, name: socket.data.user.name });
      } catch { reply({ error: 'Could not join the interview room.' }); }
    });

    for (const event of ['rtc:offer', 'rtc:answer', 'rtc:ice', 'chat:message', 'media:state']) {
      socket.on(event, (payload) => {
        const room = socket.data.meetingRoom;
        if (!room || !allowEvent(event === 'chat:message')) return;
        if (event === 'chat:message') {
          const message = typeof payload?.message === 'string' ? payload.message.trim().slice(0, 1000) : '';
          if (message) socket.to(room).emit(event, { message, name: socket.data.user.name, sentAt: new Date().toISOString() });
        } else if (event === 'media:state') {
          socket.to(room).emit(event, { audio: Boolean(payload?.audio), video: Boolean(payload?.video), name: socket.data.user.name });
        } else {
          socket.to(room).emit(event, payload);
        }
      });
    }
    socket.on('room:leave', () => {
      if (socket.data.meetingRoom) { socket.to(socket.data.meetingRoom).emit('room:peer-left'); socket.leave(socket.data.meetingRoom); socket.data.meetingRoom = null; }
    });
    socket.on('disconnect', () => { if (socket.data.meetingRoom) socket.to(socket.data.meetingRoom).emit('room:peer-left'); });
  });
  return io;
}

export function endMeetingRoom(meetingId, message = 'This interview room has ended.') {
  ioServer?.to(`meeting:${meetingId}`).emit('room:ended', { message });
}
