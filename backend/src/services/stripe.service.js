import Stripe from 'stripe';
import { env } from '../config/env.js';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

/**
 * Create checkout session for subscription
 */
export async function createCheckoutSession(userId, priceId, successUrl, cancelUrl) {
  const user = await User.findById(userId);
  
  if (!user) {
    const error = new Error('User not found');
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: userId.toString()
    }
  });

  return session;
}

/**
 * Handle subscription created/updated event
 */
export async function handleSubscriptionCreated(subscriptionData) {
  const { id, customer, status, items, current_period_start, current_period_end } = subscriptionData;
  
  const email = typeof customer === 'string' 
    ? (await stripe.customers.retrieve(customer)).email 
    : customer.email;

  const user = await User.findOne({ email });
  
  if (!user) {
    console.error('User not found for subscription:', email);
    return null;
  }

  const subscriptionItem = items.data[0];
  const price = subscriptionItem.price;

  const subscription = await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: id },
    {
      user: user._id,
      stripeSubscriptionId: id,
      stripeCustomerId: typeof customer === 'string' ? customer : customer.id,
      status,
      plan: price.id,
      interval: price.recurring?.interval || 'month',
      currentPeriodStart: new Date(current_period_start * 1000),
      currentPeriodEnd: new Date(current_period_end * 1000)
    },
    { upsert: true, new: true }
  );

  // Update user's subscription status
  if (status === 'active') {
    user.subscriptionStatus = 'active';
    await user.save();
  }

  return subscription;
}

/**
 * Handle subscription updated event
 */
export async function handleSubscriptionUpdated(subscriptionData) {
  return handleSubscriptionCreated(subscriptionData);
}

/**
 * Handle subscription deleted/cancelled event
 */
export async function handleSubscriptionDeleted(subscriptionId) {
  const subscription = await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: subscriptionId },
    { status: 'canceled' }
  );

  if (subscription) {
    const user = await User.findById(subscription.user);
    if (user) {
      user.subscriptionStatus = 'canceled';
      await user.save();
    }
  }

  return subscription;
}

/**
 * Get user's subscription
 */
export async function getUserSubscription(userId) {
  const subscription = await Subscription.findOne({ user: userId })
    .sort({ createdAt: -1 });

  return subscription;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(payload, signature, endpointSecret) {
  try {
    return stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  } catch (err) {
    const error = new Error('Invalid webhook signature');
    error.code = 'INVALID_SIGNATURE';
    throw error;
  }
}

/**
 * Create customer portal session
 */
export async function createPortalSession(userId, returnUrl) {
  const subscription = await Subscription.findOne({ user: userId });
  
  if (!subscription || !subscription.stripeCustomerId) {
    const error = new Error('No active subscription found');
    error.code = 'NO_SUBSCRIPTION';
    throw error;
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: returnUrl
  });

  return session;
}
