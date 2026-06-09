import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { env } from '../config/env.js';

/**
 * Get AI provider instance based on configuration
 */
export function getAIProvider() {
  const provider = env.AI_PROVIDER || 'gemini';

  if (provider === 'openai') {
    return new OpenAI({
      apiKey: env.OPENAI_API_KEY
    });
  }

  // Default to Gemini
  return new GoogleGenerativeAI(env.DEEPSEEK_API_KEY || env.OPENAI_API_KEY);
}

/**
 * Generate explanation for a topic with streaming support
 */
export async function generateExplanation(topic, options = {}) {
  const { stream = false, onChunk } = options;
  const provider = getAIProvider();

  const prompt = `You are an expert educational assistant for Pakistani students. 
Explain the following topic clearly and concisely, using examples relevant to Pakistani curriculum.

Topic: ${topic.title}
Subject: ${topic.subject || 'General'}
Class Level: ${topic.classLevel || 'General'}

Content context: ${topic.content?.substring(0, 500) || 'No additional content'}

Provide a clear, structured explanation that helps students understand this topic.`;

  if (stream && onChunk) {
    return streamExplanation(prompt, onChunk, provider);
  }

  if (provider instanceof GoogleGenerativeAI) {
    const model = provider.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } else {
    const completion = await provider.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }]
    });
    return completion.choices[0].message.content;
  }
}

/**
 * Stream AI response as SSE chunks
 */
async function streamExplanation(prompt, onChunk, provider) {
  if (provider instanceof GoogleGenerativeAI) {
    const model = provider.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContentStream(prompt);
    
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        onChunk(text);
      }
    }
  } else {
    const stream = await provider.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      stream: true
    });
    
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        onChunk(text);
      }
    }
  }
}

/**
 * Generate quiz questions from topic content
 */
export async function generateQuizQuestions(topic, count = 5) {
  const provider = getAIProvider();

  const prompt = `Generate ${count} multiple-choice quiz questions based on this topic:

Topic: ${topic.title}
Content: ${topic.content?.substring(0, 1000) || 'No content available'}

For each question, provide:
1. The question text
2. Four options (A, B, C, D)
3. The correct answer (just the letter)

Format as JSON array like:
[
  {
    "questionText": "...",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correctAnswer": "A"
  }
]`;

  if (provider instanceof GoogleGenerativeAI) {
    const model = provider.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return parseJSONResponse(text);
  } else {
    const completion = await provider.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }]
    });
    const text = completion.choices[0].message.content;
    return parseJSONResponse(text);
  }
}

/**
 * Generate flashcards from topic content
 */
export async function generateFlashcards(topic, count = 10) {
  const provider = getAIProvider();

  const prompt = `Generate ${count} flashcards for studying this topic:

Topic: ${topic.title}
Content: ${topic.content?.substring(0, 1000) || 'No content available'}

Each flashcard should have:
1. A front (question/term)
2. A back (answer/definition)

Format as JSON array like:
[
  {
    "front": "...",
    "back": "..."
  }
]`;

  if (provider instanceof GoogleGenerativeAI) {
    const model = provider.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return parseJSONResponse(text);
  } else {
    const completion = await provider.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }]
    });
    const text = completion.choices[0].message.content;
    return parseJSONResponse(text);
  }
}

/**
 * Parse JSON from AI response (handles markdown code blocks)
 */
function parseJSONResponse(text) {
  try {
    // Remove markdown code blocks if present
    const cleaned = text.replace(/```json\s*|\s*```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse AI JSON response:', err);
    return [];
  }
}

/**
 * Check AI credits/usage (placeholder for future implementation)
 */
export async function checkAICredits(userId) {
  // TODO: Implement credit tracking
  return {
    remaining: 100,
    used: 0,
    limit: 100
  };
}
