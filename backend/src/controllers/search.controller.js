import { success } from '../utils/apiResponse.js';
import * as searchService from '../services/search.service.js';

export async function globalSearch(req, res, next) {
  try {
    const { q, type, limit } = req.query;
    const results = await searchService.globalSearch(q, { type, limit: parseInt(limit) });
    res.json(success(results));
  } catch (err) {
    next(err);
  }
}

export async function searchWithFilters(req, res, next) {
  try {
    const filters = req.query;
    const results = await searchService.searchWithFilters(filters);
    res.json(success(results));
  } catch (err) {
    next(err);
  }
}

export async function getSearchSuggestions(req, res, next) {
  try {
    const { q, limit } = req.query;
    const suggestions = await searchService.getSearchSuggestions(q, parseInt(limit));
    res.json(success(suggestions));
  } catch (err) {
    next(err);
  }
}
