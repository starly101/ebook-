import { Quiz } from '../models/Quiz.js';
import { Question } from '../models/Question.js';
import { Topic } from '../models/Topic.js';

/**
 * Get quiz by ID
 */
export async function getQuizById(quizId) {
  const quiz = await Quiz.findById(quizId)
    .populate('topic', 'title slug')
    .populate('questions');

  if (!quiz) {
    const error = new Error('Quiz not found');
    error.code = 'QUIZ_NOT_FOUND';
    throw error;
  }

  return quiz;
}

/**
 * Get quizzes by topic
 */
export async function getQuizzesByTopic(topicId) {
  const quizzes = await Quiz.find({ topic: topicId })
    .populate('questions', 'questionText options questionType')
    .sort({ createdAt: -1 });

  return quizzes;
}

/**
 * Create quiz with questions
 */
export async function createQuiz(quizData) {
  const { topic, questions, ...rest } = quizData;

  const topicExists = await Topic.findById(topic);
  if (!topicExists) {
    const error = new Error('Topic not found');
    error.code = 'TOPIC_NOT_FOUND';
    throw error;
  }

  // Create questions first
  const createdQuestions = await Question.insertMany(
    questions.map(q => ({ ...q, topic }))
  );

  const quiz = await Quiz.create({
    ...rest,
    topic,
    questions: createdQuestions.map(q => q._id)
  });

  return quiz.populate('questions');
}

/**
 * Submit quiz and calculate score
 */
export async function submitQuiz(quizId, userAnswers) {
  const quiz = await Quiz.findById(quizId).populate('questions');
  
  if (!quiz) {
    const error = new Error('Quiz not found');
    error.code = 'QUIZ_NOT_FOUND';
    throw error;
  }

  let correctCount = 0;
  const results = quiz.questions.map((question, index) => {
    const userAnswer = userAnswers[index];
    const isCorrect = question.correctAnswer === userAnswer;
    
    if (isCorrect) correctCount++;

    return {
      questionId: question._id,
      userAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect
    };
  });

  const totalQuestions = quiz.questions.length;
  const score = (correctCount / totalQuestions) * 100;
  const passed = score >= (quiz.passingScore || 70);

  return {
    score,
    passed,
    correctCount,
    totalQuestions,
    results
  };
}

/**
 * Get random quiz for practice
 */
export async function getRandomQuiz(topicId, limit = 5) {
  const questions = await Question.aggregate([
    { $match: { topic: require('mongoose').Types.ObjectId(topicId) } },
    { $sample: { size: limit } }
  ]);

  if (questions.length === 0) {
    const error = new Error('No questions available for this topic');
    error.code = 'NO_QUESTIONS';
    throw error;
  }

  return {
    questions,
    totalQuestions: questions.length
  };
}

/**
 * Get question by ID
 */
export async function getQuestionById(questionId) {
  const question = await Question.findById(questionId)
    .populate('topic', 'title slug');

  if (!question) {
    const error = new Error('Question not found');
    error.code = 'QUESTION_NOT_FOUND';
    throw error;
  }

  return question;
}

/**
 * Create multiple questions
 */
export async function createQuestions(questionsData) {
  const questions = await Question.insertMany(questionsData);
  return questions;
}
