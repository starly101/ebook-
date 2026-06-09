import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
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
  topicNumber: {
    type: Number,
    default: 0
  },
  content: {
    type: String,
    default: ''
  },
  viewCount: {
    type: Number,
    default: 0
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  tags: [String]
}, {
  timestamps: true
});

// Indexes
topicSchema.index({ slug: 1 });
topicSchema.index({ book: 1, chapter: 1, slug: 1 }, { unique: true });
topicSchema.index({ book: 1, chapter: 1, topicNumber: 1 });
topicSchema.index({ title: 'text', content: 'text' });

export const Topic = mongoose.model('Topic', topicSchema);
