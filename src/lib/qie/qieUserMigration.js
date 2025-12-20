/**
 * QIE User Data Migration System
 * 
 * This module handles the migration of user data from Aptos to QIE network while:
 * 1. Preserving existing meta address relationships
 * 2. Updating payment links to use QIE generation
 * 3. Maintaining privacy across network transition
 * 
 * Requirements: 8.1, 8.2, 8.5
 */

import { supabase } from '../supabase.js';
import { generateMetaAddress, generateStealthAddress } from '../../utils/stealth-crypto.js';
import { generateQIEPaymentLink, validateQIEPaymentLink } from '../../utils/qie-payment-links.js';
import { QIE_CONFIG } from '../../config/qie-config.js';
import { ethers } from 'ethers';

/**
 * Migration status constants
 */
export const MIGRATION_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

/**
 * Main migration class for handling user data migration
 */
export class QIEUserMigration {
  constructor() {
    this.migrationLog = [];
  }

  /**
   * Migrate a single user from Aptos to QIE
   * @param {string} aptosAddress - User's Aptos wallet address
   * @param {string} qieAddress - User's QIE wallet address
   * @param {Object} options - Migration options
   * @returns {Object} Migration result
   */
  async migrateUser(aptosAddress, qieAddress, options = {}) {
    const { preserveMetaAddresses = true, updatePaymentLinks = true } = options;
    
    try {
      this.log(`Starting migration for user: ${aptosAddress} -> ${qieAddress}`);
      
      // Validate QIE address format
      if (!ethers.isAddress(qieAddress)) {
        throw new Error(`Invalid QIE address format: ${qieAddress}`);
      }
      
      // Get existing user data
      const userData = await this.getUserData(aptosAddress);
      if (!userData.user) {
        throw new Error(`User not found with Aptos address: ${aptosAddress}`);
      }
      
      // Start migration transaction
      const migrationResult = {
        userId: userData.user.id,
        aptosAddress,
        qieAddress,
        status: MIGRATION_STATUS.IN_PROGRESS,
        startedAt: new Date().toISOString(),
        steps: {}
      };
      
      // Step 1: Update user record with QIE address
      migrationResult.steps.userUpdate = await this.updateUserForQIE(userData.user, qieAddress);
      
      // Step 2: Migrate meta addresses if requested
      if (preserveMetaAddresses && userData.metaAddresses.length > 0) {
        migrationResult.steps.metaAddressMigration = await this.migrateMetaAddresses(
          userData.user.id,
          userData.metaAddresses,
          qieAddress
        );
      }
      
      // Step 3: Update payment links if requested
      if (updatePaymentLinks && userData.paymentLinks.length > 0) {
        migrationResult.steps.paymentLinkMigration = await this.migratePaymentLinks(
          userData.paymentLinks,
          qieAddress
        );
      }
      
      // Step 4: Create migration record
      migrationResult.steps.migrationRecord = await this.createMigrationRecord(migrationResult);
      
      migrationResult.status = MIGRATION_STATUS.COMPLETED;
      migrationResult.completedAt = new Date().toISOString();
      
      this.log(`Migration completed successfully for user: ${aptosAddress}`);
      return migrationResult;
      
    } catch (error) {
      this.log(`Migration failed for user ${aptosAddress}: ${error.message}`, 'error');
      return {
        aptosAddress,
        qieAddress,
        status: MIGRATION_STATUS.FAILED,
        error: error.message,
        failedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Get all user data from Aptos address
   * @param {string} aptosAddress - Aptos wallet address
   * @returns {Object} User data including meta addresses and payment links
   */
  async getUserData(aptosAddress) {
    try {
      // Get user record
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', aptosAddress)
        .single();
      
      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }
      
      // Get meta addresses (if table exists)
      let metaAddresses = [];
      try {
        const { data: metaData, error: metaError } = await supabase
          .from('meta_addresses')
          .select('*')
          .eq('user_address', aptosAddress);
        
        if (!metaError) {
          metaAddresses = metaData || [];
        }
      } catch (error) {
        // Meta addresses table might not exist yet
        this.log(`Meta addresses table not found or accessible: ${error.message}`, 'warn');
      }
      
      // Get payment links
      const { data: paymentLinks, error: linksError } = await supabase
        .from('payment_links')
        .select('*')
        .eq('wallet_address', aptosAddress);
      
      if (linksError) {
        throw linksError;
      }
      
      return {
        user,
        metaAddresses,
        paymentLinks: paymentLinks || []
      };
      
    } catch (error) {
      this.log(`Error getting user data: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Update user record with QIE address
   * @param {Object} user - Existing user record
   * @param {string} qieAddress - QIE wallet address
   * @returns {Object} Update result
   */
  async updateUserForQIE(user, qieAddress) {
    try {
      const updateData = {
        qie_address: qieAddress,
        last_qie_activity: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      this.log(`Updated user ${user.id} with QIE address: ${qieAddress}`);
      return {
        success: true,
        updatedUser: data,
        preservedData: {
          originalAddress: user.wallet_address,
          username: user.username,
          createdAt: user.created_at
        }
      };
      
    } catch (error) {
      this.log(`Error updating user: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Migrate meta addresses from Aptos to QIE format
   * @param {number} userId - User ID
   * @param {Array} aptosMetaAddresses - Existing Aptos meta addresses
   * @param {string} qieAddress - QIE wallet address
   * @returns {Object} Migration result
   */
  async migrateMetaAddresses(userId, aptosMetaAddresses, qieAddress) {
    try {
      const migratedAddresses = [];
      
      for (const aptosMetaAddr of aptosMetaAddresses) {
        // Generate new QIE-compatible meta address while preserving relationships
        const qieMetaAddress = this.convertAptosMetaAddressToQIE(aptosMetaAddr);
        
        // Create new meta address record for QIE
        const migrationData = {
          user_id: userId,
          qie_address: qieAddress,
          network: 'qie',
          qie_spend_pub_key: qieMetaAddress.spendPublicKey,
          qie_viewing_pub_key: qieMetaAddress.viewingPublicKey,
          // Preserve original Aptos data for reference
          original_aptos_spend_key: aptosMetaAddr.spend_public_key,
          original_aptos_viewing_key: aptosMetaAddr.viewing_public_key,
          original_aptos_address: aptosMetaAddr.aptos_address,
          migrated_at: new Date().toISOString(),
          created_at: aptosMetaAddr.created_at // Preserve original creation time
        };
        
        try {
          const { data, error } = await supabase
            .from('meta_addresses')
            .insert([migrationData])
            .select()
            .single();
          
          if (error) throw error;
          
          migratedAddresses.push({
            original: aptosMetaAddr,
            migrated: data,
            qieMetaAddress
          });
          
          this.log(`Migrated meta address ${aptosMetaAddr.id} to QIE format`);
          
        } catch (error) {
          this.log(`Error migrating meta address ${aptosMetaAddr.id}: ${error.message}`, 'error');
          // Continue with other addresses
        }
      }
      
      // Update user's meta address count
      await supabase
        .from('users')
        .update({ qie_meta_address_count: migratedAddresses.length })
        .eq('id', userId);
      
      return {
        success: true,
        migratedCount: migratedAddresses.length,
        totalCount: aptosMetaAddresses.length,
        migratedAddresses
      };
      
    } catch (error) {
      this.log(`Error migrating meta addresses: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Convert Aptos meta address to QIE format while preserving privacy relationships
   * @param {Object} aptosMetaAddr - Aptos meta address data
   * @returns {Object} QIE-compatible meta address
   */
  convertAptosMetaAddressToQIE(aptosMetaAddr) {
    // Generate new QIE-compatible meta address
    // This maintains privacy by creating new keys while preserving the relationship structure
    const qieMetaAddress = generateMetaAddress();
    
    // Add metadata to track the relationship
    qieMetaAddress.migratedFrom = {
      network: 'aptos',
      originalSpendKey: aptosMetaAddr.spend_public_key,
      originalViewingKey: aptosMetaAddr.viewing_public_key,
      migratedAt: new Date().toISOString()
    };
    
    return qieMetaAddress;
  }

  /**
   * Migrate payment links to use QIE generation
   * @param {Array} aptosPaymentLinks - Existing Aptos payment links
   * @param {string} qieAddress - QIE wallet address
   * @returns {Object} Migration result
   */
  async migratePaymentLinks(aptosPaymentLinks, qieAddress) {
    try {
      const migratedLinks = [];
      
      for (const aptosLink of aptosPaymentLinks) {
        // Generate new QIE payment link
        const qiePaymentLink = generateQIEPaymentLink(
          qieAddress,
          aptosLink.alias,
          {
            amount: aptosLink.amount,
            message: aptosLink.message || `Migrated from Aptos: ${aptosLink.alias}`
          }
        );
        
        // Validate the generated link
        const validation = validateQIEPaymentLink(qiePaymentLink);
        if (!validation.isValid) {
          this.log(`Invalid QIE payment link generated for ${aptosLink.alias}: ${validation.errors.join(', ')}`, 'error');
          continue;
        }
        
        // Update payment link record
        const updateData = {
          wallet_address: qieAddress,
          meta_address: JSON.stringify(qiePaymentLink.metaAddress),
          stealth_data: JSON.stringify(qiePaymentLink.stealthData),
          qr_data: JSON.stringify(qiePaymentLink.qrData),
          chain_id: qiePaymentLink.chainId,
          network: qiePaymentLink.network,
          // Preserve original data for reference
          original_aptos_address: aptosLink.wallet_address,
          migrated_at: new Date().toISOString()
        };
        
        try {
          const { data, error } = await supabase
            .from('payment_links')
            .update(updateData)
            .eq('id', aptosLink.id)
            .select()
            .single();
          
          if (error) throw error;
          
          migratedLinks.push({
            original: aptosLink,
            migrated: data,
            qiePaymentLink
          });
          
          this.log(`Migrated payment link: ${aptosLink.alias}`);
          
        } catch (error) {
          this.log(`Error migrating payment link ${aptosLink.alias}: ${error.message}`, 'error');
          // Continue with other links
        }
      }
      
      return {
        success: true,
        migratedCount: migratedLinks.length,
        totalCount: aptosPaymentLinks.length,
        migratedLinks
      };
      
    } catch (error) {
      this.log(`Error migrating payment links: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Create migration record for tracking
   * @param {Object} migrationResult - Migration result data
   * @returns {Object} Migration record
   */
  async createMigrationRecord(migrationResult) {
    try {
      const migrationRecord = {
        user_id: migrationResult.userId,
        aptos_address: migrationResult.aptosAddress,
        qie_address: migrationResult.qieAddress,
        migration_status: migrationResult.status,
        migration_data: JSON.stringify(migrationResult.steps),
        started_at: migrationResult.startedAt,
        completed_at: migrationResult.completedAt,
        created_at: new Date().toISOString()
      };
      
      // Create migration tracking table if it doesn't exist
      await this.ensureMigrationTable();
      
      const { data, error } = await supabase
        .from('user_migrations')
        .insert([migrationRecord])
        .select()
        .single();
      
      if (error) throw error;
      
      this.log(`Created migration record: ${data.id}`);
      return {
        success: true,
        migrationRecord: data
      };
      
    } catch (error) {
      this.log(`Error creating migration record: ${error.message}`, 'error');
      // Don't fail the entire migration for this
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Ensure migration tracking table exists
   */
  async ensureMigrationTable() {
    try {
      // This would typically be handled by database migrations
      // For now, we'll attempt to create the table if it doesn't exist
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS user_migrations (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          aptos_address VARCHAR(66),
          qie_address VARCHAR(42),
          migration_status VARCHAR(20),
          migration_data JSON,
          started_at TIMESTAMP,
          completed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          
          INDEX idx_user_migrations_user (user_id),
          INDEX idx_user_migrations_aptos (aptos_address),
          INDEX idx_user_migrations_qie (qie_address),
          INDEX idx_user_migrations_status (migration_status)
        );
      `;
      
      // Note: This would need to be executed via database admin tools
      // For now, we'll just log the requirement
      this.log('Migration table creation required - execute via database admin');
      
    } catch (error) {
      this.log(`Error ensuring migration table: ${error.message}`, 'warn');
    }
  }

  /**
   * Get migration status for a user
   * @param {string} aptosAddress - Aptos address
   * @returns {Object} Migration status
   */
  async getMigrationStatus(aptosAddress) {
    try {
      const { data, error } = await supabase
        .from('user_migrations')
        .select('*')
        .eq('aptos_address', aptosAddress)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data || { status: MIGRATION_STATUS.NOT_STARTED };
      
    } catch (error) {
      this.log(`Error getting migration status: ${error.message}`, 'error');
      return { status: MIGRATION_STATUS.NOT_STARTED };
    }
  }

  /**
   * Batch migrate multiple users
   * @param {Array} userMappings - Array of {aptosAddress, qieAddress} mappings
   * @param {Object} options - Migration options
   * @returns {Object} Batch migration results
   */
  async batchMigrateUsers(userMappings, options = {}) {
    const results = {
      total: userMappings.length,
      successful: 0,
      failed: 0,
      results: []
    };
    
    this.log(`Starting batch migration for ${userMappings.length} users`);
    
    for (const mapping of userMappings) {
      try {
        const result = await this.migrateUser(mapping.aptosAddress, mapping.qieAddress, options);
        
        if (result.status === MIGRATION_STATUS.COMPLETED) {
          results.successful++;
        } else {
          results.failed++;
        }
        
        results.results.push(result);
        
      } catch (error) {
        results.failed++;
        results.results.push({
          aptosAddress: mapping.aptosAddress,
          qieAddress: mapping.qieAddress,
          status: MIGRATION_STATUS.FAILED,
          error: error.message
        });
      }
    }
    
    this.log(`Batch migration completed: ${results.successful} successful, ${results.failed} failed`);
    return results;
  }

  /**
   * Validate migration integrity
   * @param {string} aptosAddress - Aptos address to validate
   * @returns {Object} Validation result
   */
  async validateMigrationIntegrity(aptosAddress) {
    try {
      const originalData = await this.getUserData(aptosAddress);
      const migrationStatus = await this.getMigrationStatus(aptosAddress);
      
      if (migrationStatus.status !== MIGRATION_STATUS.COMPLETED) {
        return {
          isValid: false,
          error: 'Migration not completed'
        };
      }
      
      // Get migrated user data
      const { data: migratedUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', originalData.user.id)
        .single();
      
      const validationChecks = {
        userPreserved: migratedUser && migratedUser.username === originalData.user.username,
        qieAddressSet: migratedUser && migratedUser.qie_address,
        originalAddressPreserved: migratedUser && migratedUser.wallet_address === aptosAddress
      };
      
      const isValid = Object.values(validationChecks).every(check => check);
      
      return {
        isValid,
        checks: validationChecks,
        migrationStatus,
        originalData,
        migratedUser
      };
      
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Log migration events
   * @param {string} message - Log message
   * @param {string} level - Log level (info, warn, error)
   */
  log(message, level = 'info') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message
    };
    
    this.migrationLog.push(logEntry);
    
    // Also log to console
    const logMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    logMethod(`[QIE Migration ${level.toUpperCase()}] ${message}`);
  }

  /**
   * Get migration logs
   * @returns {Array} Migration log entries
   */
  getMigrationLogs() {
    return this.migrationLog;
  }

  /**
   * Clear migration logs
   */
  clearLogs() {
    this.migrationLog = [];
  }
}

// Export singleton instance
export const qieUserMigration = new QIEUserMigration();

// Export utility functions
export {
  MIGRATION_STATUS
};

export default qieUserMigration;