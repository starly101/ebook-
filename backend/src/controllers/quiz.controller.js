import { success } from '../utils/apiResponse.js';
import * as quizService from '../services/quiz.service.js';

export async function getQuiz(req, res, next) {
  try {
    const { id } = req.params;
    const quiz = await quizService.getQuizById(id);
    res.json(success(quiz));
  } catch (err) {
    next(err);
  }
}

export async function getQuizzesByTopic(req, res, next) {
  try {
    const { topicId } = req.params;
    const quizzes = await quizService.getQuizzesByTopic(topicId);
    res.json(success(quizzes));
  } catch (err) {
    next(err);
  }
}

export async function createQuiz(req, res, next) {
  try {
    const quiz = await quizService.createQuiz(req.body);
    res.status(201).json(success(quiz, 'Quiz created'));
  } catch (err) {
    next(err);
  }
}

export async function submitQuiz(req, res, next) {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const result = await quizService.submitQuiz(id, answers);
    
    // Save attempt to user progress (optional)
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getRandomQuiz(req, res, next) {
  try {
    const { topicId } = req.params;
    const { limit } = req.query;
    const quiz = await quizService.getRandomQuiz(topicId, parseInt(limit));
    res.json(success(quiz));
  } catch (err) {
    next(err);
  }
}
