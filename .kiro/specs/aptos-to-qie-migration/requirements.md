# Requirements Document

## Introduction

This document outlines the requirements for migrating the existing Aptos-based PrivatePay application to the QIE blockchain network. The migration will completely replace all Aptos functionality with QIE equivalents while maintaining the core privacy features and user experience. The application will operate exclusively on QIE testnet, with no remaining Aptos dependencies.

## Glossary

- **QIE_Network**: The target blockchain network that will replace Aptos
- **PrivatePay_App**: The existing private payment application currently running on Aptos
- **Stealth_Address_System**: The privacy mechanism using ECDH + secp256k1 for unlinkable payments
- **Meta_Address**: A pair of public keys (spend + viewing) used for stealth address generation
- **Payment_Registry**: Smart contract system for managing stealth payment metadata
- **Migration_Process**: The systematic replacement of Aptos components with QIE equivalents

## Requirements

### Requirement 1

**User Story:** As a PrivatePay user, I want the application to work seamlessly on QIE network, so that I can continue making private payments without any Aptos dependencies.

#### Acceptance Criteria

1. WHEN the application starts THEN the QIE_Network SHALL be the only blockchain connection
2. WHEN a user connects their wallet THEN the system SHALL only support QIE-compatible wallets
3. WHEN viewing the application interface THEN the system SHALL display QIE branding and network information
4. WHEN checking dependencies THEN the system SHALL contain no Aptos-related packages or imports
5. WHEN accessing any feature THEN the system SHALL operate exclusively through QIE network calls

### Requirement 2

**User Story:** As a developer, I want all smart contracts migrated to QIE, so that the stealth address functionality works on the new network.

#### Acceptance Criteria

1. WHEN deploying contracts THEN the system SHALL deploy stealth address contracts to QIE testnet
2. WHEN registering meta addresses THEN the QIE_Network SHALL store spend and viewing public keys
3. WHEN announcing payments THEN the QIE_Network SHALL emit payment announcement events
4. WHEN querying payment data THEN the system SHALL retrieve information from QIE smart contracts
5. WHEN validating cryptographic operations THEN the system SHALL use QIE-compatible cryptographic functions

### Requirement 3

**User Story:** As a user, I want to send private payments on QIE, so that I can maintain transaction privacy on the new network.

#### Acceptance Criteria

1. WHEN generating stealth addresses THEN the system SHALL use QIE address format and derivation
2. WHEN sending payments THEN the system SHALL transfer QIE native tokens or QIE-based tokens
3. WHEN computing shared secrets THEN the system SHALL use ECDH with QIE-compatible key formats
4. WHEN creating payment links THEN the system SHALL generate QIE-specific stealth addresses
5. WHEN monitoring transactions THEN the system SHALL scan QIE blockchain for payment events

### Requirement 4

**User Story:** As a user, I want to receive and withdraw private payments on QIE, so that I can access my funds on the new network.

#### Acceptance Criteria

1. WHEN detecting payments THEN the system SHALL monitor QIE blockchain events
2. WHEN computing stealth private keys THEN the system SHALL derive QIE-compatible private keys
3. WHEN withdrawing funds THEN the system SHALL transfer from stealth addresses to main QIE wallet
4. WHEN displaying balances THEN the system SHALL show QIE token amounts and values
5. WHEN managing multiple payments THEN the system SHALL handle QIE address derivation correctly

### Requirement 5

**User Story:** As a user, I want the frontend interface updated for QIE, so that all UI elements reflect the new blockchain.

#### Acceptance Criteria

1. WHEN viewing network information THEN the system SHALL display "QIE Testnet" instead of Aptos
2. WHEN connecting wallets THEN the system SHALL show QIE-compatible wallet options
3. WHEN displaying transaction links THEN the system SHALL use QIE blockchain explorer URLs
4. WHEN showing token information THEN the system SHALL display QIE native token symbols and logos
5. WHEN accessing help documentation THEN the system SHALL provide QIE-specific guidance

### Requirement 6

**User Story:** As a developer, I want all backend services migrated to QIE, so that the application infrastructure supports the new blockchain.

#### Acceptance Criteria

1. WHEN configuring blockchain connections THEN the system SHALL connect only to QIE RPC endpoints
2. WHEN storing transaction data THEN the system SHALL use QIE transaction hashes and block numbers
3. WHEN monitoring blockchain events THEN the system SHALL listen to QIE smart contract events
4. WHEN validating addresses THEN the system SHALL use QIE address validation rules
5. WHEN processing payments THEN the system SHALL handle QIE transaction formats and gas fees

### Requirement 7

**User Story:** As a system administrator, I want all configuration updated for QIE, so that the deployment works correctly on the new network.

#### Acceptance Criteria

1. WHEN deploying the application THEN the system SHALL use QIE testnet configuration
2. WHEN setting environment variables THEN the system SHALL contain QIE RPC URLs and contract addresses
3. WHEN configuring wallets THEN the system SHALL support QIE wallet connection parameters
4. WHEN updating documentation THEN the system SHALL reflect QIE network requirements
5. WHEN running tests THEN the system SHALL execute against QIE testnet endpoints

### Requirement 8

**User Story:** As a user, I want data migration handled properly, so that existing payment links and user data work with QIE.

#### Acceptance Criteria

1. WHEN migrating user accounts THEN the system SHALL preserve meta address relationships
2. WHEN updating payment links THEN the system SHALL redirect to QIE-based stealth address generation
3. WHEN accessing historical data THEN the system SHALL clearly indicate Aptos vs QIE transactions
4. WHEN onboarding existing users THEN the system SHALL guide them through QIE wallet setup
5. WHEN preserving privacy THEN the system SHALL maintain stealth address unlinkability across networks