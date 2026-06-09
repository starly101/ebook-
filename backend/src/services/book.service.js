import { Book } from '../models/Book.js';
import { Chapter } from '../models/Chapter.js';
import { Topic } from '../models/Topic.js';
import { Program } from '../models/Program.js';
import { Board } from '../models/Board.js';
import { generateSlug } from '../utils/slug.js';

/**
 * Get all books with optional filters
 */
export async function getBooks({ boardId, programId, classLevel, subject, grade, editionYear } = {}) {
  const query = {};

  if (boardId) query.board = boardId;
  if (programId) query.program = programId;
  if (classLevel) query.classLevel = classLevel;
  if (subject) query.subject_slug = subject;
  if (grade) query.grade = grade;
  if (editionYear) query.edition_year = editionYear;
  else query.is_current_edition = true; // Default to current edition

  const books = await Book.find(query)
    .populate('board', 'name slug')
    .populate('program', 'name slug')
    .sort({ classLevel: 1, title: 1 });

  return books;
}

/**
 * Get books filtered by program, board, and grade
 */
export async function getBooksByProgramBoardGrade(programId, boardId, grade) {
  const query = {
    program: programId,
    board: boardId,
    grade: grade,
    is_current_edition: true
  };

  const books = await Book.find(query)
    .populate('board', 'name slug')
    .populate('program', 'name slug')
    .sort({ chapterOrder: 1, title: 1 });

  return books;
}

/**
 * Get current edition books only
 */
export async function getCurrentEditionBooks(filters = {}) {
  const query = { ...filters, is_current_edition: true };
  
  const books = await Book.find(query)
    .populate('board', 'name slug')
    .populate('program', 'name slug')
    .sort({ classLevel: 1, title: 1 });

  return books;
}

/**
 * Get book by slug with edition awareness
 */
export async function getBookBySlugWithEdition(slug, editionYear) {
  const query = { slug };
  
  if (editionYear) {
    query.edition_year = editionYear;
  } else {
    query.is_current_edition = true;
  }

  const book = await Book.findOne(query)
    .populate('board', 'name slug')
    .populate('program', 'name slug');

  if (!book) {
    const error = new Error('Book not found');
    error.code = 'BOOK_NOT_FOUND';
    throw error;
  }

  return book;
}

/**
 * Get book by ID
 */
export async function getBookById(bookId) {
  const book = await Book.findById(bookId)
    .populate('board', 'name slug')
    .populate('program', 'name slug');

  if (!book) {
    const error = new Error('Book not found');
    error.code = 'BOOK_NOT_FOUND';
    throw error;
  }

  return book;
}

/**
 * Get book by slug (legacy, returns current edition)
 */
export async function getBookBySlug(slug) {
  return getBookBySlugWithEdition(slug, null);
}

/**
 * Create a new book with edition handling
 */
export async function createBook(bookData) {
  const slug = bookData.slug || generateSlug(bookData.title);

  // Check if book with this slug exists
  const existingBook = await Book.findOne({ slug });
  
  if (existingBook) {
    // If creating a new edition, archive the previous current edition
    if (bookData.edition_year) {
      await Book.findByIdAndUpdate(existingBook._id, {
        is_current_edition: false,
        next_edition_id: undefined
      });
    } else {
      const error = new Error('Book with this slug already exists');
      error.code = 'BOOK_EXISTS';
      throw error;
    }
  }

  const book = await Book.create({ 
    ...bookData, 
    slug,
    is_current_edition: bookData.is_current_edition ?? true
  });
  
  // Link previous edition if archiving
  if (existingBook && bookData.edition_year) {
    await Book.findByIdAndUpdate(existingBook._id, {
      next_edition_id: book._id
    });
  }

  return book;
}

/**
 * Update book with edition transition support
 */
export async function updateBook(bookId, updateData) {
  const book = await Book.findById(bookId);
  
  if (!book) {
    const error = new Error('Book not found');
    error.code = 'BOOK_NOT_FOUND';
    throw error;
  }

  // Handle edition transition
  if (updateData.is_current_edition === true && !book.is_current_edition) {
    // Archive the current current edition
    await Book.findOneAndUpdate(
      { slug: book.slug, is_current_edition: true },
      { is_current_edition: false, next_edition_id: bookId }
    );
  }

  const updatedBook = await Book.findByIdAndUpdate(
    bookId,
    updateData,
    { new: true, runValidators: true }
  );

  return updatedBook;
}

/**
 * Delete book
 */
export async function deleteBook(bookId) {
  const book = await Book.findByIdAndDelete(bookId);

  if (!book) {
    const error = new Error('Book not found');
    error.code = 'BOOK_NOT_FOUND';
    throw error;
  }

  // Cascade delete chapters and topics
  await Chapter.deleteMany({ book: bookId });
  await Topic.deleteMany({ book: bookId });

  return { success: true };
}

/**
 * Get book chapters
 */
export async function getBookChapters(bookId) {
  const chapters = await Chapter.find({ book: bookId })
    .sort({ chapterNumber: 1 });

  return chapters;
}
