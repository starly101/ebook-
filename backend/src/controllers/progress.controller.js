import { success } from '../utils/apiResponse.js';
import * as progressService from '../services/progress.service.js';

export async function getTopicProgress(req, res, next) {
  try {
    const { topicId } = req.params;
    const progress = await progressService.getTopicProgress(req.user._id, topicId);
    res.json(success(progress || {}));
  } catch (err) {
    next(err);
  }
}

export async function updateProgress(req, res, next) {
  try {
    const { topicId } = req.params;
    const progress = await progressService.updateTopicProgress(req.user._id, topicId, req.body);
    res.json(success(progress));
  } catch (err) {
    next(err);
  }
}

export async function completeTopic(req, res, next) {
  try {
    const { topicId } = req.params;
    const progress = await progressService.completeTopic(req.user._id, topicId);
    res.json(success(progress, 'Topic marked as completed'));
  } catch (err) {
    next(err);
  }
}

export async function getProgressStats(req, res, next) {
  try {
    const stats = await progressService.getUserProgressStats(req.user._id);
    res.json(success(stats));
  } catch (err) {
    next(err);
  }
}

export async function getRecentActivity(req, res, next) {
  try {
    const { limit } = req.query;
    const activity = await progressService.getRecentActivity(req.user._id, parseInt(limit));
    res.json(success(activity));
  } catch (err) {
    next(err);
  }
}

export async function getStreakData(req, res, next) {
  try {
    const streakData = await progressService.getStreakData(req.user._id);
    res.json(success(streakData));
  } catch (err) {
    next(err);
  }
}
