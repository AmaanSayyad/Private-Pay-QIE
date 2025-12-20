/**
 * QIE User Migration Example
 * 
 * This example demonstrates how to use the QIE user migration system
 * to migrate user data from Aptos to QIE network.
 */

import { qieMigrationService } from '../lib/qie/qieMigrationService.js';
import { 
  needsMigration, 
  startMigration, 
  getMigrationProgress,
  validateMigration 
} from '../utils/migration-utils.js';

/**
 * Example: Check if user needs migration
 */
async function checkUserMigrationStatus() {
  const user = {
    id: 1,
    username: 'alice',
    wallet_address: '0x1234567890abcdef1234567890abcdef12345678', // Aptos address
    qie_address: null, // No QIE address yet
    created_at: '2023-01-01T00:00:00.000Z'
  };
  
  console.log('=== User Migration Status Check ===');
  console.log('User:', user.username);
  console.log('Aptos Address:', user.wallet_address);
  console.log('QIE Address:', user.qie_address || 'Not set');
  console.log('Needs Migration:', needsMigration(user));
  
  return user;
}

/**
 * Example: Start migration process
 */
async function startUserMigration() {
  const aptosAddress = '0x1234567890abcdef1234567890abcdef12345678';
  const qieAddress = '0x742d35Cc6634C0532925a3b8D4C9db96DfB0b4C9'; // Valid EVM address
  
  console.log('\n=== Starting Migration ===');
  console.log('From Aptos:', aptosAddress);
  console.log('To QIE:', qieAddress);
  
  try {
    // Check migration status first
    const migrationCheck = await qieMigrationService.checkMigrationNeeded(aptosAddress);
    console.log('Migration Check:', migrationCheck);
    
    if (!migrationCheck.needed) {
      console.log('Migration not needed:', migrationCheck.reason);
      return;
    }
    
    // Get migration preview
    const preview = await qieMigrationService.getUserMigrationPreview(aptosAddress);
    console.log('Migration Preview:', preview);
    
    // Start migration
    const migrationResult = await startMigration(aptosAddress, qieAddress, {
      preserveMetaAddresses: true,
      updatePaymentLinks: true
    });
    
    console.log('Migration Result:', migrationResult);
    
    if (migrationResult.success) {
      console.log('✅ Migration completed successfully!');
      
      // Validate migration
      const validation = await validateMigration(aptosAddress);
      console.log('Migration Validation:', validation);
      
      if (validation.isValid) {
        console.log('✅ Migration validation passed!');
      } else {
        console.log('❌ Migration validation failed:', validation.error);
      }
    } else {
      console.log('❌ Migration failed:', migrationResult.error);
    }
    
  } catch (error) {
    console.error('Migration error:', error);
  }
}

/**
 * Example: Monitor migration progress
 */
async function monitorMigrationProgress() {
  const aptosAddress = '0x1234567890abcdef1234567890abcdef12345678';
  
  console.log('\n=== Migration Progress Monitoring ===');
  
  try {
    const progress = await getMigrationProgress(aptosAddress);
    
    console.log('Status:', progress.status);
    console.log('Progress:', progress.progress + '%');
    console.log('Started At:', progress.startedAt || 'Not started');
    console.log('Completed At:', progress.completedAt || 'Not completed');
    
    if (progress.steps && Object.keys(progress.steps).length > 0) {
      console.log('\nMigration Steps:');
      Object.entries(progress.steps).forEach(([stepName, stepData]) => {
        const status = stepData.success ? '✅' : '❌';
        console.log(`  ${status} ${stepName}: ${stepData.success ? 'Completed' : 'Failed'}`);
      });
    }
    
    if (progress.error) {
      console.log('Error:', progress.error);
    }
    
  } catch (error) {
    console.error('Error monitoring progress:', error);
  }
}

/**
 * Example: Batch migration
 */
async function batchMigrationExample() {
  const userMappings = [
    {
      aptosAddress: '0x1111111111111111111111111111111111111111',
      qieAddress: '0x742d35Cc6634C0532925a3b8D4C9db96DfB0b4C9'
    },
    {
      aptosAddress: '0x2222222222222222222222222222222222222222',
      qieAddress: '0x8ba1f109551bD432803012645Hac136c9c1588c9'
    }
  ];
  
  console.log('\n=== Batch Migration Example ===');
  console.log(`Migrating ${userMappings.length} users...`);
  
  try {
    const batchResult = await qieMigrationService.batchMigrateUsers(userMappings, {
      preserveMetaAddresses: true,
      updatePaymentLinks: true
    });
    
    console.log('Batch Migration Results:');
    console.log(`Total: ${batchResult.total}`);
    console.log(`Successful: ${batchResult.successful}`);
    console.log(`Failed: ${batchResult.failed}`);
    
    if (batchResult.results.length > 0) {
      console.log('\nIndividual Results:');
      batchResult.results.forEach((result, index) => {
        const status = result.status === 'completed' ? '✅' : '❌';
        console.log(`  ${status} User ${index + 1}: ${result.status}`);
        if (result.error) {
          console.log(`    Error: ${result.error}`);
        }
      });
    }
    
  } catch (error) {
    console.error('Batch migration error:', error);
  }
}

/**
 * Example: Get migration statistics
 */
async function getMigrationStatistics() {
  console.log('\n=== Migration Statistics ===');
  
  try {
    const stats = await qieMigrationService.getMigrationStatistics();
    
    console.log('Migration Statistics:');
    console.log(`Total Migrations: ${stats.total}`);
    console.log(`Completed: ${stats.completed}`);
    console.log(`In Progress: ${stats.inProgress}`);
    console.log(`Failed: ${stats.failed}`);
    console.log(`Not Started: ${stats.notStarted}`);
    
    if (stats.error) {
      console.log('Error:', stats.error);
    }
    
  } catch (error) {
    console.error('Error getting statistics:', error);
  }
}

/**
 * Run all examples
 */
async function runMigrationExamples() {
  console.log('🚀 QIE User Migration Examples\n');
  
  try {
    // Initialize migration service
    await qieMigrationService.initialize();
    
    // Run examples
    await checkUserMigrationStatus();
    await startUserMigration();
    await monitorMigrationProgress();
    await batchMigrationExample();
    await getMigrationStatistics();
    
    console.log('\n✅ All migration examples completed!');
    
  } catch (error) {
    console.error('❌ Migration examples failed:', error);
  }
}

// Export examples for use in other modules
export {
  checkUserMigrationStatus,
  startUserMigration,
  monitorMigrationProgress,
  batchMigrationExample,
  getMigrationStatistics,
  runMigrationExamples
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrationExamples();
}