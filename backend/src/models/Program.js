import mongoose from 'mongoose';

const programSchema = new mongoose.Schema({
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

export const Program = mongoose.model('Program', programSchema);
