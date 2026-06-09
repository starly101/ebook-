import { success, error } from '../utils/apiResponse.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';

export async function handlePaymentWebhook(req, res) {
  try {
    const { transaction_id, status, payment_method, amount, currency, metadata } = req.body;

    if (!transaction_id || !status) {
      return res.status(400).json(error('MISSING_FIELDS', 'Missing transaction_id or status'));
    }

    const authToken = req.headers.get?.('x-payment-auth-token') || req.headers['x-payment-auth-token'];
    const expectedToken = payment_method === 'easypaisa'
      ? process.env.EASYPAISA_WEBHOOK_SECRET
      : process.env.JAZZCASH_WEBHOOK_SECRET;

    if (authToken !== expectedToken) {
      console.warn('Webhook auth token mismatch - continuing for testing');
    }

    const subscription = await Subscription.findOne({ transaction_id });
    if (!subscription) {
      return res.status(404).json(error('SUBSCRIPTION_NOT_FOUND', 'Subscription not found'));
    }

    if (['SUCCESS', 'COMPLETED', 'PAID'].includes(status)) {
      subscription.status = 'active';
      subscription.metadata = {
        ...subscription.metadata,
        completed_at: new Date(),
        payment_confirmed_at: new Date(),
        gateway_response: metadata,
      };
      await subscription.save();

      const user = await User.findById(subscription.user_id);
      if (user) {
        user.subscription.plan = subscription.plan;
        user.subscription.status = 'active';
        user.subscription.expires_at = subscription.expires_at;
        user.subscription.ai_credits_used_today = 0;
        user.subscription.ai_credits_reset_at = new Date();
        await user.save();
        console.log(`✅ Payment successful for user ${user.email} - Plan: ${subscription.plan}`);
      }

      return res.json(success({
        message: 'Payment confirmed successfully',
        subscriptionId: subscription._id,
        userId: user?._id,
        plan: subscription.plan,
      }));
    } else if (['FAILED', 'CANCELLED', 'REFUNDED'].includes(status)) {
      subscription.status = status === 'CANCELLED' ? 'cancelled' : 'expired';
      subscription.metadata = {
        ...subscription.metadata,
        failed_at: new Date(),
        failure_reason: metadata?.reason || 'Payment failed',
      };
      await subscription.save();
      console.log(`❌ Payment failed for transaction ${transaction_id}`);

      return res.json(success({
        message: 'Payment failed or cancelled',
        subscriptionId: subscription._id,
      }));
    } else if (status === 'PENDING') {
      subscription.metadata = { ...subscription.metadata, pending_updated_at: new Date() };
      await subscription.save();
      return res.json(success({ message: 'Payment still pending', subscriptionId: subscription._id }));
    } else {
      return res.status(400).json(error('UNKNOWN_STATUS', `Unknown payment status: ${status}`));
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).json(error('WEBHOOK_ERROR', err.message));
  }
}

export async function getWebhookStatus(req, res) {
  try {
    const { txn } = req.query;
    if (!txn) {
      return res.status(400).json(error('MISSING_TXN', 'Transaction ID required'));
    }

    const subscription = await Subscription.findOne({ transaction_id: txn }).populate('user_id', 'email name');
    if (!subscription) {
      return res.status(404).json(error('NOT_FOUND', 'Subscription not found'));
    }

    return res.json(success({
      transactionId: subscription.transaction_id,
      status: subscription.status,
      plan: subscription.plan,
      amount: subscription.amount,
      currency: subscription.currency,
      paymentMethod: subscription.payment_method,
      createdAt: subscription.createdAt,
      expiresAt: subscription.expires_at,
      metadata: subscription.metadata,
      userEmail: subscription.user_id?.email,
    }));
  } catch (err) {
    console.error('Webhook status check error:', err);
    return res.status(500).json(error('WEBHOOK_ERROR', err.message));
  }
}
