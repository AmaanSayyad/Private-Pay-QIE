import { describe, it, expect } from 'vitest';
import { 
  getNetworkDisplayInfo, 
  determineTransactionNetwork, 
  formatTransactionAmount,
  getNetworkBadgeProps,
  isLegacyAptosTransaction 
} from './qie-utils.js';

describe('Network Distinction Utilities', () => {
  describe('getNetworkDisplayInfo', () => {
    it('should return QIE network info for qie network', () => {
      const info = getNetworkDisplayInfo('qie');
      expect(info.symbol).toBe('QIE');
      expect(info.name).toBe('QIE Network');
      expect(info.isEVM).toBe(true);
      expect(info.color).toBe('primary');
    });

    it('should return Aptos network info for aptos network', () => {
      const info = getNetworkDisplayInfo('aptos');
      expect(info.symbol).toBe('APT');
      expect(info.name).toBe('Aptos Network');
      expect(info.isEVM).toBe(false);
      expect(info.color).toBe('warning');
    });

    it('should default to QIE for unknown networks', () => {
      const info = getNetworkDisplayInfo('unknown');
      expect(info.symbol).toBe('QIE');
      expect(info.name).toBe('QIE Network');
    });
  });

  describe('determineTransactionNetwork', () => {
    it('should return explicit network when set', () => {
      const tx = { network: 'aptos' };
      expect(determineTransactionNetwork(tx)).toBe('aptos');
    });

    it('should detect QIE from QIE-specific fields', () => {
      const tx = { qie_transaction_hash: '0x123...' };
      expect(determineTransactionNetwork(tx)).toBe('qie');
    });

    it('should detect QIE from EVM address format', () => {
      const tx = { sender_address: '0x1234567890123456789012345678901234567890' };
      expect(determineTransactionNetwork(tx)).toBe('qie');
    });

    it('should detect legacy Aptos transactions by date', () => {
      const tx = { created_at: '2023-06-01T00:00:00Z' };
      expect(determineTransactionNetwork(tx)).toBe('aptos');
    });

    it('should default to QIE for new transactions', () => {
      const tx = { created_at: '2024-06-01T00:00:00Z' };
      expect(determineTransactionNetwork(tx)).toBe('qie');
    });
  });

  describe('formatTransactionAmount', () => {
    it('should format positive QIE amount', () => {
      const result = formatTransactionAmount(1.5, 'qie', true);
      expect(result).toBe('+1.5000 QIE');
    });

    it('should format negative Aptos amount', () => {
      const result = formatTransactionAmount(2.25, 'aptos', false);
      expect(result).toBe('-2.2500 APT');
    });

    it('should handle string amounts', () => {
      const result = formatTransactionAmount('0.1234', 'qie', true);
      expect(result).toBe('+0.1234 QIE');
    });
  });

  describe('getNetworkBadgeProps', () => {
    it('should return QIE badge props', () => {
      const props = getNetworkBadgeProps('qie');
      expect(props.label).toBe('QIE');
      expect(props.color).toBe('primary');
      expect(props.variant).toBe('flat');
      expect(props.size).toBe('sm');
    });

    it('should return Aptos badge props', () => {
      const props = getNetworkBadgeProps('aptos');
      expect(props.label).toBe('APTOS');
      expect(props.color).toBe('warning');
    });
  });

  describe('isLegacyAptosTransaction', () => {
    it('should identify Aptos transactions', () => {
      const tx = { network: 'aptos' };
      expect(isLegacyAptosTransaction(tx)).toBe(true);
    });

    it('should identify QIE transactions as not legacy', () => {
      const tx = { network: 'qie' };
      expect(isLegacyAptosTransaction(tx)).toBe(false);
    });

    it('should identify legacy transactions by date', () => {
      const tx = { created_at: '2023-06-01T00:00:00Z' };
      expect(isLegacyAptosTransaction(tx)).toBe(true);
    });
  });
});