import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

const PORT = env.PORT || 5000;

async function startServer() {
  try {
    // Connect to database
    await connectDB();

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`   Environment: ${env.NODE_ENV}`);
      console.log(`   Student Origin: ${env.STUDENT_ORIGIN}`);
      console.log(`   Admin Origin: ${env.ADMIN_ORIGIN}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
