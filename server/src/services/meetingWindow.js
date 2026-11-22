export function isWithinMeetingWindow(meeting, now = Date.now()) {
  const startsAt = new Date(meeting.scheduledAt).getTime();
  const endsAt = startsAt + Number(meeting.durationMinutes) * 60_000;
  return Number.isFinite(startsAt) && Number.isFinite(endsAt)
    && now >= startsAt - 15 * 60_000 && now < endsAt;
}
