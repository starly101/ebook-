import mongoose from 'mongoose';

const quranVerseSchema = new mongoose.Schema({
  surah: {
    type: Number,
    required: true
  },
  ayah: {
    type: Number,
    required: true
  },
  arabicText: {
    type: String,
    required: true
  },
  translation: String,
  transliteration: String
}, {
  timestamps: true
});

quranVerseSchema.index({ surah: 1, ayah: 1 }, { unique: true });

export const QuranVerse = mongoose.model('QuranVerse', quranVerseSchema);
