import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.string().default('5000'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  AI_PROVIDER: z.enum(['openai', 'gemini']).default('gemini'),
  STUDENT_ORIGIN: z.string().url().default('http://localhost:3000'),
  ADMIN_ORIGIN: z.string().url().default('http://localhost:3001'),
  EMAIL_FROM: z.string().email().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional()
});

export function validateEnv() {
  try {
    const parsed = envSchema.parse(process.env);
    return parsed;
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errors = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n');
      console.error('Environment validation failed:\n', errors);
      process.exit(1);
    }
    throw err;
  }
}

export const env = validateEnv();
