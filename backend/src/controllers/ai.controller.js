import { success } from '../utils/apiResponse.js';
import * as aiService from '../services/ai.service.js';
import { Topic } from '../models/Topic.js';

export async function generateExplanation(req, res, next) {
  try {
    const { topicId } = req.params;
    const { stream } = req.query;
    
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Topic not found' }
      });
    }

    if (stream === 'true') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      await aiService.generateExplanation(topic, {
        stream: true,
        onChunk: (chunk) => {
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }
      });

      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const explanation = await aiService.generateExplanation(topic);
      res.json(success({ explanation }));
    }
  } catch (err) {
    next(err);
  }
}

export async function generateQuizQuestions(req, res, next) {
  try {
    const { topicId } = req.params;
    const { count } = req.query;
    
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Topic not found' }
      });
    }

    const questions = await aiService.generateQuizQuestions(topic, parseInt(count) || 5);
    res.json(success({ questions }));
  } catch (err) {
    next(err);
  }
}

export async function generateFlashcards(req, res, next) {
  try {
    const { topicId } = req.params;
    const { count } = req.query;
    
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Topic not found' }
      });
    }

    const flashcards = await aiService.generateFlashcards(topic, parseInt(count) || 10);
    res.json(success({ flashcards }));
  } catch (err) {
    next(err);
  }
}

export async function checkCredits(req, res, next) {
  try {
    const credits = await aiService.checkAICredits(req.user._id);
    res.json(success(credits));
  } catch (err) {
    next(err);
  }
}
