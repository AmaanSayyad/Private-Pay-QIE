-- PrivatePay QIE Migration Script
-- This script migrates the database schema to support QIE blockchain
-- Run this script in your Supabase SQL Editor or via CLI

-- ============================================================================
-- PART 1: QIE-SPECIFIC TABLES
-- ============================================================================

-- Table for storing QIE payment announcement events
CREATE TABLE IF NOT EXISTS qie_payment_events (
    id SERIAL PRIMARY KEY,
    recipient VARCHAR(42) NOT NULL, -- EVM address
    meta_address_index INTEGER NOT NULL,
    ephemeral_pub_key VARCHAR(66) NOT NULL, -- 33-byte hex string
    stealth_address VARCHAR(42) NOT NULL, -- EVM address
    view_hint INTEGER NOT NULL,
    k INTEGER NOT NULL,
    amount VARCHAR(78) NOT NULL, -- Wei amount as string (up to 2^256)
    timestamp TIMESTAMP NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL, -- EVM transaction hash
    block_number BIGINT NOT NULL,
    processed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for qie_payment_events
CREATE INDEX IF NOT EXISTS idx_qie_payment_recipient ON qie_payment_events (recipient);
CREATE INDEX IF NOT EXISTS idx_qie_payment_stealth ON qie_payment_events (stealth_address);
CREATE INDEX IF NOT EXISTS idx_qie_payment_tx_hash ON qie_payment_events (transaction_hash);
CREATE INDEX IF NOT EXISTS idx_qie_payment_block ON qie_payment_events (block_number);
CREATE INDEX IF NOT EXISTS idx_qie_payment_timestamp ON qie_payment_events (timestamp);

-- Add unique constraint to prevent duplicate events
ALTER TABLE qie_payment_events ADD CONSTRAINT IF NOT EXISTS unique_payment_event 
    UNIQUE (transaction_hash, recipient, stealth_address);

-- Table for storing QIE meta address registration events
CREATE TABLE IF NOT EXISTS qie_meta_address_events (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(42) NOT NULL, -- EVM address
    meta_address_index INTEGER NOT NULL,
    spend_pub_key VARCHAR(66) NOT NULL, -- 33-byte hex string
    viewing_pub_key VARCHAR(66) NOT NULL, -- 33-byte hex string
    timestamp TIMESTAMP NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL, -- EVM transaction hash
    block_number BIGINT NOT NULL,
    processed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for qie_meta_address_events
CREATE INDEX IF NOT EXISTS idx_qie_meta_user ON qie_meta_address_events (user_address);
CREATE INDEX IF NOT EXISTS idx_qie_meta_tx_hash ON qie_meta_address_events (transaction_hash);
CREATE INDEX IF NOT EXISTS idx_qie_meta_block ON qie_meta_address_events (block_number);
CREATE INDEX IF NOT EXISTS idx_qie_meta_timestamp ON qie_meta_address_events (timestamp);

-- Add unique constraint
ALTER TABLE qie_meta_address_events ADD CONSTRAINT IF NOT EXISTS unique_meta_event 
    UNIQUE (transaction_hash, user_address, meta_address_index);

-- Table for storing QIE stealth withdrawal events
CREATE TABLE IF NOT EXISTS qie_withdrawal_events (
    id SERIAL PRIMARY KEY,
    stealth_address VARCHAR(42) NOT NULL, -- EVM address
    recipient VARCHAR(42) NOT NULL, -- EVM address
    amount VARCHAR(78) NOT NULL, -- Wei amount as string
    timestamp TIMESTAMP NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL, -- EVM transaction hash
    block_number BIGINT NOT NULL,
    processed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for qie_withdrawal_events
CREATE INDEX IF NOT EXISTS idx_qie_withdrawal_stealth ON qie_withdrawal_events (stealth_address);
CREATE INDEX IF NOT EXISTS idx_qie_withdrawal_recipient ON qie_withdrawal_events (recipient);
CREATE INDEX IF NOT EXISTS idx_qie_withdrawal_tx_hash ON qie_withdrawal_events (transaction_hash);
CREATE INDEX IF NOT EXISTS idx_qie_withdrawal_block ON qie_withdrawal_events (block_number);
CREATE INDEX IF NOT EXISTS idx_qie_withdrawal_timestamp ON qie_withdrawal_events (timestamp);

-- Add unique constraint
ALTER TABLE qie_withdrawal_events ADD CONSTRAINT IF NOT EXISTS unique_withdrawal_event 
    UNIQUE (transaction_hash, stealth_address);

-- Table for storing event monitor state
CREATE TABLE IF NOT EXISTS qie_monitor_state (
    id SERIAL PRIMARY KEY,
    monitor_name VARCHAR(50) NOT NULL UNIQUE,
    last_processed_block BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add index for qie_monitor_state
CREATE INDEX IF NOT EXISTS idx_qie_monitor_name ON qie_monitor_state (monitor_name);

-- Insert initial monitor state
INSERT INTO qie_monitor_state (monitor_name, last_processed_block) 
VALUES ('payment_events', 0) 
ON CONFLICT (monitor_name) DO NOTHING;

-- Table for storing QIE transaction data
CREATE TABLE IF NOT EXISTS qie_transactions (
    id SERIAL PRIMARY KEY,
    transaction_hash VARCHAR(66) NOT NULL UNIQUE, -- EVM transaction hash
    from_address VARCHAR(42) NOT NULL, -- EVM address
    to_address VARCHAR(42), -- EVM address (can be null for contract creation)
    value VARCHAR(78) NOT NULL, -- Wei amount as string
    gas_limit VARCHAR(20) NOT NULL,
    gas_price VARCHAR(20),
    gas_used VARCHAR(20),
    effective_gas_price VARCHAR(20),
    block_number BIGINT NOT NULL,
    block_hash VARCHAR(66) NOT NULL,
    transaction_index INTEGER NOT NULL,
    status INTEGER NOT NULL, -- 1 for success, 0 for failure
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for qie_transactions
CREATE INDEX IF NOT EXISTS idx_qie_tx_hash ON qie_transactions (transaction_hash);
CREATE INDEX IF NOT EXISTS idx_qie_tx_from ON qie_transactions (from_address);
CREATE INDEX IF NOT EXISTS idx_qie_tx_to ON qie_transactions (to_address);
CREATE INDEX IF NOT EXISTS idx_qie_tx_block ON qie_transactions (block_number);
CREATE INDEX IF NOT EXISTS idx_qie_tx_timestamp ON qie_transactions (timestamp);
CREATE INDEX IF NOT EXISTS idx_qie_tx_status ON qie_transactions (status);

-- ============================================================================
-- PART 2: QIE CONFIGURATION TABLES
-- ============================================================================

-- Create QIE contracts configuration table
CREATE TABLE IF NOT EXISTS qie_contracts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    address VARCHAR(42) NOT NULL, -- EVM address
    abi JSON NOT NULL,
    deployed_at TIMESTAMP DEFAULT NOW(),
    chain_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for qie_contracts
CREATE INDEX IF NOT EXISTS idx_qie_contracts_name ON qie_contracts (name);
CREATE INDEX IF NOT EXISTS idx_qie_contracts_address ON qie_contracts (address);
CREATE INDEX IF NOT EXISTS idx_qie_contracts_chain ON qie_contracts (chain_id);

-- Add unique constraint
ALTER TABLE qie_contracts ADD CONSTRAINT IF NOT EXISTS unique_contract 
    UNIQUE (name, chain_id);

-- Create QIE network configuration table
CREATE TABLE IF NOT EXISTS qie_network_config (
    id SERIAL PRIMARY KEY,
    network_name VARCHAR(20) NOT NULL,
    chain_id INTEGER NOT NULL UNIQUE,
    rpc_url VARCHAR(255) NOT NULL,
    explorer_url VARCHAR(255) NOT NULL,
    native_currency_name VARCHAR(10) NOT NULL,
    native_currency_symbol VARCHAR(10) NOT NULL,
    native_currency_decimals INTEGER NOT NULL DEFAULT 18,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for qie_network_config
CREATE INDEX IF NOT EXISTS idx_qie_network_chain ON qie_network_config (chain_id);
CREATE INDEX IF NOT EXISTS idx_qie_network_active ON qie_network_config (is_active);

-- Insert QIE testnet configuration
INSERT INTO qie_network_config (
    network_name, chain_id, rpc_url, explorer_url,
    native_currency_name, native_currency_symbol, native_currency_decimals, is_active
) VALUES (
    'QIE Testnet', 35441, 'https://rpc1testnet.qie.digital/', 'https://testnet.qie.digital',
    'QIE', 'QIE', 18, true
) ON CONFLICT (chain_id) DO UPDATE SET 
    network_name = EXCLUDED.network_name,
    rpc_url = EXCLUDED.rpc_url,
    explorer_url = EXCLUDED.explorer_url,
    is_active = EXCLUDED.is_active;

-- Insert QIE contract configurations (update with actual deployed addresses)
INSERT INTO qie_contracts (name, address, abi, chain_id) VALUES 
('StealthAddressRegistry', '0x084e08c8011ed2b519ac844836c49efa944c5921', '[]', 35441),
('PaymentManager', '0x0ab4d2d7642d2ac00206042b87bfc82a6f96737b', '[]', 35441)
ON CONFLICT (name, chain_id) DO UPDATE SET 
    address = EXCLUDED.address,
    is_active = EXCLUDED.is_active;

-- ============================================================================
-- PART 3: UPDATE EXISTING TABLES FOR QIE SUPPORT
-- ============================================================================

-- Update existing users table to include QIE address and additional fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS qie_address VARCHAR(42);
ALTER TABLE users ADD COLUMN IF NOT EXISTS qie_meta_address_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_qie_activity TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS migration_status VARCHAR(20) DEFAULT 'not_migrated';
ALTER TABLE users ADD COLUMN IF NOT EXISTS migration_started_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS migration_completed_at TIMESTAMP;

-- Add indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_qie_address ON users (qie_address);
CREATE INDEX IF NOT EXISTS idx_users_qie_activity ON users (last_qie_activity);
CREATE INDEX IF NOT EXISTS idx_users_migration_status ON users (migration_status);

-- Update existing meta_addresses table to include QIE address and network info
ALTER TABLE meta_addresses ADD COLUMN IF NOT EXISTS qie_address VARCHAR(42);
ALTER TABLE meta_addresses ADD COLUMN IF NOT EXISTS network VARCHAR(20) DEFAULT 'aptos';
ALTER TABLE meta_addresses ADD COLUMN IF NOT EXISTS qie_spend_pub_key VARCHAR(66);
ALTER TABLE meta_addresses ADD COLUMN IF NOT EXISTS qie_viewing_pub_key VARCHAR(66);

-- Add indexes for meta_addresses table
CREATE INDEX IF NOT EXISTS idx_meta_qie_address ON meta_addresses (qie_address);
CREATE INDEX IF NOT EXISTS idx_meta_network ON meta_addresses (network);

-- Update existing payments table to include QIE transaction data and gas info
ALTER TABLE payments ADD COLUMN IF NOT EXISTS qie_transaction_hash VARCHAR(66);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS qie_block_number BIGINT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gas_used VARCHAR(20);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gas_price VARCHAR(20);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS effective_gas_price VARCHAR(20);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gas_limit VARCHAR(20);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS network VARCHAR(20) DEFAULT 'aptos';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS qie_stealth_address VARCHAR(42);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS qie_amount_wei VARCHAR(78);

-- Add indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_qie_tx ON payments (qie_transaction_hash);
CREATE INDEX IF NOT EXISTS idx_payments_qie_block ON payments (qie_block_number);
CREATE INDEX IF NOT EXISTS idx_payments_network ON payments (network);
CREATE INDEX IF NOT EXISTS idx_payments_qie_stealth ON payments (qie_stealth_address);
CREATE INDEX IF NOT EXISTS idx_payments_gas_used ON payments (gas_used);
CREATE INDEX IF NOT EXISTS idx_payments_gas_price ON payments (gas_price);

-- Update existing payment_links table for migration tracking
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS migration_status VARCHAR(20) DEFAULT 'not_migrated';
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS original_aptos_address VARCHAR(66);
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMP;
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS meta_address JSON;
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS stealth_data JSON;
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS qr_data JSON;
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS chain_id INTEGER;
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS network VARCHAR(20) DEFAULT 'qie';

-- Add indexes for payment_links table
CREATE INDEX IF NOT EXISTS idx_payment_links_migration ON payment_links (migration_status);
CREATE INDEX IF NOT EXISTS idx_payment_links_aptos ON payment_links (original_aptos_address);
CREATE INDEX IF NOT EXISTS idx_payment_links_network ON payment_links (network);

-- ============================================================================
-- PART 4: MIGRATION TRACKING TABLES
-- ============================================================================

-- Table for tracking user migrations from Aptos to QIE
CREATE TABLE IF NOT EXISTS user_migrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    aptos_address VARCHAR(66) NOT NULL, -- Aptos address format
    qie_address VARCHAR(42) NOT NULL, -- EVM address format
    migration_status VARCHAR(20) NOT NULL DEFAULT 'not_started',
    migration_data JSON, -- Detailed migration step results
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for user_migrations
CREATE INDEX IF NOT EXISTS idx_user_migrations_user ON user_migrations (user_id);
CREATE INDEX IF NOT EXISTS idx_user_migrations_aptos ON user_migrations (aptos_address);
CREATE INDEX IF NOT EXISTS idx_user_migrations_qie ON user_migrations (qie_address);
CREATE INDEX IF NOT EXISTS idx_user_migrations_status ON user_migrations (migration_status);
CREATE INDEX IF NOT EXISTS idx_user_migrations_started ON user_migrations (started_at);
CREATE INDEX IF NOT EXISTS idx_user_migrations_completed ON user_migrations (completed_at);

-- Add unique constraint
ALTER TABLE user_migrations ADD CONSTRAINT IF NOT EXISTS unique_user_migration 
    UNIQUE (aptos_address, qie_address);

-- Add foreign key constraint if users table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE user_migrations ADD CONSTRAINT IF NOT EXISTS fk_user_migrations_user 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Table for tracking meta address migrations
CREATE TABLE IF NOT EXISTS meta_address_migrations (
    id SERIAL PRIMARY KEY,
    user_migration_id INTEGER NOT NULL,
    original_meta_address_id INTEGER,
    aptos_spend_key VARCHAR(66),
    aptos_viewing_key VARCHAR(66),
    qie_spend_key VARCHAR(66) NOT NULL,
    qie_viewing_key VARCHAR(66) NOT NULL,
    migration_timestamp TIMESTAMP DEFAULT NOW(),
    privacy_preserved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for meta_address_migrations
CREATE INDEX IF NOT EXISTS idx_meta_migration_user ON meta_address_migrations (user_migration_id);
CREATE INDEX IF NOT EXISTS idx_meta_migration_original ON meta_address_migrations (original_meta_address_id);
CREATE INDEX IF NOT EXISTS idx_meta_migration_qie_spend ON meta_address_migrations (qie_spend_key);
CREATE INDEX IF NOT EXISTS idx_meta_migration_qie_viewing ON meta_address_migrations (qie_viewing_key);
CREATE INDEX IF NOT EXISTS idx_meta_migration_timestamp ON meta_address_migrations (migration_timestamp);

-- Add foreign key constraint
ALTER TABLE meta_address_migrations ADD CONSTRAINT IF NOT EXISTS fk_meta_migration_user 
    FOREIGN KEY (user_migration_id) REFERENCES user_migrations(id) ON DELETE CASCADE;

-- Table for tracking payment link migrations
CREATE TABLE IF NOT EXISTS payment_link_migrations (
    id SERIAL PRIMARY KEY,
    user_migration_id INTEGER NOT NULL,
    original_payment_link_id INTEGER NOT NULL,
    alias VARCHAR(100) NOT NULL,
    aptos_wallet_address VARCHAR(66),
    qie_wallet_address VARCHAR(42) NOT NULL,
    original_meta_data JSON,
    qie_meta_data JSON NOT NULL,
    qie_stealth_data JSON NOT NULL,
    qie_qr_data JSON NOT NULL,
    migration_timestamp TIMESTAMP DEFAULT NOW(),
    link_updated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for payment_link_migrations
CREATE INDEX IF NOT EXISTS idx_payment_migration_user ON payment_link_migrations (user_migration_id);
CREATE INDEX IF NOT EXISTS idx_payment_migration_original ON payment_link_migrations (original_payment_link_id);
CREATE INDEX IF NOT EXISTS idx_payment_migration_alias ON payment_link_migrations (alias);
CREATE INDEX IF NOT EXISTS idx_payment_migration_qie_address ON payment_link_migrations (qie_wallet_address);
CREATE INDEX IF NOT EXISTS idx_payment_migration_timestamp ON payment_link_migrations (migration_timestamp);

-- Add foreign key constraints
ALTER TABLE payment_link_migrations ADD CONSTRAINT IF NOT EXISTS fk_payment_migration_user 
    FOREIGN KEY (user_migration_id) REFERENCES user_migrations(id) ON DELETE CASCADE;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_links') THEN
        ALTER TABLE payment_link_migrations ADD CONSTRAINT IF NOT EXISTS fk_payment_migration_link 
            FOREIGN KEY (original_payment_link_id) REFERENCES payment_links(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Table for tracking cross-network privacy preservation
CREATE TABLE IF NOT EXISTS privacy_preservation_log (
    id SERIAL PRIMARY KEY,
    user_migration_id INTEGER NOT NULL,
    privacy_check_type VARCHAR(50) NOT NULL, -- 'meta_address_unlinkability', 'stealth_address_isolation', etc.
    aptos_data_hash VARCHAR(64), -- Hash of Aptos data for verification
    qie_data_hash VARCHAR(64), -- Hash of QIE data for verification
    unlinkability_preserved BOOLEAN NOT NULL,
    check_timestamp TIMESTAMP DEFAULT NOW(),
    check_details JSON,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for privacy_preservation_log
CREATE INDEX IF NOT EXISTS idx_privacy_log_user ON privacy_preservation_log (user_migration_id);
CREATE INDEX IF NOT EXISTS idx_privacy_log_type ON privacy_preservation_log (privacy_check_type);
CREATE INDEX IF NOT EXISTS idx_privacy_log_preserved ON privacy_preservation_log (unlinkability_preserved);
CREATE INDEX IF NOT EXISTS idx_privacy_log_timestamp ON privacy_preservation_log (check_timestamp);

-- Add foreign key constraint
ALTER TABLE privacy_preservation_log ADD CONSTRAINT IF NOT EXISTS fk_privacy_log_user 
    FOREIGN KEY (user_migration_id) REFERENCES user_migrations(id) ON DELETE CASCADE;

-- ============================================================================
-- PART 5: ADDITIONAL UTILITY TABLES
-- ============================================================================

-- Create table for tracking QIE wallet connections and sessions
CREATE TABLE IF NOT EXISTS qie_wallet_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    qie_address VARCHAR(42) NOT NULL,
    wallet_type VARCHAR(20) NOT NULL DEFAULT 'metamask', -- metamask, walletconnect, etc.
    connected_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW(),
    session_data JSON,
    is_active BOOLEAN DEFAULT TRUE
);

-- Add indexes for qie_wallet_sessions
CREATE INDEX IF NOT EXISTS idx_qie_wallet_user ON qie_wallet_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_qie_wallet_address ON qie_wallet_sessions (qie_address);
CREATE INDEX IF NOT EXISTS idx_qie_wallet_active ON qie_wallet_sessions (is_active);
CREATE INDEX IF NOT EXISTS idx_qie_wallet_activity ON qie_wallet_sessions (last_activity);

-- Add foreign key constraint if users table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE qie_wallet_sessions ADD CONSTRAINT IF NOT EXISTS fk_qie_wallet_user 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create table for QIE gas price tracking (for optimization)
CREATE TABLE IF NOT EXISTS qie_gas_tracker (
    id SERIAL PRIMARY KEY,
    block_number BIGINT NOT NULL,
    gas_price VARCHAR(20) NOT NULL,
    base_fee VARCHAR(20),
    priority_fee VARCHAR(20),
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Add indexes for qie_gas_tracker
CREATE INDEX IF NOT EXISTS idx_qie_gas_block ON qie_gas_tracker (block_number);
CREATE INDEX IF NOT EXISTS idx_qie_gas_timestamp ON qie_gas_tracker (timestamp);
CREATE INDEX IF NOT EXISTS idx_qie_gas_price ON qie_gas_tracker (gas_price);

-- ============================================================================
-- PART 6: VIEWS AND FUNCTIONS
-- ============================================================================

-- Create view for migration summary
CREATE OR REPLACE VIEW migration_summary AS
SELECT 
    um.id as migration_id,
    um.aptos_address,
    um.qie_address,
    um.migration_status,
    um.started_at,
    um.completed_at,
    u.username,
    u.created_at as user_created_at,
    COUNT(mam.id) as meta_addresses_migrated,
    COUNT(plm.id) as payment_links_migrated,
    COUNT(ppl.id) as privacy_checks_passed
FROM user_migrations um
LEFT JOIN users u ON um.user_id = u.id
LEFT JOIN meta_address_migrations mam ON um.id = mam.user_migration_id
LEFT JOIN payment_link_migrations plm ON um.id = plm.user_migration_id
LEFT JOIN privacy_preservation_log ppl ON um.id = ppl.user_migration_id AND ppl.unlinkability_preserved = TRUE
GROUP BY um.id, um.aptos_address, um.qie_address, um.migration_status, um.started_at, um.completed_at, u.username, u.created_at;

-- ============================================================================
-- PART 7: DATA MIGRATION AND UPDATES
-- ============================================================================

-- Update existing users migration status based on current data
UPDATE users SET migration_status = 'pending' WHERE qie_address IS NULL AND wallet_address IS NOT NULL;
UPDATE users SET migration_status = 'completed' WHERE qie_address IS NOT NULL AND wallet_address IS NOT NULL;

-- Update existing payment_links to QIE network by default for new links
UPDATE payment_links SET network = 'qie' WHERE network IS NULL;

-- Mark existing payments as Aptos network for historical distinction
UPDATE payments SET network = 'aptos' WHERE network IS NULL OR network = '';

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify the migration)
-- ============================================================================

-- Check if all tables were created successfully
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'qie_%'
ORDER BY table_name;

-- Check if all columns were added to existing tables
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'payments', 'payment_links', 'meta_addresses')
AND column_name LIKE '%qie%' OR column_name = 'network' OR column_name LIKE '%migration%'
ORDER BY table_name, column_name;

-- Check QIE network configuration
SELECT * FROM qie_network_config WHERE is_active = true;

-- Check QIE contract configuration
SELECT * FROM qie_contracts WHERE is_active = true;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

-- Insert a completion log
INSERT INTO qie_monitor_state (monitor_name, last_processed_block) 
VALUES ('migration_completed', EXTRACT(EPOCH FROM NOW())::BIGINT) 
ON CONFLICT (monitor_name) DO UPDATE SET 
    last_processed_block = EXCLUDED.last_processed_block,
    updated_at = NOW();

-- Success message
SELECT 'QIE Migration completed successfully! All tables, indexes, and constraints have been created.' as status;