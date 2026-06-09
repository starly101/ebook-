import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    console.log('MongoDB already connected');
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.NODE_ENV === 'test' ? 'studyvault_test' : 'studyvault'
    });

    isConnected = true;
    console.log(`MongoDB connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });

  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}
