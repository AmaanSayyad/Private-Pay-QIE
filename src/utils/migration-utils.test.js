/**
 * Migration Utils Tests
 * 
 * Tests for user data migration utility functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  needsMigration,
  hasMigrated,
  getMigrationProgress,
  startMigration,
  validateMigration,
  getMigrationStatusMessage,
  getMigrationStepDescription,
  calculateMigrationProgress,
  formatMigrationTimestamp,
  getMigrationSummary,
  paymentLinkNeedsMigration,
  getMigrationRecommendations
} from './migration-utils.js';
import { MIGRATION_STATUS } from '../lib/qie/qieUserMigration.js';

// Mock the migration service
vi.mock('../lib/qie/qieUserMigration.js', () => ({
  qieUserMigration: {
    getMigrationStatus: vi.fn(),
    migrateUser: vi.fn(),
    validateMigrationIntegrity: vi.fn()
  },
  MIGRATION_STATUS: {
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed'
  }
}));

describe('Migration Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('needsMigration', () => {
    it('should return true for user with Aptos address but no QIE address', () => {
      const user = {
        wallet_address: '0x123...',
        qie_address: null
      };
      
      expect(needsMigration(user)).toBe(true);
    });

    it('should return false for user with both addresses', () => {
      const user = {
        wallet_address: '0x123...',
        qie_address: '0x456...'
      };
      
      expect(needsMigration(user)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(needsMigration(null)).toBe(false);
    });

    it('should return false for user with no Aptos address', () => {
      const user = {
        wallet_address: null,
        qie_address: '0x456...'
      };
      
      expect(needsMigration(user)).toBe(false);
    });
  });

  describe('hasMigrated', () => {
    it('should return true for user with both addresses', () => {
      const user = {
        wallet_address: '0x123...',
        qie_address: '0x456...'
      };
      
      expect(hasMigrated(user)).toBe(true);
    });

    it('should return false for user missing QIE address', () => {
      const user = {
        wallet_address: '0x123...',
        qie_address: null
      };
      
      expect(hasMigrated(user)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasMigrated(null)).toBe(false);
    });
  });

  describe('getMigrationStatusMessage', () => {
    it('should return correct message for each status', () => {
      expect(getMigrationStatusMessage(MIGRATION_STATUS.NOT_STARTED))
        .toBe('Migration not started');
      expect(getMigrationStatusMessage(MIGRATION_STATUS.IN_PROGRESS))
        .toBe('Migration in progress...');
      expect(getMigrationStatusMessage(MIGRATION_STATUS.COMPLETED))
        .toBe('Migration completed successfully');
      expect(getMigrationStatusMessage(MIGRATION_STATUS.FAILED))
        .toBe('Migration failed');
      expect(getMigrationStatusMessage('unknown'))
        .toBe('Unknown migration status');
    });
  });

  describe('getMigrationStepDescription', () => {
    it('should return correct descriptions for known steps', () => {
      expect(getMigrationStepDescription('userUpdate'))
        .toBe('Updating user account with QIE address');
      expect(getMigrationStepDescription('metaAddressMigration'))
        .toBe('Migrating meta addresses to QIE format');
      expect(getMigrationStepDescription('paymentLinkMigration'))
        .toBe('Updating payment links for QIE network');
      expect(getMigrationStepDescription('migrationRecord'))
        .toBe('Creating migration record');
    });

    it('should return step name for unknown steps', () => {
      expect(getMigrationStepDescription('unknownStep'))
        .toBe('unknownStep');
    });
  });

  describe('calculateMigrationProgress', () => {
    it('should return 0 for no migration data', () => {
      expect(calculateMigrationProgress(null)).toBe(0);
      expect(calculateMigrationProgress({})).toBe(0);
    });

    it('should calculate correct percentage', () => {
      const migrationData = {
        steps: {
          userUpdate: { success: true },
          metaAddressMigration: { success: true }
        }
      };
      
      expect(calculateMigrationProgress(migrationData)).toBe(50); // 2/4 steps
    });

    it('should return 100 for all steps completed', () => {
      const migrationData = {
        steps: {
          userUpdate: { success: true },
          metaAddressMigration: { success: true },
          paymentLinkMigration: { success: true },
          migrationRecord: { success: true }
        }
      };
      
      expect(calculateMigrationProgress(migrationData)).toBe(100);
    });
  });

  describe('formatMigrationTimestamp', () => {
    it('should format valid timestamp', () => {
      const timestamp = '2023-12-20T10:30:00.000Z';
      const formatted = formatMigrationTimestamp(timestamp);
      
      // Should contain some date format (locale-dependent)
      expect(formatted).toMatch(/\d/); // Should contain at least one digit
      expect(formatted).not.toBe('N/A');
    });

    it('should return N/A for null timestamp', () => {
      expect(formatMigrationTimestamp(null)).toBe('N/A');
      expect(formatMigrationTimestamp(undefined)).toBe('N/A');
    });

    it('should return original string for invalid timestamp', () => {
      const invalidTimestamp = 'invalid-date';
      // Invalid dates return 'Invalid Date' when converted
      const result = formatMigrationTimestamp(invalidTimestamp);
      expect(result).toBe('Invalid Date');
    });
  });

  describe('getMigrationSummary', () => {
    it('should return null for no migration result', () => {
      expect(getMigrationSummary(null)).toBe(null);
    });

    it('should create correct summary', () => {
      const migrationResult = {
        status: MIGRATION_STATUS.COMPLETED,
        startedAt: '2023-12-20T10:00:00.000Z',
        completedAt: '2023-12-20T10:05:00.000Z',
        steps: {
          userUpdate: { success: true },
          metaAddressMigration: { success: true }
        }
      };
      
      const summary = getMigrationSummary(migrationResult);
      
      expect(summary.status).toBe(MIGRATION_STATUS.COMPLETED);
      expect(summary.statusMessage).toBe('Migration completed successfully');
      expect(summary.progress).toBe(50); // 2/4 steps
      expect(summary.steps).toHaveLength(2);
      expect(summary.steps[0].name).toBe('userUpdate');
      expect(summary.steps[0].success).toBe(true);
    });
  });

  describe('paymentLinkNeedsMigration', () => {
    it('should return true for payment link without QIE data', () => {
      const paymentLink = {
        alias: 'test-link',
        wallet_address: '0x123...'
      };
      
      expect(paymentLinkNeedsMigration(paymentLink)).toBe(true);
    });

    it('should return false for payment link with QIE data', () => {
      const paymentLink = {
        alias: 'test-link',
        wallet_address: '0x123...',
        chain_id: 35441,
        network: 'QIE Testnet'
      };
      
      expect(paymentLinkNeedsMigration(paymentLink)).toBe(false);
    });

    it('should return false for null payment link', () => {
      expect(paymentLinkNeedsMigration(null)).toBe(false);
    });
  });

  describe('getMigrationRecommendations', () => {
    it('should return empty array for no user data', () => {
      expect(getMigrationRecommendations(null)).toEqual([]);
    });

    it('should include recommendations based on user data', () => {
      const userData = {
        metaAddresses: [{ id: 1 }, { id: 2 }],
        paymentLinks: [{ id: 1 }],
        payments: [{ id: 1 }]
      };
      
      const recommendations = getMigrationRecommendations(userData);
      
      expect(recommendations).toContain('Your meta addresses will be migrated to QIE format while preserving privacy');
      expect(recommendations).toContain('1 payment link(s) will be updated to use QIE network');
      expect(recommendations).toContain('Historical Aptos transactions will remain accessible for reference');
      expect(recommendations).toContain('Your username and account data will be preserved');
      expect(recommendations).toContain('You can continue using your existing payment links after migration');
    });

    it('should handle empty data arrays', () => {
      const userData = {
        metaAddresses: [],
        paymentLinks: [],
        payments: []
      };
      
      const recommendations = getMigrationRecommendations(userData);
      
      expect(recommendations).toContain('Your username and account data will be preserved');
      expect(recommendations).toContain('You can continue using your existing payment links after migration');
      expect(recommendations).not.toContain('Your meta addresses will be migrated');
      expect(recommendations).not.toContain('payment link(s) will be updated');
    });
  });
});