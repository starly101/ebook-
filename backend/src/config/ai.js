import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { env } from './env.js';

/**
 * Get AI provider instance
 */
export function getAIProvider() {
  const provider = env.AI_PROVIDER || 'gemini';

  if (provider === 'openai') {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    return new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  // Default to Gemini
  const apiKey = env.DEEPSEEK_API_KEY || env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('No AI API key configured');
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Check if AI is configured
 */
export function isAIConfigured() {
  return !!(env.OPENAI_API_KEY || env.DEEPSEEK_API_KEY);
}
