import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import crypto from 'crypto';

const EASYPAISA_API = process.env.EASYPAISA_API_URL || 'https://mock.easypaisa.com.pk/api';
const JAZZCASH_API = process.env.JAZZCASH_API_URL || 'https://mock.jazzcash.com.pk/api';
const STUDENT_APP_URL = process.env.STUDENT_ORIGIN || 'http://localhost:3000';

export async function initializeCheckout(userId, planId, paymentMethod, plan) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  const transactionId = `SV_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const subscription = await Subscription.create({
    user_id: userId,
    plan: planId,
    status: 'pending',
    amount: plan.price,
    currency: 'PKR',
    payment_method: paymentMethod,
    transaction_id: transactionId,
    expires_at: expiresAt,
    metadata: {
      initiated_at: new Date(),
      payment_gateway: paymentMethod === 'easypaisa' ? 'EasyPaisa' : 'JazzCash',
    },
  });

  let paymentUrl = '';
  let paymentData = {};

  if (paymentMethod === 'easypaisa') {
    paymentUrl = `${EASYPAISA_API}/checkout?txn=${transactionId}&amount=${plan.price}`;
    paymentData = {
      method: 'easypaisa',
      redirect_url: `${STUDENT_APP_URL}/premium/success?txn=${transactionId}`,
      cancel_url: `${STUDENT_APP_URL}/premium/cancel`,
    };
  } else if (paymentMethod === 'jazzcash') {
    paymentUrl = `${JAZZCASH_API}/checkout?txn=${transactionId}&amount=${plan.price}`;
    paymentData = {
      method: 'jazzcash',
      redirect_url: `${STUDENT_APP_URL}/premium/success?txn=${transactionId}`,
      cancel_url: `${STUDENT_APP_URL}/premium/cancel`,
    };
  } else {
    const error = new Error('Unsupported payment method');
    error.code = 'UNSUPPORTED_PAYMENT_METHOD';
    throw error;
  }

  return {
    subscription: {
      id: subscription._id,
      plan: planId,
      planName: plan.name,
      amount: plan.price,
      currency: 'PKR',
      status: 'pending',
      expiresAt: expiresAt.toISOString(),
    },
    transactionId,
    redirectUrl: paymentUrl,
    paymentUrl,
    paymentData,
  };
}

export async function getSubscription(userId) {
  const user = await User.findById(userId).populate('subscription');
  if (!user) {
    const error = new Error('User not found');
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  const currentPlan = user.subscription?.plan || 'free';
  const isPremium = ['basic', 'premium', 'family'].includes(currentPlan);
  const expiresAt = user.subscription?.expires_at || null;
  const aiCreditsUsed = user.subscription?.ai_credits_used_today || 0;

  const planDetails = PLANS[currentPlan] || {
    name: 'Free',
    price: 0,
    features: ['Limited Access', '5 AI Credits/Day', 'Ads Supported'],
    aiCreditsPerDay: 5,
  };

  return {
    subscription: {
      currentPlan,
      planName: planDetails.name,
      isPremium,
      expiresAt,
      aiCreditsUsed,
      dailyLimit: planDetails.aiCreditsPerDay,
      features: planDetails.features,
    },
    availablePlans: Object.values(PLANS),
    currentPlan,
    planName: planDetails.name,
    isPremium,
    expiresAt,
    aiCreditsUsed,
    dailyLimit: planDetails.aiCreditsPerDay,
    features: planDetails.features,
  };
}

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
