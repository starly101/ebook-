import { success } from '../utils/apiResponse.js';
import * as bookService from '../services/book.service.js';

export async function getBooks(req, res, next) {
  try {
    const { boardId, programId, classLevel, subject } = req.query;
    const books = await bookService.getBooks({ boardId, programId, classLevel, subject });
    res.json(success(books));
  } catch (err) {
    next(err);
  }
}

export async function getBook(req, res, next) {
  try {
    const { id } = req.params;
    const book = await bookService.getBookById(id);
    res.json(success(book));
  } catch (err) {
    next(err);
  }
}

export async function getBookBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const book = await bookService.getBookBySlug(slug);
    res.json(success(book));
  } catch (err) {
    next(err);
  }
}

export async function createBook(req, res, next) {
  try {
    const book = await bookService.createBook(req.body);
    res.status(201).json(success(book, 'Book created'));
  } catch (err) {
    next(err);
  }
}

export async function updateBook(req, res, next) {
  try {
    const { id } = req.params;
    const book = await bookService.updateBook(id, req.body);
    res.json(success(book, 'Book updated'));
  } catch (err) {
    next(err);
  }
}

export async function deleteBook(req, res, next) {
  try {
    const { id } = req.params;
    await bookService.deleteBook(id);
    res.json(success(null, 'Book deleted'));
  } catch (err) {
    next(err);
  }
}

export async function getBookChapters(req, res, next) {
  try {
    const { id } = req.params;
    const chapters = await bookService.getBookChapters(id);
    res.json(success(chapters));
  } catch (err) {
    next(err);
  }
}
