import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true
  },
  title: String,
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  passingScore: {
    type: Number,
    default: 70
  },
  timeLimit: Number,
  isPremium: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

quizSchema.index({ topic: 1 });

export const Quiz = mongoose.model('Quiz', quizSchema);
