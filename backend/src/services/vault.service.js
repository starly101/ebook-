import { UserVault } from '../models/UserVault.js';
import { Topic } from '../models/Topic.js';

/**
 * Get user's vault items
 */
export async function getUserVault(userId) {
  const vault = await UserVault.findOne({ user: userId })
    .populate('topics', 'title slug content book chapter');

  if (!vault) {
    // Create empty vault for user
    return await UserVault.create({ user: userId, topics: [] });
  }

  return vault;
}

/**
 * Add topic to vault
 */
export async function addToVault(userId, topicId) {
  const topic = await Topic.findById(topicId);
  if (!topic) {
    const error = new Error('Topic not found');
    error.code = 'TOPIC_NOT_FOUND';
    throw error;
  }

  let vault = await UserVault.findOne({ user: userId });

  if (!vault) {
    vault = await UserVault.create({ user: userId, topics: [topicId] });
  } else {
    // Check if already in vault
    if (vault.topics.includes(topicId)) {
      const error = new Error('Topic already in vault');
      error.code = 'ALREADY_IN_VAULT';
      throw error;
    }

    vault.topics.push(topicId);
    await vault.save();
  }

  return vault;
}

/**
 * Remove topic from vault
 */
export async function removeFromVault(userId, topicId) {
  const vault = await UserVault.findOne({ user: userId });

  if (!vault) {
    const error = new Error('Vault not found');
    error.code = 'VAULT_NOT_FOUND';
    throw error;
  }

  vault.topics = vault.topies.filter(id => id.toString() !== topicId);
  await vault.save();

  return vault;
}

/**
 * Check if topic is in vault
 */
export async function isInVault(userId, topicId) {
  const vault = await UserVault.findOne({ user: userId });

  if (!vault) {
    return false;
  }

  return vault.topics.some(id => id.toString() === topicId);
}

/**
 * Get vault statistics
 */
export async function getVaultStats(userId) {
  const vault = await UserVault.findOne({ user: userId });

  if (!vault) {
    return { topicCount: 0 };
  }

  return {
    topicCount: vault.topics.length
  };
}
