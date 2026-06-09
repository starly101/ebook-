import { success, error } from '../utils/apiResponse.js';
import * as authService from '../services/auth.service.js';
import crypto from 'crypto';
import { sendOtpEmail, sendPasswordResetEmail } from '../utils/email.js';
import { User } from '../models/User.js';
import { hashPassword } from '../utils/hash.js';

/**
 * POST /auth/signup - Register with email/password + OTP verification
 */
export async function signup(req, res, next) {
  try {
    const { name, email, password, role = 'student' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json(error('Name, email and password are required', 'VALIDATION_ERROR'));
    }

    if (password.length < 8) {
      return res.status(400).json(error('Password must be at least 8 characters', 'VALIDATION_ERROR'));
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json(error('An account with this email already exists', 'USER_EXISTS'));
    }

    const password_hash = await hashPassword(password);
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash,
      role: ['student', 'parent'].includes(role) ? role : 'student',
      otp: hashedOtp,
      otp_expires_at: new Date(Date.now() + 10 * 60 * 1000),
      is_verified: false,
      student_profile: {
        onboarding_completed: false,
      },
    });

    sendOtpEmail(user.email, rawOtp, user.name).catch((err) => {
      console.error('[signup] OTP email failed:', err.message);
    });

    res.status(201).json(success({ userId: user._id, email: user.email }, 'Registration successful. Please verify your email.'));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/verify-otp - Verify email with OTP
 */
export async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json(error('Email and OTP required', 'VALIDATION_ERROR'));
    }

    const hashedOtp = crypto.createHash('sha256').update(otp.toString()).digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase(),
      otp: hashedOtp,
      otp_expires_at: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json(error('Invalid or expired code', 'OTP_INVALID'));
    }

    await User.findByIdAndUpdate(user._id, {
      is_verified: true,
      $unset: { otp: '', otp_expires_at: '' },
    });

    res.json(success({ message: 'Email verified successfully' }, 'OTP_VERIFIED'));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/forgot-password - Request password reset
 */
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(error('Email required', 'VALIDATION_ERROR'));
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.json(success({ message: 'If that email exists, a reset link has been sent.' }, 'RESET_SENT'));
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await User.findByIdAndUpdate(user._id, {
      password_reset_token: hashedToken,
      password_reset_expires: new Date(Date.now() + 60 * 60 * 1000),
    });

    await sendPasswordResetEmail(user.email, rawToken, user.name);

    res.json(success({ message: 'If that email exists, a reset link has been sent.' }, 'RESET_SENT'));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/reset-password - Reset password with token
 */
export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json(error('Token and password required', 'VALIDATION_ERROR'));
    }

    if (password.length < 8) {
      return res.status(400).json(error('Password must be at least 8 characters', 'VALIDATION_ERROR'));
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      password_reset_token: hashedToken,
      password_reset_expires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json(error('Reset link is invalid or has expired', 'RESET_INVALID'));
    }

    const password_hash = await hashPassword(password);
    await User.findByIdAndUpdate(user._id, {
      password_hash,
      $unset: { password_reset_token: '', password_reset_expires: '' },
    });

    res.json(success({ message: 'Password reset successfully. You can now log in.' }, 'PASSWORD_RESET'));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/google - Google OAuth login/register with credential
 */
export async function googleAuth(req, res, next) {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json(error('Google credential required', 'VALIDATION_ERROR'));
    }

    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    const google = await googleRes.json();

    if (google.error || !google.email) {
      return res.status(401).json(error('Invalid Google token', 'GOOGLE_INVALID'));
    }

    if (process.env.GOOGLE_CLIENT_ID && google.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json(error('Token audience mismatch', 'GOOGLE_AUDIENCE_MISMATCH'));
    }

    let user = await User.findOne({ email: google.email.toLowerCase() });

    if (!user) {
      user = await User.create({
        name: google.name || google.email.split('@')[0],
        email: google.email.toLowerCase(),
        google_id: google.sub,
        avatar_url: google.picture,
        is_verified: true,
        role: 'student',
        student_profile: { onboarding_completed: false },
      });
    } else if (!user.google_id) {
      await User.findByIdAndUpdate(user._id, { google_id: google.sub, is_verified: true });
    }

    const tokens = authService.generateTokenPair(user);

    res.cookie('sv_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json(success({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        onboardingComplete: user.student_profile?.onboarding_completed || false,
      },
      tokens,
    }, 'Google auth successful'));
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE/POST /auth/logout - Clear session cookie
 */
export async function logout(req, res, next) {
  try {
    res.clearCookie('sv_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    res.json(success({ message: 'Logged out' }, 'LOGGED_OUT'));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/onboarding - Complete student onboarding (requires auth)
 */
export async function completeOnboarding(req, res, next) {
  try {
    const user = req.user;
    const { board, grade, className } = req.body;

    if (!board || !grade) {
      return res.status(400).json(error('Board and grade are required', 'VALIDATION_ERROR'));
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          'student_profile.board': board,
          'student_profile.grade': grade,
          'student_profile.class': className,
          'student_profile.onboarding_completed': true,
        },
      },
      { new: true }
    ).select('-password_hash -otp -password_reset_token');

    res.json(success({ user: updatedUser }, 'Onboarding completed'));
  } catch (err) {
    next(err);
  }
}

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

    res.cookie('sv_token', result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
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
