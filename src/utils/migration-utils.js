/**
 * Migration Utility Functions
 * 
 * Helper functions for user data migration from Aptos to QIE
 */

import { qieUserMigration, MIGRATION_STATUS } from '../lib/qie/qieUserMigration.js';
import { ethers } from 'ethers';

/**
 * Check if a user needs migration
 * @param {Object} user - User object
 * @returns {boolean} True if migration is needed
 */
export function needsMigration(user) {
  if (!user) return false;
  
  // User needs migration if they have an Aptos address but no QIE address
  return !!(user.wallet_address && !user.qie_address);
}

/**
 * Check if a user has completed migration
 * @param {Object} user - User object
 * @returns {boolean} True if migration is complete
 */
export function hasMigrated(user) {
  if (!user) return false;
  
  // User has migrated if they have both Aptos and QIE addresses
  return !!(user.wallet_address && user.qie_address);
}

/**
 * Get migration progress for a user
 * @param {string} aptosAddress - Aptos address
 * @returns {Promise<Object>} Migration progress data
 */
export async function getMigrationProgress(aptosAddress) {
  try {
    const status = await qieUserMigration.getMigrationStatus(aptosAddress);
    
    return {
      status: status.migration_status || MIGRATION_STATUS.NOT_STARTED,
      startedAt: status.started_at,
      completedAt: status.completed_at,
      steps: status.migration_data ? JSON.parse(status.migration_data) : {},
      hasStarted: status.migration_status !== MIGRATION_STATUS.NOT_STARTED,
      isComplete: status.migration_status === MIGRATION_STATUS.COMPLETED,
      hasFailed: status.migration_status === MIGRATION_STATUS.FAILED,
      error: status.error_message
    };
  } catch (error) {
    console.error('Error getting migration progress:', error);
    return {
      status: MIGRATION_STATUS.NOT_STARTED,
      hasStarted: false,
      isComplete: false,
      hasFailed: false
    };
  }
}

/**
 * Start user migration process
 * @param {string} aptosAddress - Aptos wallet address
 * @param {string} qieAddress - QIE wallet address
 * @param {Object} options - Migration options
 * @returns {Promise<Object>} Migration result
 */
export async function startMigration(aptosAddress, qieAddress, options = {}) {
  try {
    // Validate addresses
    if (!aptosAddress) {
      throw new Error('Aptos address is required');
    }
    
    if (!qieAddress || !ethers.isAddress(qieAddress)) {
      throw new Error('Valid QIE address is required');
    }
    
    // Check if migration already exists
    const existingStatus = await qieUserMigration.getMigrationStatus(aptosAddress);
    if (existingStatus.migration_status === MIGRATION_STATUS.COMPLETED) {
      return {
        success: false,
        error: 'User has already been migrated',
        existingMigration: existingStatus
      };
    }
    
    // Start migration
    const result = await qieUserMigration.migrateUser(aptosAddress, qieAddress, {
      preserveMetaAddresses: options.preserveMetaAddresses !== false,
      updatePaymentLinks: options.updatePaymentLinks !== false
    });
    
    return {
      success: result.status === MIGRATION_STATUS.COMPLETED,
      result
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
 * Validate migration integrity
 * @param {string} aptosAddress - Aptos address
 * @returns {Promise<Object>} Validation result
 */
export async function validateMigration(aptosAddress) {
  try {
    const validation = await qieUserMigration.validateMigrationIntegrity(aptosAddress);
    
    return {
      isValid: validation.isValid,
      checks: validation.checks,
      details: validation
    };
  } catch (error) {
    console.error('Error validating migration:', error);
    return {
      isValid: false,
      error: error.message
    };
  }
}

/**
 * Get user-friendly migration status message
 * @param {string} status - Migration status
 * @returns {string} User-friendly message
 */
export function getMigrationStatusMessage(status) {
  switch (status) {
    case MIGRATION_STATUS.NOT_STARTED:
      return 'Migration not started';
    case MIGRATION_STATUS.IN_PROGRESS:
      return 'Migration in progress...';
    case MIGRATION_STATUS.COMPLETED:
      return 'Migration completed successfully';
    case MIGRATION_STATUS.FAILED:
      return 'Migration failed';
    default:
      return 'Unknown migration status';
  }
}

/**
 * Get migration step description
 * @param {string} stepName - Step name
 * @returns {string} Step description
 */
export function getMigrationStepDescription(stepName) {
  const descriptions = {
    userUpdate: 'Updating user account with QIE address',
    metaAddressMigration: 'Migrating meta addresses to QIE format',
    paymentLinkMigration: 'Updating payment links for QIE network',
    migrationRecord: 'Creating migration record'
  };
  
  return descriptions[stepName] || stepName;
}

/**
 * Calculate migration progress percentage
 * @param {Object} migrationData - Migration data
 * @returns {number} Progress percentage (0-100)
 */
export function calculateMigrationProgress(migrationData) {
  if (!migrationData || !migrationData.steps) return 0;
  
  const totalSteps = 4; // userUpdate, metaAddressMigration, paymentLinkMigration, migrationRecord
  const completedSteps = Object.keys(migrationData.steps).length;
  
  return Math.round((completedSteps / totalSteps) * 100);
}

/**
 * Format migration timestamp
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted timestamp
 */
export function formatMigrationTimestamp(timestamp) {
  if (!timestamp) return 'N/A';
  
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch (error) {
    return timestamp;
  }
}

/**
 * Get migration summary for display
 * @param {Object} migrationResult - Migration result
 * @returns {Object} Summary data
 */
export function getMigrationSummary(migrationResult) {
  if (!migrationResult) return null;
  
  const summary = {
    status: migrationResult.status,
    statusMessage: getMigrationStatusMessage(migrationResult.status),
    startedAt: formatMigrationTimestamp(migrationResult.startedAt),
    completedAt: formatMigrationTimestamp(migrationResult.completedAt),
    progress: calculateMigrationProgress(migrationResult),
    steps: []
  };
  
  if (migrationResult.steps) {
    Object.entries(migrationResult.steps).forEach(([stepName, stepData]) => {
      summary.steps.push({
        name: stepName,
        description: getMigrationStepDescription(stepName),
        success: stepData.success,
        details: stepData
      });
    });
  }
  
  return summary;
}

/**
 * Check if payment link needs migration
 * @param {Object} paymentLink - Payment link object
 * @returns {boolean} True if migration is needed
 */
export function paymentLinkNeedsMigration(paymentLink) {
  if (!paymentLink) return false;
  
  // Payment link needs migration if it doesn't have QIE data
  return !paymentLink.chain_id || !paymentLink.network || paymentLink.network !== 'QIE Testnet';
}

/**
 * Get migration recommendations
 * @param {Object} userData - User data
 * @returns {Array<string>} Recommendations
 */
export function getMigrationRecommendations(userData) {
  const recommendations = [];
  
  if (!userData) return recommendations;
  
  if (userData.metaAddresses && userData.metaAddresses.length > 0) {
    recommendations.push('Your meta addresses will be migrated to QIE format while preserving privacy');
  }
  
  if (userData.paymentLinks && userData.paymentLinks.length > 0) {
    recommendations.push(`${userData.paymentLinks.length} payment link(s) will be updated to use QIE network`);
  }
  
  if (userData.payments && userData.payments.length > 0) {
    recommendations.push('Historical Aptos transactions will remain accessible for reference');
  }
  
  recommendations.push('Your username and account data will be preserved');
  recommendations.push('You can continue using your existing payment links after migration');
  
  return recommendations;
}

/**
 * Export migration logs
 * @returns {string} Migration logs as text
 */
export function exportMigrationLogs() {
  const logs = qieUserMigration.getMigrationLogs();
  
  if (logs.length === 0) {
    return 'No migration logs available';
  }
  
  return logs.map(log => 
    `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
  ).join('\n');
}

/**
 * Clear migration logs
 */
export function clearMigrationLogs() {
  qieUserMigration.clearLogs();
}

export default {
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
  getMigrationRecommendations,
  exportMigrationLogs,
  clearMigrationLogs
};
