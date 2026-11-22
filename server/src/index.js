import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { createServer } from 'node:http';
import { attachRealtime } from './realtime.js';

try {
  await connectDatabase();
  const server = createServer(app);
  attachRealtime(server);
  server.listen(env.PORT, env.HOST, () => console.info(`API ready on http://${env.HOST}:${env.PORT}`));
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => server.close(async () => {
      const mongoose = await import('mongoose');
      await mongoose.default.disconnect();
      process.exit(0);
    }));
  }
} catch (error) {
  console.error('Could not start the API. Check MONGODB_URI and database connectivity.');
  console.error(error.message);
  process.exit(1);
}
