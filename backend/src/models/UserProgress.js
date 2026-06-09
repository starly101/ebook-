import mongoose from 'mongoose';

const userProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  lastViewedAt: Date,
  timeSpent: {
    type: Number,
    default: 0
  },
  quizAttempts: [{
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz'
    },
    score: Number,
    passed: Boolean,
    attemptedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

userProgressSchema.index({ user: 1, topic: 1 }, { unique: true });
userProgressSchema.index({ user: 1, isCompleted: 1 });

export const UserProgress = mongoose.model('UserProgress', userProgressSchema);
