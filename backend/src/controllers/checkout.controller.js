import { success, error } from '../utils/apiResponse.js';
import * as checkoutService from '../services/checkout.service.js';

const PLANS = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 500,
    features: ['Unlimited AI Explanations', 'Basic Progress Tracking', 'Ad-free Experience'],
    aiCreditsPerDay: 50,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 1200,
    features: ['Unlimited AI Everything', 'Advanced Analytics', 'Downloadable Content', 'Priority Support', 'Family Plan (3 users)'],
    aiCreditsPerDay: -1,
  },
  family: {
    id: 'family',
    name: 'Family',
    price: 2500,
    features: ['Everything in Premium', 'Up to 5 Family Members', 'Parent Dashboard', 'Progress Reports'],
    aiCreditsPerDay: -1,
  },
};

export async function initializeCheckout(req, res, next) {
  try {
    const userId = req.user._id;
    const { planId, paymentMethod } = req.body;

    if (!planId || !paymentMethod) {
      return res.status(400).json(error('MISSING_FIELDS', 'Missing required fields: planId, paymentMethod'));
    }

    const plan = PLANS[planId];
    if (!plan) {
      return res.status(400).json(error('INVALID_PLAN', 'Invalid plan selected'));
    }

    const result = await checkoutService.initializeCheckout(userId, planId, paymentMethod, plan);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getSubscription(req, res, next) {
  try {
    const userId = req.user._id;
    const result = await checkoutService.getSubscription(userId);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}
