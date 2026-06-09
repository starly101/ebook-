import { success } from '../utils/apiResponse.js';
import * as topicService from '../services/topic.service.js';

export async function getTopic(req, res, next) {
  try {
    const { id } = req.params;
    const topic = await topicService.getTopicById(id);
    res.json(success(topic));
  } catch (err) {
    next(err);
  }
}

export async function getTopicBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const topic = await topicService.getTopicBySlug(slug);
    res.json(success(topic));
  } catch (err) {
    next(err);
  }
}

export async function getTopicsByChapter(req, res, next) {
  try {
    const { chapterId } = req.params;
    const topics = await topicService.getTopicsByChapter(chapterId);
    res.json(success(topics));
  } catch (err) {
    next(err);
  }
}

export async function getAdjacentTopics(req, res, next) {
  try {
    const { id } = req.params;
    const result = await topicService.getAdjacentTopics(id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function searchTopics(req, res, next) {
  try {
    const { q, limit, boardId, programId, classLevel } = req.query;
    const topics = await topicService.searchTopics(q, { 
      limit: parseInt(limit), 
      boardId, 
      programId, 
      classLevel 
    });
    res.json(success(topics));
  } catch (err) {
    next(err);
  }
}

export async function getHotTopics(req, res, next) {
  try {
    const { limit } = req.query;
    const topics = await topicService.getHotTopics({ limit: parseInt(limit) });
    res.json(success(topics));
  } catch (err) {
    next(err);
  }
}
