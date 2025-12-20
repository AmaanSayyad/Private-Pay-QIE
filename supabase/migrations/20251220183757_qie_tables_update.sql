-- QIE Tables Update Migration
-- This migration adds QIE-specific tables and updates existing tables for QIE blockchain support

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
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_payment_event'
    ) THEN
        ALTER TABLE qie_payment_events ADD CONSTRAINT unique_payment_event 
            UNIQUE (transaction_hash, recipient, stealth_address);
    END IF;
END $$;

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
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_meta_event'
    ) THEN
        ALTER TABLE qie_meta_address_events ADD CONSTRAINT unique_meta_event 
            UNIQUE (transaction_hash, user_address, meta_address_index);
    END IF;
END $$;

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
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_withdrawal_event'
    ) THEN
        ALTER TABLE qie_withdrawal_events ADD CONSTRAINT unique_withdrawal_event 
            UNIQUE (transaction_hash, stealth_address);
    END IF;
END $$;

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
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_contract'
    ) THEN
        ALTER TABLE qie_contracts ADD CONSTRAINT unique_contract 
            UNIQUE (name, chain_id);
    END IF;
END $$;

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

-- Insert QIE contract configurations
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
DO $$
BEGIN
    -- Add qie_address column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'qie_address'
    ) THEN
        ALTER TABLE users ADD COLUMN qie_address VARCHAR(42);
    END IF;
    
    -- Add qie_meta_address_count column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'qie_meta_address_count'
    ) THEN
        ALTER TABLE users ADD COLUMN qie_meta_address_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add last_qie_activity column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_qie_activity'
    ) THEN
        ALTER TABLE users ADD COLUMN last_qie_activity TIMESTAMP;
    END IF;
    
    -- Add migration_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'migration_status'
    ) THEN
        ALTER TABLE users ADD COLUMN migration_status VARCHAR(20) DEFAULT 'not_migrated';
    END IF;
    
    -- Add migration_started_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'migration_started_at'
    ) THEN
        ALTER TABLE users ADD COLUMN migration_started_at TIMESTAMP;
    END IF;
    
    -- Add migration_completed_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'migration_completed_at'
    ) THEN
        ALTER TABLE users ADD COLUMN migration_completed_at TIMESTAMP;
    END IF;
END $$;

-- Add indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_qie_address ON users (qie_address);
CREATE INDEX IF NOT EXISTS idx_users_qie_activity ON users (last_qie_activity);
CREATE INDEX IF NOT EXISTS idx_users_migration_status ON users (migration_status);

-- Update existing payments table to include QIE transaction data and gas info
DO $$
BEGIN
    -- Add network column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'network'
    ) THEN
        ALTER TABLE payments ADD COLUMN network VARCHAR(20) DEFAULT 'aptos';
    END IF;
    
    -- Add qie_transaction_hash column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'qie_transaction_hash'
    ) THEN
        ALTER TABLE payments ADD COLUMN qie_transaction_hash VARCHAR(66);
    END IF;
    
    -- Add qie_block_number column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'qie_block_number'
    ) THEN
        ALTER TABLE payments ADD COLUMN qie_block_number BIGINT;
    END IF;
    
    -- Add gas_used column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'gas_used'
    ) THEN
        ALTER TABLE payments ADD COLUMN gas_used VARCHAR(20);
    END IF;
    
    -- Add gas_price column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'gas_price'
    ) THEN
        ALTER TABLE payments ADD COLUMN gas_price VARCHAR(20);
    END IF;
    
    -- Add effective_gas_price column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'effective_gas_price'
    ) THEN
        ALTER TABLE payments ADD COLUMN effective_gas_price VARCHAR(20);
    END IF;
    
    -- Add gas_limit column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'gas_limit'
    ) THEN
        ALTER TABLE payments ADD COLUMN gas_limit VARCHAR(20);
    END IF;
    
    -- Add qie_stealth_address column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'qie_stealth_address'
    ) THEN
        ALTER TABLE payments ADD COLUMN qie_stealth_address VARCHAR(42);
    END IF;
    
    -- Add qie_amount_wei column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'qie_amount_wei'
    ) THEN
        ALTER TABLE payments ADD COLUMN qie_amount_wei VARCHAR(78);
    END IF;
END $$;

-- Add indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_qie_tx ON payments (qie_transaction_hash);
CREATE INDEX IF NOT EXISTS idx_payments_qie_block ON payments (qie_block_number);
CREATE INDEX IF NOT EXISTS idx_payments_network ON payments (network);
CREATE INDEX IF NOT EXISTS idx_payments_qie_stealth ON payments (qie_stealth_address);
CREATE INDEX IF NOT EXISTS idx_payments_gas_used ON payments (gas_used);
CREATE INDEX IF NOT EXISTS idx_payments_gas_price ON payments (gas_price);

-- Update existing payment_links table for migration tracking
DO $$
BEGIN
    -- Add migration_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_links' AND column_name = 'migration_status'
    ) THEN
        ALTER TABLE payment_links ADD COLUMN migration_status VARCHAR(20) DEFAULT 'not_migrated';
    END IF;
    
    -- Add original_aptos_address column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_links' AND column_name = 'original_aptos_address'
    ) THEN
        ALTER TABLE payment_links ADD COLUMN original_aptos_address VARCHAR(66);
    END IF;
    
    -- Add migrated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_links' AND column_name = 'migrated_at'
    ) THEN
        ALTER TABLE payment_links ADD COLUMN migrated_at TIMESTAMP;
    END IF;
    
    -- Add meta_address column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_links' AND column_name = 'meta_address'
    ) THEN
        ALTER TABLE payment_links ADD COLUMN meta_address JSON;
    END IF;
    
    -- Add stealth_data column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_links' AND column_name = 'stealth_data'
    ) THEN
        ALTER TABLE payment_links ADD COLUMN stealth_data JSON;
    END IF;
    
    -- Add qr_data column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_links' AND column_name = 'qr_data'
    ) THEN
        ALTER TABLE payment_links ADD COLUMN qr_data JSON;
    END IF;
    
    -- Add chain_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_links' AND column_name = 'chain_id'
    ) THEN
        ALTER TABLE payment_links ADD COLUMN chain_id INTEGER;
    END IF;
    
    -- Add network column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_links' AND column_name = 'network'
    ) THEN
        ALTER TABLE payment_links ADD COLUMN network VARCHAR(20) DEFAULT 'qie';
    END IF;
END $$;

-- Add indexes for payment_links table
CREATE INDEX IF NOT EXISTS idx_payment_links_migration ON payment_links (migration_status);
CREATE INDEX IF NOT EXISTS idx_payment_links_aptos ON payment_links (original_aptos_address);
CREATE INDEX IF NOT EXISTS idx_payment_links_network ON payment_links (network);

-- Update existing meta_addresses table to include QIE address and network info
DO $$
BEGIN
    -- Check if meta_addresses table exists first
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'meta_addresses'
    ) THEN
        -- Add qie_address column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'meta_addresses' AND column_name = 'qie_address'
        ) THEN
            ALTER TABLE meta_addresses ADD COLUMN qie_address VARCHAR(42);
        END IF;
        
        -- Add network column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'meta_addresses' AND column_name = 'network'
        ) THEN
            ALTER TABLE meta_addresses ADD COLUMN network VARCHAR(20) DEFAULT 'aptos';
        END IF;
        
        -- Add qie_spend_pub_key column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'meta_addresses' AND column_name = 'qie_spend_pub_key'
        ) THEN
            ALTER TABLE meta_addresses ADD COLUMN qie_spend_pub_key VARCHAR(66);
        END IF;
        
        -- Add qie_viewing_pub_key column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'meta_addresses' AND column_name = 'qie_viewing_pub_key'
        ) THEN
            ALTER TABLE meta_addresses ADD COLUMN qie_viewing_pub_key VARCHAR(66);
        END IF;
        
        -- Add indexes for meta_addresses table
        CREATE INDEX IF NOT EXISTS idx_meta_qie_address ON meta_addresses (qie_address);
        CREATE INDEX IF NOT EXISTS idx_meta_network ON meta_addresses (network);
    END IF;
END $$;

-- ============================================================================
-- PART 4: UTILITY TABLES
-- ============================================================================

-- Create table for tracking QIE wallet connections and sessions
CREATE TABLE IF NOT EXISTS qie_wallet_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    qie_address VARCHAR(42) NOT NULL,
    wallet_type VARCHAR(20) NOT NULL DEFAULT 'metamask',
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

-- Create table for QIE gas price tracking
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
-- PART 5: DATA UPDATES
-- ============================================================================

-- Update existing users migration status based on current data
UPDATE users SET migration_status = 'pending' WHERE qie_address IS NULL AND wallet_address IS NOT NULL;
UPDATE users SET migration_status = 'completed' WHERE qie_address IS NOT NULL AND wallet_address IS NOT NULL;

-- Update existing payment_links to QIE network by default for new links
UPDATE payment_links SET network = 'qie' WHERE network IS NULL;

-- Mark existing payments as Aptos network for historical distinction
UPDATE payments SET network = 'aptos' WHERE network IS NULL OR network = '';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Insert completion marker
INSERT INTO qie_monitor_state (monitor_name, last_processed_block) 
VALUES ('migration_completed', EXTRACT(EPOCH FROM NOW())::BIGINT) 
ON CONFLICT (monitor_name) DO UPDATE SET 
    last_processed_block = EXCLUDED.last_processed_block,
    updated_at = NOW();