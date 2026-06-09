import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export const Board = mongoose.model('Board', boardSchema);
