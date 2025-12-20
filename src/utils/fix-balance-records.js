/**
 * Utility script to fix missing balance records
 * Run this to ensure all users have balance records
 */

import { fixMissingBalanceRecords } from '../lib/supabase.js';

export async function runBalanceRecordFix() {
  try {
    console.log('🔧 Starting balance record fix...');
    
    const result = await fixMissingBalanceRecords();
    
    console.log(`✅ Balance record fix completed:`);
    console.log(`   - Fixed: ${result.fixed} missing records`);
    console.log(`   - Total users: ${result.total}`);
    
    return result;
  } catch (error) {
    console.error('❌ Balance record fix failed:', error);
    throw error;
  }
}

// Auto-run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBalanceRecordFix()
    .then(() => {
      console.log('✅ Fix completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fix failed:', error);
      process.exit(1);
    });
}