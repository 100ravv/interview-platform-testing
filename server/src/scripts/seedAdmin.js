import { connectDatabase } from '../config/database.js';
import { User } from '../models/User.js';

const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in server/.env first.');
  process.exit(1);
}
if (ADMIN_PASSWORD.length < 12) {
  console.error('ADMIN_PASSWORD must be at least 12 characters.');
  process.exit(1);
}

try {
  await connectDatabase();
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    console.info(`An account already exists for ${email}; no changes were made.`);
  } else {
    const admin = await User.create({ name: ADMIN_NAME, email, password: ADMIN_PASSWORD, role: 'admin' });
    console.info(`Administrator created for ${admin.email}.`);
  }
} catch (error) {
  console.error(`Could not create administrator: ${error.message}`);
  process.exitCode = 1;
} finally {
  const mongoose = await import('mongoose');
  await mongoose.default.disconnect();
}
