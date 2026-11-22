import { Notification } from '../models/Notification.js';

export async function createNotification({ recipient, actor, type, title, message, href }) {
  return Notification.create({ recipient, actor, type, title, message, href });
}
