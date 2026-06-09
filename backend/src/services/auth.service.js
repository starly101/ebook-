import { User } from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Generate JWT token pair (access + refresh)
 */
export function generateTokenPair(user) {
  const accessToken = jwt.sign(
    { 
      userId: user._id.toString(), 
      email: user.email,
      role: user.role 
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { 
      userId: user._id.toString(),
      type: 'refresh'
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
}

/**
 * Register a new user
 */
export async function registerUser({ email, password, name, googleId }) {
  const existingUser = await User.findOne({ 
    $or: [{ email }, ...(googleId ? [{ googleId }] : [])] 
  });

  if (existingUser) {
    const error = new Error('User already exists');
    error.code = 'USER_EXISTS';
    throw error;
  }

  const hashedPassword = googleId ? null : await hashPassword(password);

  const user = await User.create({
    email,
    password: hashedPassword,
    name,
    googleId,
    provider: googleId ? 'google' : 'credentials'
  });

  const tokens = generateTokenPair(user);

  return { user, tokens };
}

/**
 * Login with email/password
 */
export async function loginUser({ email, password }) {
  const user = await User.findOne({ email });

  if (!user) {
    const error = new Error('Invalid credentials');
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  if (user.provider === 'google') {
    const error = new Error('Please login with Google');
    error.code = 'GOOGLE_AUTH_REQUIRED';
    throw error;
  }

  const isValid = await comparePassword(password, user.password);

  if (!isValid) {
    const error = new Error('Invalid credentials');
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const tokens = generateTokenPair(user);

  return { user, tokens };
}

/**
 * Get user by ID
 */
export async function getUserById(userId) {
  const user = await User.findById(userId).select('-password');
  
  if (!user) {
    const error = new Error('User not found');
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  return user;
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);

    if (decoded.type !== 'refresh') {
      const error = new Error('Invalid token type');
      error.code = 'INVALID_TOKEN_TYPE';
      throw error;
    }

    const user = await getUserById(decoded.userId);
    const tokens = generateTokenPair(user);

    return tokens;
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      const error = new Error('Invalid or expired refresh token');
      error.code = 'INVALID_REFRESH_TOKEN';
      throw error;
    }
    throw err;
  }
}

/**
 * Handle Google OAuth login/register
 */
export async function handleGoogleAuth({ email, name, googleId, picture }) {
  let user = await User.findOne({ googleId });

  if (!user) {
    user = await User.findOne({ email });

    if (user) {
      // Link Google account to existing user
      user.googleId = googleId;
      user.provider = 'google';
      if (picture && !user.avatar) {
        user.avatar = picture;
      }
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        email,
        name,
        googleId,
        avatar: picture,
        provider: 'google',
        isEmailVerified: true
      });
    }
  }

  const tokens = generateTokenPair(user);

  return { user, tokens };
}
