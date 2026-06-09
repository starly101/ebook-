import { success } from '../utils/apiResponse.js';
import * as authService from '../services/auth.service.js';

export async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;
    const result = await authService.registerUser({ email, password, name });
    
    res.status(201).json(success(result, 'Registration successful'));
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });
    
    // Set cookies
    res.cookie('accessToken', result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    
    res.json(success(result, 'Login successful'));
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshAccessToken(refreshToken);
    res.json(success(tokens, 'Token refreshed'));
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = req.user;
    res.json(success(user, 'User retrieved'));
  } catch (err) {
    next(err);
  }
}

export async function googleCallback(req, res, next) {
  try {
    const { user, tokens } = req.authResult;
    
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });
    
    res.redirect(`${process.env.STUDENT_ORIGIN || 'http://localhost:3000'}/auth/callback?token=${tokens.accessToken}`);
  } catch (err) {
    next(err);
  }
}
