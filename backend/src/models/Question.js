import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: String,
    required: true
  },
  explanation: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  questionType: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'fill-blank'],
    default: 'multiple-choice'
  }
}, {
  timestamps: true
});

questionSchema.index({ topic: 1 });

export const Question = mongoose.model('Question', questionSchema);
