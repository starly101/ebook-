import { User } from '../models/User.js';
import { Book } from '../models/Book.js';
import { Topic } from '../models/Topic.js';
import { UserProgress } from '../models/UserProgress.js';
import { Subscription } from '../models/Subscription.js';

/**
 * Get dashboard data for student
 */
export async function getStudentDashboard(userId) {
  const user = await User.findById(userId);
  
  // Get recent activity
  const recentActivity = await UserProgress.find({ user: userId })
    .sort({ lastViewedAt: -1 })
    .limit(5)
    .populate('topic', 'title slug book chapter');

  // Get progress stats
  const progressStats = await getUserProgressStats(userId);

  // Get recommended books/topics
  const recommendedBooks = await Book.find()
    .sort({ createdAt: -1 })
    .limit(4)
    .populate('board', 'name')
    .populate('program', 'name');

  return {
    user: {
      name: user.name,
      email: user.email,
      avatar: user.avatar
    },
    recentActivity,
    progressStats,
    recommendedBooks
  };
}

/**
 * Get user progress statistics
 */
async function getUserProgressStats(userId) {
  const progressList = await UserProgress.find({ user: userId });

  const totalTopics = progressList.length;
  const completedTopics = progressList.filter(p => p.isCompleted).length;
  const inProgressTopics = progressList.filter(p => !p.isCompleted && p.lastViewedAt).length;

  return {
    totalTopics,
    completedTopics,
    inProgressTopics,
    completionRate: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0
  };
}

/**
 * Get admin dashboard metrics
 */
export async function getAdminMetrics() {
  const [
    totalUsers,
    totalBooks,
    totalTopics,
    activeSubscriptions
  ] = await Promise.all([
    User.countDocuments(),
    Book.countDocuments(),
    Topic.countDocuments(),
    Subscription.countDocuments({ status: 'active' })
  ]);

  // Get recent users
  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select('name email role createdAt');

  // Get content stats by subject
  const booksBySubject = await Book.aggregate([
    {
      $group: {
        _id: '$subject',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Get growth data (users per month)
  const userGrowth = await User.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 6 }
  ]);

  return {
    overview: {
      totalUsers,
      totalBooks,
      totalTopics,
      activeSubscriptions
    },
    recentUsers,
    booksBySubject,
    userGrowth
  };
}

/**
 * Get content health metrics
 */
export async function getContentHealth() {
  const booksWithoutChapters = await Book.aggregate([
    {
      $lookup: {
        from: 'chapters',
        localField: '_id',
        foreignField: 'book',
        as: 'chapters'
      }
    },
    {
      $match: { chapters: { $size: 0 } }
    },
    {
      $count: 'count'
    }
  ]);

  const chaptersWithoutTopics = await Chapter.aggregate([
    {
      $lookup: {
        from: 'topics',
        localField: '_id',
        foreignField: 'chapter',
        as: 'topics'
      }
    },
    {
      $match: { topics: { $size: 0 } }
    },
    {
      $count: 'count'
    }
  ]);

  const topicsWithoutContent = await Topic.aggregate([
    {
      $match: {
        $or: [
          { content: null },
          { content: '' },
          { content: { $exists: false } }
        ]
      }
    },
    {
      $count: 'count'
    }
  ]);

  return {
    booksWithoutChapters: booksWithoutChapters[0]?.count || 0,
    chaptersWithoutTopics: chaptersWithoutTopics[0]?.count || 0,
    topicsWithoutContent: topicsWithoutContent[0]?.count || 0
  };
}
