import { Topic } from '../models/Topic.js';
import { Chapter } from '../models/Chapter.js';
import { Book } from '../models/Book.js';
import { createSlug } from '../utils/slug.js';

/**
 * Get topic by ID
 */
export async function getTopicById(topicId) {
  const topic = await Topic.findById(topicId)
    .populate('chapter', 'title chapterNumber')
    .populate('book', 'title slug subject');

  if (!topic) {
    const error = new Error('Topic not found');
    error.code = 'TOPIC_NOT_FOUND';
    throw error;
  }

  return topic;
}

/**
 * Get topic by slug with full hierarchy
 */
export async function getTopicBySlug(slug) {
  const topic = await Topic.findOne({ slug })
    .populate('chapter', 'title chapterNumber')
    .populate('book', 'title slug subject board program');

  if (!topic) {
    const error = new Error('Topic not found');
    error.code = 'TOPIC_NOT_FOUND';
    throw error;
  }

  return topic;
}

/**
 * Get topics by chapter
 */
export async function getTopicsByChapter(chapterId) {
  const topics = await Topic.find({ chapter: chapterId })
    .sort({ topicNumber: 1 });

  return topics;
}

/**
 * Get adjacent topics (prev/next) for navigation
 */
export async function getAdjacentTopics(topicId) {
  const topic = await Topic.findById(topicId);
  if (!topic) {
    const error = new Error('Topic not found');
    error.code = 'TOPIC_NOT_FOUND';
    throw error;
  }

  const [prevTopic, nextTopic] = await Promise.all([
    Topic.findOne({ 
      chapter: topic.chapter, 
      topicNumber: { $lt: topic.topicNumber } 
    }).sort({ topicNumber: -1 }),
    
    Topic.findOne({ 
      chapter: topic.chapter, 
      topicNumber: { $gt: topic.topicNumber } 
    }).sort({ topicNumber: 1 })
  ]);

  return { prevTopic, nextTopic };
}

/**
 * Search topics
 */
export async function searchTopics(query, options = {}) {
  const { limit = 20, boardId, programId, classLevel } = options;
  
  const searchQuery = {
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { content: { $regex: query, $options: 'i' } }
    ]
  };

  if (boardId) searchQuery.board = boardId;
  if (programId) searchQuery.program = programId;
  if (classLevel) searchQuery.classLevel = classLevel;

  const topics = await Topic.find(searchQuery)
    .populate('book', 'title slug subject')
    .populate('chapter', 'title chapterNumber')
    .limit(limit);

  return topics;
}

/**
 * Create or update topic (upsert for ingestion)
 */
export async function upsertTopic(topicData) {
  const { book, chapter, title, slug } = topicData;
  
  const existingTopic = await Topic.findOne({ 
    book, 
    chapter, 
    slug: slug || createSlug(title) 
  });

  if (existingTopic) {
    return await Topic.findByIdAndUpdate(
      existingTopic._id,
      topicData,
      { new: true, runValidators: true }
    );
  }

  const newSlug = slug || createSlug(title);
  return await Topic.create({ ...topicData, slug: newSlug });
}

/**
 * Get hot topics (most viewed/recently updated)
 */
export async function getHotTopics({ limit = 10 } = {}) {
  const topics = await Topic.find()
    .sort({ updatedAt: -1, viewCount: -1 })
    .limit(limit)
    .populate('book', 'title slug subject')
    .populate('chapter', 'title');

  return topics;
}
