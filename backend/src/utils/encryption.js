const crypto = require('crypto');
const env = require('../config/env');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT = 'crt-versant-ai-salt-2024';

// Derive a 32-byte key from JWT_SECRET_KEY
function getMasterKey() {
  const secret = env.JWT_SECRET_KEY || 'versant-default-secret-key-2024';
  return crypto.scryptSync(secret, SALT, 32);
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 */
function encryptText(text) {
  if (!text || typeof text !== 'string') return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getMasterKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

/**
 * Decrypt ciphertext using AES-256-GCM
 */
function decryptText(encryptedHex, ivHex, tagHex) {
  if (!encryptedHex || !ivHex || !tagHex) return null;
  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      getMasterKey(),
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('[Encryption] Decryption failed:', error.message);
    return null;
  }
}

/**
 * Mask an API key for safe frontend display (e.g., ••••••••••••xyz1)
 */
function maskApiKey(key) {
  if (!key || typeof key !== 'string') return '';
  const trimmed = key.trim();
  if (trimmed.length <= 4) return '••••';
  const last4 = trimmed.slice(-4);
  return `••••••••••••${last4}`;
}

module.exports = {
  encryptText,
  decryptText,
  maskApiKey
};

