import { Book } from '../models/Book.js';
import { Topic } from '../models/Topic.js';
import { Chapter } from '../models/Chapter.js';

/**
 * Global search across books, chapters, and topics
 */
export async function globalSearch(query, options = {}) {
  const { limit = 20, type = 'all' } = options;
  
  const searchRegex = new RegExp(query, 'i');
  const results = {
    books: [],
    chapters: [],
    topics: []
  };

  if (type === 'all' || type === 'books') {
    results.books = await Book.find({
      $or: [
        { title: searchRegex },
        { subject: searchRegex }
      ]
    })
    .limit(limit)
    .populate('board', 'name slug')
    .populate('program', 'name slug');
  }

  if (type === 'all' || type === 'chapters') {
    results.chapters = await Chapter.find({
      title: searchRegex
    })
    .limit(limit)
    .populate('book', 'title slug subject');
  }

  if (type === 'all' || type === 'topics') {
    results.topics = await Topic.find({
      $or: [
        { title: searchRegex },
        { content: searchRegex }
      ]
    })
    .limit(limit)
    .populate('book', 'title slug subject')
    .populate('chapter', 'title chapterNumber');
  }

  return results;
}

/**
 * Search with filters
 */
export async function searchWithFilters(filters) {
  const { query, boardId, programId, classLevel, subject, type = 'all' } = filters;
  
  const bookQuery = {};
  const topicQuery = {};

  if (query) {
    const searchRegex = new RegExp(query, 'i');
    bookQuery.$or = [
      { title: searchRegex },
      { subject: searchRegex }
    ];
    topicQuery.$or = [
      { title: searchRegex },
      { content: searchRegex }
    ];
  }

  if (boardId) {
    bookQuery.board = boardId;
    topicQuery.board = boardId;
  }

  if (programId) {
    bookQuery.program = programId;
    topicQuery.program = programId;
  }

  if (classLevel) {
    bookQuery.classLevel = classLevel;
    topicQuery.classLevel = classLevel;
  }

  if (subject) {
    bookQuery.subject = subject;
    topicQuery.subject = subject;
  }

  const results = {
    books: [],
    topics: []
  };

  if (type === 'all' || type === 'books') {
    results.books = await Book.find(bookQuery)
      .limit(20)
      .populate('board', 'name slug')
      .populate('program', 'name slug');
  }

  if (type === 'all' || type === 'topics') {
    results.topics = await Topic.find(topicQuery)
      .limit(20)
      .populate('book', 'title slug subject')
      .populate('chapter', 'title');
  }

  return results;
}

/**
 * Get search suggestions
 */
export async function getSearchSuggestions(query, limit = 5) {
  const searchRegex = new RegExp(query, 'i');
  
  const [bookSuggestions, topicSuggestions] = await Promise.all([
    Book.find({ title: searchRegex })
      .select('title slug subject')
      .limit(limit),
    
    Topic.find({ title: searchRegex })
      .select('title slug')
      .limit(limit)
  ]);

  return {
    books: bookSuggestions,
    topics: topicSuggestions
  };
}
