/**
 * Tests for QIE Payment Link Generation Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  generateQIEPaymentLink,
  generateQRCodeData,
  parseQIEPaymentLink,
  generateStealthForPaymentLink,
  validateQIEPaymentLink,
  formatPaymentLinkDisplay,
  createShareableText
} from './qie-payment-links.js';
import { ethers } from 'ethers';

describe('QIE Payment Link Utilities', () => {
  const testAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
  const testAlias = 'test-payment';

  describe('generateQIEPaymentLink', () => {
    it('should generate valid QIE payment link', () => {
      const paymentLink = generateQIEPaymentLink(testAddress, testAlias);
      
      expect(paymentLink).toHaveProperty('alias', testAlias);
      expect(paymentLink).toHaveProperty('paymentUrl');
      expect(paymentLink).toHaveProperty('recipientAddress', testAddress);
      expect(paymentLink).toHaveProperty('metaAddress');
      expect(paymentLink).toHaveProperty('stealthData');
      expect(paymentLink).toHaveProperty('qrData');
      expect(paymentLink).toHaveProperty('chainId');
      expect(paymentLink).toHaveProperty('network');
      
      // Validate meta address structure
      expect(paymentLink.metaAddress).toHaveProperty('spendPrivateKey');
      expect(paymentLink.metaAddress).toHaveProperty('spendPublicKey');
      expect(paymentLink.metaAddress).toHaveProperty('viewingPrivateKey');
      expect(paymentLink.metaAddress).toHaveProperty('viewingPublicKey');
      
      // Validate stealth data structure
      expect(paymentLink.stealthData).toHaveProperty('stealthAddress');
      expect(paymentLink.stealthData).toHaveProperty('ephemeralPublicKey');
      expect(paymentLink.stealthData).toHaveProperty('viewHint');
      
      // Validate addresses are valid
      expect(ethers.isAddress(paymentLink.stealthData.stealthAddress)).toBe(true);
    });

    it('should generate payment link with amount and message', () => {
      const options = {
        amount: '1.5',
        message: 'Test payment'
      };
      
      const paymentLink = generateQIEPaymentLink(testAddress, testAlias, options);
      
      expect(paymentLink.amount).toBe('1.5');
      expect(paymentLink.message).toBe('Test payment');
      expect(paymentLink.qrData.amount).toBe('1.5');
      expect(paymentLink.qrData.message).toBe('Test payment');
    });
  });

  describe('generateQRCodeData', () => {
    it('should generate valid QR code data', () => {
      const params = {
        url: 'https://privatepay.me/test',
        stealthAddress: testAddress,
        amount: '1.0',
        message: 'Test payment',
        chainId: 35441
      };
      
      const qrData = generateQRCodeData(params);
      
      expect(qrData).toHaveProperty('uri');
      expect(qrData).toHaveProperty('url', params.url);
      expect(qrData).toHaveProperty('stealthAddress', testAddress);
      expect(qrData).toHaveProperty('amount', '1.0');
      expect(qrData).toHaveProperty('message', 'Test payment');
      expect(qrData).toHaveProperty('chainId', 35441);
      expect(qrData).toHaveProperty('displayText');
      
      // Validate EIP-681 URI format
      expect(qrData.uri).toMatch(/^ethereum:0x[a-fA-F0-9]{40}/);
      expect(qrData.uri).toContain('chainId=35441');
      expect(qrData.uri).toContain('value=');
    });

    it('should generate QR code data without optional parameters', () => {
      const params = {
        url: 'https://privatepay.me/test',
        stealthAddress: testAddress,
        chainId: 35441
      };
      
      const qrData = generateQRCodeData(params);
      
      expect(qrData.uri).toBe(`ethereum:${testAddress}?chainId=35441`);
      expect(qrData.amount).toBeUndefined();
      expect(qrData.message).toBeUndefined();
    });
  });

  describe('parseQIEPaymentLink', () => {
    it('should parse EIP-681 URI', () => {
      const uri = `ethereum:${testAddress}?chainId=35441&value=1000000000000000000`;
      const parsed = parseQIEPaymentLink(uri);
      
      expect(parsed).toHaveProperty('address', testAddress);
      expect(parsed).toHaveProperty('chainId', 35441);
      expect(parsed).toHaveProperty('amount', '1.0');
      expect(parsed).toHaveProperty('type', 'eip681_uri');
    });

    it('should parse regular payment URL', () => {
      const url = 'https://privatepay.me/test-alias';
      const parsed = parseQIEPaymentLink(url);
      
      expect(parsed).toHaveProperty('alias', 'test-alias');
      expect(parsed).toHaveProperty('url', url);
      expect(parsed).toHaveProperty('type', 'payment_link');
    });

    it('should return null for invalid URLs', () => {
      const parsed = parseQIEPaymentLink('invalid-url');
      expect(parsed).toBeNull();
    });
  });

  describe('validateQIEPaymentLink', () => {
    it('should validate correct payment link', () => {
      const paymentLink = generateQIEPaymentLink(testAddress, testAlias);
      const validation = validateQIEPaymentLink(paymentLink);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing alias', () => {
      const paymentLink = generateQIEPaymentLink(testAddress, testAlias);
      delete paymentLink.alias;
      
      const validation = validateQIEPaymentLink(paymentLink);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Payment link must have an alias');
    });

    it('should detect invalid recipient address', () => {
      const paymentLink = generateQIEPaymentLink(testAddress, testAlias);
      paymentLink.recipientAddress = 'invalid-address';
      
      const validation = validateQIEPaymentLink(paymentLink);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid recipient address');
    });

    it('should detect invalid amount', () => {
      const paymentLink = generateQIEPaymentLink(testAddress, testAlias, { amount: 'invalid' });
      
      const validation = validateQIEPaymentLink(paymentLink);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid amount format');
    });
  });

  describe('formatPaymentLinkDisplay', () => {
    it('should format payment link for display', () => {
      const paymentLink = generateQIEPaymentLink(testAddress, testAlias, {
        amount: '2.5',
        message: 'Test payment'
      });
      
      const display = formatPaymentLinkDisplay(paymentLink);
      
      expect(display).toHaveProperty('title', `${testAlias}.privatepay.me`);
      expect(display).toHaveProperty('subtitle', 'Test payment');
      expect(display).toHaveProperty('amount', '2.5 QIE');
      expect(display).toHaveProperty('stealthAddress');
      expect(display).toHaveProperty('shortAddress');
      expect(display).toHaveProperty('network', 'QIE Testnet');
      
      // Validate short address format
      expect(display.shortAddress).toMatch(/^0x[a-fA-F0-9]{4}\.\.\.[a-fA-F0-9]{4}$/);
    });

    it('should handle payment link without amount', () => {
      const paymentLink = generateQIEPaymentLink(testAddress, testAlias);
      const display = formatPaymentLinkDisplay(paymentLink);
      
      expect(display.amount).toBe('No amount specified');
    });
  });

  describe('createShareableText', () => {
    it('should create shareable text with all details', () => {
      const paymentLink = generateQIEPaymentLink(testAddress, testAlias, {
        amount: '1.0',
        message: 'Test payment'
      });
      
      const shareableText = createShareableText(paymentLink);
      
      expect(shareableText).toContain(`💰 ${testAlias}.privatepay.me`);
      expect(shareableText).toContain('Amount: 1.0 QIE');
      expect(shareableText).toContain('Message: Test payment');
      expect(shareableText).toContain('Network: QIE Testnet');
      expect(shareableText).toContain('Pay securely with stealth addresses');
    });

    it('should create shareable text without optional details', () => {
      const paymentLink = generateQIEPaymentLink(testAddress, testAlias);
      const shareableText = createShareableText(paymentLink);
      
      expect(shareableText).toContain(`💰 ${testAlias}.privatepay.me`);
      expect(shareableText).not.toContain('Amount:');
      expect(shareableText).not.toContain('Message:');
      expect(shareableText).toContain('Network: QIE Testnet');
    });
  });

  describe('generateStealthForPaymentLink', () => {
    it('should generate new stealth address for existing payment link', () => {
      const originalPaymentLink = generateQIEPaymentLink(testAddress, testAlias);
      const updatedPaymentLink = generateStealthForPaymentLink(originalPaymentLink);
      
      expect(updatedPaymentLink).toHaveProperty('stealthData');
      expect(updatedPaymentLink).toHaveProperty('qrData');
      expect(updatedPaymentLink).toHaveProperty('generatedAt');
      
      // Should have different stealth address than original
      expect(updatedPaymentLink.stealthData.stealthAddress)
        .not.toBe(originalPaymentLink.stealthData.stealthAddress);
      
      // Should maintain same meta address
      expect(updatedPaymentLink.metaAddress)
        .toEqual(originalPaymentLink.metaAddress);
    });

    it('should throw error for payment link without meta address', () => {
      const invalidPaymentLink = { alias: 'test' };
      
      expect(() => {
        generateStealthForPaymentLink(invalidPaymentLink);
      }).toThrow('Payment link must have meta address data');
    });
  });
});