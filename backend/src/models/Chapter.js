import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true
  },
  chapterNumber: {
    type: Number,
    required: true
  },
  description: String
}, {
  timestamps: true
});

// Compound index for unique chapter per book
chapterSchema.index({ book: 1, chapterNumber: 1 }, { unique: true });
chapterSchema.index({ book: 1, slug: 1 }, { unique: true });

export const Chapter = mongoose.model('Chapter', chapterSchema);
