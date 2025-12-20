-- QIE Migration Verification Queries
-- Run these queries in Supabase SQL Editor to verify the migration was successful

-- 1. Check if all QIE tables were created
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'qie_%'
ORDER BY table_name;

-- Expected result: Should show 9 tables starting with 'qie_'

-- 2. Check if new columns were added to existing tables
SELECT 
    table_name, 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'payments', 'payment_links', 'meta_addresses')
AND (
    column_name LIKE '%qie%' 
    OR column_name = 'network' 
    OR column_name LIKE '%migration%'
    OR column_name LIKE '%gas_%'
    OR column_name IN ('meta_address', 'stealth_data', 'qr_data', 'chain_id')
)
ORDER BY table_name, column_name;

-- 3. Check QIE network configuration
SELECT 
    network_name,
    chain_id,
    rpc_url,
    explorer_url,
    native_currency_symbol,
    is_active
FROM qie_network_config 
WHERE is_active = true;

-- Expected result: Should show QIE Testnet with chain_id 35441

-- 4. Check QIE contract configuration
SELECT 
    name,
    address,
    chain_id,
    is_active,
    deployed_at
FROM qie_contracts 
WHERE is_active = true;

-- Expected result: Should show StealthAddressRegistry and PaymentManager contracts

-- 5. Check monitor state initialization
SELECT 
    monitor_name,
    last_processed_block,
    created_at,
    updated_at
FROM qie_monitor_state;

-- Expected result: Should show payment_events and migration_completed entries

-- 6. Check indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND (
    tablename LIKE 'qie_%' 
    OR indexname LIKE '%qie%'
    OR indexname LIKE '%migration%'
    OR indexname LIKE '%gas_%'
)
ORDER BY tablename, indexname;

-- 7. Check constraints were added
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
AND (
    tc.table_name LIKE 'qie_%'
    OR tc.constraint_name LIKE '%qie%'
    OR tc.constraint_name LIKE 'unique_%'
)
ORDER BY tc.table_name, tc.constraint_name;

-- 8. Check sample data updates
-- Check if existing users have migration_status set
SELECT 
    migration_status,
    COUNT(*) as user_count
FROM users 
GROUP BY migration_status;

-- Check if existing payments have network set
SELECT 
    network,
    COUNT(*) as payment_count
FROM payments 
GROUP BY network;

-- Check if existing payment_links have network set
SELECT 
    network,
    COUNT(*) as link_count
FROM payment_links 
GROUP BY network;

-- 9. Test QIE table functionality
-- Insert a test record into qie_monitor_state
INSERT INTO qie_monitor_state (monitor_name, last_processed_block) 
VALUES ('test_monitor', 12345) 
ON CONFLICT (monitor_name) DO UPDATE SET 
    last_processed_block = EXCLUDED.last_processed_block,
    updated_at = NOW();

-- Verify the test record
SELECT * FROM qie_monitor_state WHERE monitor_name = 'test_monitor';

-- Clean up test record
DELETE FROM qie_monitor_state WHERE monitor_name = 'test_monitor';

-- 10. Summary query - Migration success check
SELECT 
    'QIE Tables Created' as check_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) >= 9 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'qie_%'

UNION ALL

SELECT 
    'QIE Network Config' as check_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) >= 1 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM qie_network_config 
WHERE is_active = true AND chain_id = 35441

UNION ALL

SELECT 
    'QIE Contracts Config' as check_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) >= 2 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM qie_contracts 
WHERE is_active = true AND chain_id = 35441

UNION ALL

SELECT 
    'Users QIE Columns' as check_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) >= 6 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.columns 
WHERE table_name = 'users' 
AND (column_name LIKE '%qie%' OR column_name LIKE '%migration%')

UNION ALL

SELECT 
    'Payments QIE Columns' as check_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) >= 8 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND (column_name LIKE '%qie%' OR column_name = 'network' OR column_name LIKE '%gas_%');

-- If all checks show ✅ PASS, the migration was successful!