/**
 * Tests for QIE Stealth Address Cryptographic Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  generateKeyPair,
  generateMetaAddress,
  computeECDHSecret,
  generateStealthAddress,
  deriveStealthPrivateKey,
  publicKeyToQIEAddress,
  isValidStealthAddress,
  checkPaymentOwnership,
  generateViewHint,
  createStealthWallet
} from './stealth-crypto.js';

describe('QIE Stealth Crypto Utilities', () => {
  describe('generateKeyPair', () => {
    it('should generate valid secp256k1 key pairs', () => {
      const keyPair = generateKeyPair();
      
      expect(keyPair).toHaveProperty('privateKey');
      expect(keyPair).toHaveProperty('publicKey');
      expect(keyPair.privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(keyPair.publicKey).toMatch(/^0x[a-fA-F0-9]{66}$/); // compressed
    });

    it('should generate different key pairs each time', () => {
      const keyPair1 = generateKeyPair();
      const keyPair2 = generateKeyPair();
      
      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
    });
  });

  describe('generateMetaAddress', () => {
    it('should generate valid meta address with spend and viewing keys', () => {
      const metaAddress = generateMetaAddress();
      
      expect(metaAddress).toHaveProperty('spendPrivateKey');
      expect(metaAddress).toHaveProperty('spendPublicKey');
      expect(metaAddress).toHaveProperty('viewingPrivateKey');
      expect(metaAddress).toHaveProperty('viewingPublicKey');
      
      // All keys should be valid hex strings
      expect(metaAddress.spendPrivateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(metaAddress.spendPublicKey).toMatch(/^0x[a-fA-F0-9]{66}$/);
      expect(metaAddress.viewingPrivateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(metaAddress.viewingPublicKey).toMatch(/^0x[a-fA-F0-9]{66}$/);
    });
  });

  describe('computeECDHSecret', () => {
    it('should compute consistent shared secrets', () => {
      const alice = generateKeyPair();
      const bob = generateKeyPair();
      
      const secretAlice = computeECDHSecret(alice.privateKey, bob.publicKey);
      const secretBob = computeECDHSecret(bob.privateKey, alice.publicKey);
      
      expect(secretAlice).toBe(secretBob);
      expect(secretAlice).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });
  });

  describe('publicKeyToQIEAddress', () => {
    it('should convert public key to valid QIE address', () => {
      const keyPair = generateKeyPair();
      const address = publicKeyToQIEAddress(keyPair.publicKey);
      
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(isValidStealthAddress(address)).toBe(true);
    });
  });

  describe('generateStealthAddress', () => {
    it('should generate valid stealth address', () => {
      const metaAddress = generateMetaAddress();
      const stealthData = generateStealthAddress(
        metaAddress.spendPublicKey,
        metaAddress.viewingPublicKey
      );
      
      expect(stealthData).toHaveProperty('stealthAddress');
      expect(stealthData).toHaveProperty('ephemeralPublicKey');
      expect(stealthData).toHaveProperty('viewHint');
      
      expect(isValidStealthAddress(stealthData.stealthAddress)).toBe(true);
      expect(stealthData.ephemeralPublicKey).toMatch(/^0x[a-fA-F0-9]{66}$/);
      expect(typeof stealthData.viewHint).toBe('number');
    });
  });

  describe('deriveStealthPrivateKey', () => {
    it('should derive correct stealth private key for withdrawal', () => {
      const metaAddress = generateMetaAddress();
      const stealthData = generateStealthAddress(
        metaAddress.spendPublicKey,
        metaAddress.viewingPublicKey
      );
      
      const stealthPrivateKey = deriveStealthPrivateKey(
        metaAddress.spendPrivateKey,
        stealthData.ephemeralPublicKey,
        metaAddress.viewingPrivateKey
      );
      
      expect(stealthPrivateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
      
      // Basic validation that we got a valid private key
      expect(stealthPrivateKey.length).toBe(66); // 0x + 64 hex chars
    });
  });

  describe('checkPaymentOwnership', () => {
    it('should correctly identify payment ownership', () => {
      const metaAddress = generateMetaAddress();
      const stealthData = generateStealthAddress(
        metaAddress.spendPublicKey,
        metaAddress.viewingPublicKey
      );
      
      const isOwner = checkPaymentOwnership(
        stealthData.ephemeralPublicKey,
        stealthData.stealthAddress,
        metaAddress.viewingPrivateKey,
        metaAddress.spendPublicKey
      );
      
      expect(isOwner).toBe(true);
    });

    it('should reject payments not belonging to meta address', () => {
      const metaAddress1 = generateMetaAddress();
      const metaAddress2 = generateMetaAddress();
      
      const stealthData = generateStealthAddress(
        metaAddress1.spendPublicKey,
        metaAddress1.viewingPublicKey
      );
      
      const isOwner = checkPaymentOwnership(
        stealthData.ephemeralPublicKey,
        stealthData.stealthAddress,
        metaAddress2.viewingPrivateKey, // Wrong viewing key
        metaAddress2.spendPublicKey      // Wrong spend key
      );
      
      expect(isOwner).toBe(false);
    });
  });

  describe('generateViewHint', () => {
    it('should generate consistent view hints', () => {
      const sharedSecret = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const hint1 = generateViewHint(sharedSecret);
      const hint2 = generateViewHint(sharedSecret);
      
      expect(hint1).toBe(hint2);
      expect(typeof hint1).toBe('number');
      expect(hint1).toBeGreaterThanOrEqual(0);
      expect(hint1).toBeLessThan(256); // 1 byte hint
    });
  });

  describe('createStealthWallet', () => {
    it('should create valid wallet from stealth private key', () => {
      const keyPair = generateKeyPair();
      const wallet = createStealthWallet(keyPair.privateKey);
      
      expect(wallet).toHaveProperty('address');
      expect(wallet).toHaveProperty('privateKey');
      expect(isValidStealthAddress(wallet.address)).toBe(true);
    });
  });
});