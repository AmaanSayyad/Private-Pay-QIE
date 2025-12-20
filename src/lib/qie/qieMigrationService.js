/**
 * QIE Migration Service
 * 
 * Service layer for handling user data migration from Aptos to QIE
 * Integrates with existing QIE services and maintains data integrity
 */

import { qieUserMigration, MIGRATION_STATUS } from './qieUserMigration.js';
import { qieBlockchainService } from './qieBlockchainService.js';
import { qieEventMonitor } from './qieEventMonitor.js';
import { supabase } from '../supabase.js';
import { generateQIEPaymentLink } from '../../utils/qie-payment-links.js';
import { ethers } from 'ethers';

/**
 * Migration Service Class
 */
export class QIEMigrationService {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Initialize the migration service
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Ensure QIE services are initialized
      if (qieBlockchainService && typeof qieBlockchainService.initialize === 'function') {
        await qieBlockchainService.initialize();
      }
      
      this.isInitialized = true;
      console.log('QIE Migration Service initialized');
    } catch (error) {
      console.error('Error initializing QIE Migration Service:', error);
      throw error;
    }
  }

  /**
   * Check if user needs migration
   * @param {string} userAddress - User's current address
   * @returns {Promise<Object>} Migration check result
   */
  async checkMigrationNeeded(userAddress) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', userAddress)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (!user) {
        return {
          needed: false,
          reason: 'User not found'
        };
      }
      
      // Check if user has QIE address
      const hasQIEAddress = user.qie_address && ethers.isAddress(user.qie_address);
      
      return {
        needed: !hasQIEAddress,
        user,
        reason: hasQIEAddress ? 'Already migrated' : 'QIE address not set'
      };
      
    } catch (error) {
      console.error('Error checking migration status:', error);
      return {
        needed: false,
        error: error.message
      };
    }
  }

  /**
   * Get migration status for user
   * @param {string} aptosAddress - Aptos address
   * @returns {Promise<Object>} Migration status
   */
  async getMigrationStatus(aptosAddress) {
    try {
      return await qieUserMigration.getMigrationStatus(aptosAddress);
    } catch (error) {
      console.error('Error getting migration status:', error);
      return {
        status: MIGRATION_STATUS.NOT_STARTED,
        error: error.message
      };
    }
  }

  /**
   * Start migration process for user
   * @param {string} aptosAddress - Aptos address
   * @param {string} qieAddress - QIE address
   * @param {Object} options - Migration options
   * @returns {Promise<Object>} Migration result
   */
  async startMigration(aptosAddress, qieAddress, options = {}) {
    try {
      await this.initialize();
      
      // Validate addresses
      if (!aptosAddress) {
        throw new Error('Aptos address is required');
      }
      
      if (!qieAddress || !ethers.isAddress(qieAddress)) {
        throw new Error('Valid QIE address is required');
      }
      
      // Check if migration already exists
      const existingStatus = await this.getMigrationStatus(aptosAddress);
      if (existingStatus.migration_status === MIGRATION_STATUS.COMPLETED) {
        return {
          success: false,
          error: 'User has already been migrated',
          existingMigration: existingStatus
        };
      }
      
      // Start migration
      const migrationResult = await qieUserMigration.migrateUser(
        aptosAddress, 
        qieAddress, 
        {
          preserveMetaAddresses: options.preserveMetaAddresses !== false,
          updatePaymentLinks: options.updatePaymentLinks !== false
        }
      );
      
      // If migration successful, update QIE services
      if (migrationResult.status === MIGRATION_STATUS.COMPLETED) {
        await this.postMigrationSetup(qieAddress, migrationResult);
      }
      
      return {
        success: migrationResult.status === MIGRATION_STATUS.COMPLETED,
        result: migrationResult
      };
      
    } catch (error) {
      console.error('Error starting migration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Post-migration setup
   * @param {string} qieAddress - QIE address
   * @param {Object} migrationResult - Migration result
   */
  async postMigrationSetup(qieAddress, migrationResult) {
    try {
      // Start monitoring events for the new QIE address
      if (qieEventMonitor && typeof qieEventMonitor.addAddressToMonitor === 'function') {
        await qieEventMonitor.addAddressToMonitor(qieAddress);
      }
      
      // Update any cached data or services
      await this.updateServiceCaches(qieAddress, migrationResult);
      
      console.log(`Post-migration setup completed for ${qieAddress}`);
    } catch (error) {
      console.error('Error in post-migration setup:', error);
      // Don't fail the migration for post-setup errors
    }
  }

  /**
   * Update service caches after migration
   * @param {string} qieAddress - QIE address
   * @param {Object} migrationResult - Migration result
   */
  async updateServiceCaches(qieAddress, migrationResult) {
    try {
      // Clear any cached user data
      // This would depend on your caching implementation
      
      // Update balance service if needed
      // Update payment processor if needed
      
      console.log(`Service caches updated for ${qieAddress}`);
    } catch (error) {
      console.error('Error updating service caches:', error);
    }
  }

  /**
   * Validate migration integrity
   * @param {string} aptosAddress - Aptos address
   * @returns {Promise<Object>} Validation result
   */
  async validateMigration(aptosAddress) {
    try {
      return await qieUserMigration.validateMigrationIntegrity(aptosAddress);
    } catch (error) {
      console.error('Error validating migration:', error);
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Get user data for migration preview
   * @param {string} aptosAddress - Aptos address
   * @returns {Promise<Object>} User data summary
   */
  async getUserMigrationPreview(aptosAddress) {
    try {
      const userData = await qieUserMigration.getUserData(aptosAddress);
      
      return {
        user: userData.user,
        metaAddressCount: userData.metaAddresses.length,
        paymentLinkCount: userData.paymentLinks.length,
        hasData: userData.user !== null,
        migrationRecommendations: this.generateMigrationRecommendations(userData)
      };
      
    } catch (error) {
      console.error('Error getting migration preview:', error);
      return {
        hasData: false,
        error: error.message
      };
    }
  }

  /**
   * Generate migration recommendations
   * @param {Object} userData - User data
   * @returns {Array<string>} Recommendations
   */
  generateMigrationRecommendations(userData) {
    const recommendations = [];
    
    if (!userData.user) {
      recommendations.push('User account not found');
      return recommendations;
    }
    
    recommendations.push('Your username and account data will be preserved');
    
    if (userData.metaAddresses.length > 0) {
      recommendations.push(`${userData.metaAddresses.length} meta address(es) will be migrated to QIE format`);
      recommendations.push('Privacy relationships will be maintained across networks');
    }
    
    if (userData.paymentLinks.length > 0) {
      recommendations.push(`${userData.paymentLinks.length} payment link(s) will be updated for QIE network`);
      recommendations.push('Existing payment link aliases will continue to work');
    }
    
    recommendations.push('Historical Aptos transactions will remain accessible');
    recommendations.push('You can start receiving QIE payments immediately after migration');
    
    return recommendations;
  }

  /**
   * Batch migrate multiple users
   * @param {Array} userMappings - Array of {aptosAddress, qieAddress} mappings
   * @param {Object} options - Migration options
   * @returns {Promise<Object>} Batch migration results
   */
  async batchMigrateUsers(userMappings, options = {}) {
    try {
      await this.initialize();
      
      return await qieUserMigration.batchMigrateUsers(userMappings, options);
    } catch (error) {
      console.error('Error in batch migration:', error);
      return {
        total: userMappings.length,
        successful: 0,
        failed: userMappings.length,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * Get migration statistics
   * @returns {Promise<Object>} Migration statistics
   */
  async getMigrationStatistics() {
    try {
      const { data: stats, error } = await supabase
        .from('user_migrations')
        .select('migration_status')
        .then(result => {
          if (result.error) throw result.error;
          
          const statusCounts = result.data.reduce((acc, migration) => {
            acc[migration.migration_status] = (acc[migration.migration_status] || 0) + 1;
            return acc;
          }, {});
          
          return {
            data: {
              total: result.data.length,
              completed: statusCounts[MIGRATION_STATUS.COMPLETED] || 0,
              inProgress: statusCounts[MIGRATION_STATUS.IN_PROGRESS] || 0,
              failed: statusCounts[MIGRATION_STATUS.FAILED] || 0,
              notStarted: statusCounts[MIGRATION_STATUS.NOT_STARTED] || 0
            },
            error: null
          };
        });
      
      if (error) throw error;
      
      return stats;
    } catch (error) {
      console.error('Error getting migration statistics:', error);
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        failed: 0,
        notStarted: 0,
        error: error.message
      };
    }
  }

  /**
   * Rollback migration (if needed)
   * @param {string} aptosAddress - Aptos address
   * @returns {Promise<Object>} Rollback result
   */
  async rollbackMigration(aptosAddress) {
    try {
      // This would be a complex operation that reverses migration changes
      // For now, we'll just mark the migration as failed and log the request
      
      const { data, error } = await supabase
        .from('user_migrations')
        .update({
          migration_status: MIGRATION_STATUS.FAILED,
          error_message: 'Migration rolled back by user request',
          failed_at: new Date().toISOString()
        })
        .eq('aptos_address', aptosAddress)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log(`Migration rollback requested for ${aptosAddress}`);
      
      return {
        success: true,
        message: 'Migration marked for rollback. Manual intervention may be required.'
      };
      
    } catch (error) {
      console.error('Error rolling back migration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const qieMigrationService = new QIEMigrationService();

export default qieMigrationService;