import mongoose from 'mongoose';

const quranWordSchema = new mongoose.Schema({
  verse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuranVerse',
    required: true
  },
  wordNumber: Number,
  arabicWord: String,
  translation: String,
  transliteration: String
}, {
  timestamps: true
});

quranWordSchema.index({ verse: 1, wordNumber: 1 });

export const QuranWord = mongoose.model('QuranWord', quranWordSchema);
