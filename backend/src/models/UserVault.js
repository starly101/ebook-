import mongoose from 'mongoose';

const userVaultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  topics: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic'
  }]
}, {
  timestamps: true
});

export const UserVault = mongoose.model('UserVault', userVaultSchema);
