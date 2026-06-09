import { UserProgress } from '../models/UserProgress.js';
import { Topic } from '../models/Topic.js';

/**
 * Get user progress for a topic
 */
export async function getTopicProgress(userId, topicId) {
  const progress = await UserProgress.findOne({ 
    user: userId, 
    topic: topicId 
  });

  return progress;
}

/**
 * Get user progress for multiple topics
 */
export async function getTopicsProgress(userId, topicIds) {
  const progressList = await UserProgress.find({ 
    user: userId, 
    topic: { $in: topicIds } 
  });

  return progressList;
}

/**
 * Update or create topic progress
 */
export async function updateTopicProgress(userId, topicId, updateData) {
  const topic = await Topic.findById(topicId);
  if (!topic) {
    const error = new Error('Topic not found');
    error.code = 'TOPIC_NOT_FOUND';
    throw error;
  }

  const progress = await UserProgress.findOneAndUpdate(
    { user: userId, topic: topicId },
    {
      ...updateData,
      user: userId,
      topic: topicId
    },
    { upsert: true, new: true, runValidators: true }
  );

  return progress;
}

/**
 * Mark topic as completed
 */
export async function completeTopic(userId, topicId) {
  const topic = await Topic.findById(topicId);
  if (!topic) {
    const error = new Error('Topic not found');
    error.code = 'TOPIC_NOT_FOUND';
    throw error;
  }

  const progress = await UserProgress.findOneAndUpdate(
    { user: userId, topic: topicId },
    {
      user: userId,
      topic: topicId,
      isCompleted: true,
      completedAt: new Date(),
      lastViewedAt: new Date()
    },
    { upsert: true, new: true }
  );

  return progress;
}

/**
 * Get user's overall progress stats
 */
export async function getUserProgressStats(userId) {
  const progressList = await UserProgress.find({ user: userId });

  const totalTopics = progressList.length;
  const completedTopics = progressList.filter(p => p.isCompleted).length;
  const inProgressTopics = progressList.filter(p => !p.isCompleted && p.lastViewedAt).length;

  return {
    totalTopics,
    completedTopics,
    inProgressTopics,
    completionRate: totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0
  };
}

/**
 * Get user's recent activity
 */
export async function getRecentActivity(userId, limit = 10) {
  const activity = await UserProgress.find({ user: userId })
    .sort({ lastViewedAt: -1 })
    .limit(limit)
    .populate('topic', 'title slug book chapter');

  return activity;
}

/**
 * Get streak data (consecutive days of activity)
 */
export async function getStreakData(userId) {
  const progressList = await UserProgress.find({ 
    user: userId,
    lastViewedAt: { $exists: true }
  }).sort({ lastViewedAt: -1 });

  if (progressList.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates = [...new Set(progressList.map(p => {
    const date = new Date(p.lastViewedAt);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }))].sort((a, b) => b - a);

  for (let i = 0; i < dates.length; i++) {
    const currentDate = new Date(dates[i]);
    const diffDays = Math.floor((today - currentDate) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      tempStreak++;
      if (i === 0 && diffDays <= 1) {
        currentStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }

    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  return { currentStreak, longestStreak };
}
