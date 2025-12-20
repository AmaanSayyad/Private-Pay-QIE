/**
 * QIE Stealth Address Cryptographic Utilities
 * 
 * This module provides cryptographic functions for stealth address generation
 * and management on the QIE blockchain, which is EVM-compatible.
 * 
 * Key features:
 * - ECDH key exchange using secp256k1
 * - Stealth address generation for QIE (EVM format)
 * - Private key derivation for fund withdrawal
 * - Meta address management
 */

import * as secp256k1 from '@noble/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { randomBytes } from '@noble/hashes/utils.js';
import { ethers } from 'ethers';

/**
 * Generate a new secp256k1 key pair
 * @returns {Object} Key pair with privateKey and publicKey (compressed)
 */
export function generateKeyPair() {
  const privateKey = randomBytes(32);
  const publicKey = secp256k1.getPublicKey(privateKey, true); // compressed
  
  return {
    privateKey: ethers.hexlify(privateKey),
    publicKey: ethers.hexlify(publicKey)
  };
}

/**
 * Generate meta address (spend + viewing key pair)
 * @returns {Object} Meta address with spend and viewing key pairs
 */
export function generateMetaAddress() {
  const spendKeyPair = generateKeyPair();
  const viewingKeyPair = generateKeyPair();
  
  return {
    spendPrivateKey: spendKeyPair.privateKey,
    spendPublicKey: spendKeyPair.publicKey,
    viewingPrivateKey: viewingKeyPair.privateKey,
    viewingPublicKey: viewingKeyPair.publicKey
  };
}

/**
 * Compute ECDH shared secret between two keys
 * @param {string} privateKeyHex - Private key as hex string
 * @param {string} publicKeyHex - Public key as hex string (compressed)
 * @returns {string} Shared secret as hex string
 */
export function computeECDHSecret(privateKeyHex, publicKeyHex) {
  const privateKey = ethers.getBytes(privateKeyHex);
  const publicKey = ethers.getBytes(publicKeyHex);
  
  // Compute ECDH shared point
  const sharedPoint = secp256k1.getSharedSecret(privateKey, publicKey, true);
  
  // Hash the shared point to get the secret
  const secret = keccak_256(sharedPoint.slice(1)); // Remove 0x02/0x03 prefix
  
  return ethers.hexlify(secret);
}

/**
 * Generate stealth address from meta address and ephemeral key
 * @param {string} spendPublicKey - Recipient's spend public key (compressed)
 * @param {string} viewingPublicKey - Recipient's viewing public key (compressed)
 * @param {string} ephemeralPrivateKey - Sender's ephemeral private key (optional, generates if not provided)
 * @returns {Object} Stealth address data
 */
export function generateStealthAddress(spendPublicKey, viewingPublicKey, ephemeralPrivateKey = null) {
  // Generate ephemeral key pair if not provided
  const ephemeralKeyPair = ephemeralPrivateKey 
    ? {
        privateKey: ephemeralPrivateKey,
        publicKey: ethers.hexlify(secp256k1.getPublicKey(ethers.getBytes(ephemeralPrivateKey), true))
      }
    : generateKeyPair();
  
  // Compute shared secret using ephemeral private key and viewing public key
  const sharedSecret = computeECDHSecret(ephemeralKeyPair.privateKey, viewingPublicKey);
  
  // For simplicity, we'll use ethers to create a wallet from the shared secret
  // and derive the stealth address. In production, this would use proper point addition.
  const sharedSecretWallet = new ethers.Wallet(sharedSecret);
  const spendWallet = new ethers.Wallet(ethers.keccak256(spendPublicKey));
  
  // Simple stealth address derivation (simplified for demo)
  const combinedSecret = ethers.keccak256(
    ethers.concat([
      ethers.getBytes(sharedSecret),
      ethers.getBytes(spendPublicKey)
    ])
  );
  
  const stealthWallet = new ethers.Wallet(combinedSecret);
  const stealthAddress = stealthWallet.address;
  
  // Generate view hint (first byte of shared secret)
  const viewHint = parseInt(sharedSecret.slice(2, 4), 16);
  
  return {
    stealthAddress,
    stealthPublicKey: stealthWallet.publicKey,
    ephemeralPublicKey: ephemeralKeyPair.publicKey,
    ephemeralPrivateKey: ephemeralKeyPair.privateKey,
    sharedSecret,
    viewHint
  };
}

/**
 * Derive stealth private key for fund withdrawal
 * @param {string} spendPrivateKey - Recipient's spend private key
 * @param {string} ephemeralPublicKey - Sender's ephemeral public key
 * @param {string} viewingPrivateKey - Recipient's viewing private key
 * @returns {string} Stealth private key for withdrawal
 */
export function deriveStealthPrivateKey(spendPrivateKey, ephemeralPublicKey, viewingPrivateKey) {
  // Compute shared secret using viewing private key and ephemeral public key
  const sharedSecret = computeECDHSecret(viewingPrivateKey, ephemeralPublicKey);
  
  // Derive stealth private key using the same method as generateStealthAddress
  const spendPublicKey = ethers.hexlify(secp256k1.getPublicKey(ethers.getBytes(spendPrivateKey), true));
  
  const combinedSecret = ethers.keccak256(
    ethers.concat([
      ethers.getBytes(sharedSecret),
      ethers.getBytes(spendPublicKey)
    ])
  );
  
  return combinedSecret;
}

/**
 * Derive stealth private key from payment data (alternative method)
 * @param {Object} paymentData - Payment event data
 * @param {string} spendPrivateKey - Recipient's spend private key
 * @param {string} viewingPrivateKey - Recipient's viewing private key
 * @returns {string} Stealth private key for withdrawal
 */
export function deriveStealthPrivateKeyFromPayment(paymentData, spendPrivateKey, viewingPrivateKey) {
  const { ephemeralPubKey, stealthAddress, k } = paymentData;
  
  // Use the same derivation method but with payment-specific data
  const stealthPrivateKey = deriveStealthPrivateKey(spendPrivateKey, ephemeralPubKey, viewingPrivateKey);
  
  // Verify the derived key produces the correct stealth address
  const derivedWallet = new ethers.Wallet(stealthPrivateKey);
  if (derivedWallet.address.toLowerCase() !== stealthAddress.toLowerCase()) {
    throw new Error('Derived stealth private key does not match stealth address');
  }
  
  return stealthPrivateKey;
}

/**
 * Convert compressed public key to QIE address (EVM format)
 * @param {string} publicKeyHex - Compressed public key as hex string
 * @returns {string} QIE address (0x...)
 */
export function publicKeyToQIEAddress(publicKeyHex) {
  // Use ethers to convert public key to address
  // First, we need to get the uncompressed public key
  const publicKeyBytes = ethers.getBytes(publicKeyHex);
  
  let uncompressedKey;
  if (publicKeyBytes.length === 33) {
    // Compressed key - we'll use a simplified approach
    // In production, this would properly decompress the key
    const tempWallet = new ethers.Wallet(ethers.keccak256(publicKeyHex));
    return tempWallet.address;
  } else if (publicKeyBytes.length === 65) {
    // Already uncompressed - remove 0x04 prefix
    const keyWithoutPrefix = publicKeyBytes.slice(1);
    const hash = keccak_256(keyWithoutPrefix);
    const address = hash.slice(-20);
    return ethers.getAddress(ethers.hexlify(address));
  } else {
    throw new Error('Invalid public key length');
  }
}

/**
 * Validate QIE stealth address format
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid
 */
export function isValidStealthAddress(address) {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Check if a payment belongs to a meta address
 * @param {string} ephemeralPublicKey - Ephemeral public key from payment
 * @param {string} stealthAddress - Stealth address from payment
 * @param {string} viewingPrivateKey - Recipient's viewing private key
 * @param {string} spendPublicKey - Recipient's spend public key
 * @returns {boolean} True if payment belongs to this meta address
 */
export function checkPaymentOwnership(ephemeralPublicKey, stealthAddress, viewingPrivateKey, spendPublicKey) {
  try {
    // Generate what the stealth address should be using the same method
    const expectedStealthData = generateStealthAddress(spendPublicKey, 
      ethers.hexlify(secp256k1.getPublicKey(ethers.getBytes(viewingPrivateKey), true)));
    
    // For this simplified implementation, we'll check if we can derive the same address
    const sharedSecret = computeECDHSecret(viewingPrivateKey, ephemeralPublicKey);
    const combinedSecret = ethers.keccak256(
      ethers.concat([
        ethers.getBytes(sharedSecret),
        ethers.getBytes(spendPublicKey)
      ])
    );
    
    const expectedWallet = new ethers.Wallet(combinedSecret);
    return expectedWallet.address.toLowerCase() === stealthAddress.toLowerCase();
  } catch (error) {
    console.error('Error checking payment ownership:', error);
    return false;
  }
}

/**
 * Generate view hint for stealth address scanning
 * @param {string} sharedSecret - ECDH shared secret
 * @param {number} hintBytes - Number of bytes for hint (default: 1)
 * @returns {number} View hint value
 */
export function generateViewHint(sharedSecret, hintBytes = 1) {
  const secretBytes = ethers.getBytes(sharedSecret);
  let hint = 0;
  
  for (let i = 0; i < Math.min(hintBytes, secretBytes.length); i++) {
    hint = (hint << 8) | secretBytes[i];
  }
  
  return hint;
}

/**
 * Create a wallet instance from stealth private key
 * @param {string} stealthPrivateKey - Stealth private key
 * @param {Object} provider - Ethers provider (optional)
 * @returns {Object} Ethers wallet instance
 */
export function createStealthWallet(stealthPrivateKey, provider = null) {
  const wallet = new ethers.Wallet(stealthPrivateKey);
  
  if (provider) {
    return wallet.connect(provider);
  }
  
  return wallet;
}

// Export all functions as default
export default {
  generateKeyPair,
  generateMetaAddress,
  computeECDHSecret,
  generateStealthAddress,
  deriveStealthPrivateKey,
  deriveStealthPrivateKeyFromPayment,
  publicKeyToQIEAddress,
  isValidStealthAddress,
  checkPaymentOwnership,
  generateViewHint,
  createStealthWallet
};