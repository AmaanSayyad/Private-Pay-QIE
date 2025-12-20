# Implementation Plan: Aptos to QIE Migration

## Overview

This implementation plan converts the existing Aptos-based PrivatePay application to work exclusively on QIE blockchain. The migration leverages QIE's EVM compatibility to use Solidity smart contracts, MetaMask integration, and standard Ethereum tooling.

## Task List

- [x] 1. Setup QIE development environment and smart contracts





  - Create QIE testnet configuration
  - Set up Hardhat project for Solidity contracts
  - Deploy stealth address contracts to QIE testnet
  - _Requirements: 2.1, 7.1, 7.2_

- [x] 1.1 Create Solidity smart contracts for QIE


  - Write StealthAddressRegistry.sol contract
  - Write PaymentManager.sol contract
  - Add comprehensive error handling and events
  - _Requirements: 2.2, 2.3, 2.4_

- [ ]* 1.2 Write property test for smart contract deployment
  - **Property 1: QIE Network Isolation**
  - **Validates: Requirements 2.1**

- [x] 1.3 Deploy contracts to QIE testnet


  - Configure Hardhat for QIE testnet deployment
  - Deploy and verify contracts on QIE explorer
  - Store contract addresses in configuration
  - _Requirements: 2.1, 7.2_

- [ ]* 1.4 Write property test for QIE contract integration
  - **Property 5: QIE Contract Integration**
  - **Validates: Requirements 2.2, 2.4**

- [x] 2. Remove all Aptos dependencies and configurations





  - Remove @aptos-labs/ts-sdk from package.json
  - Remove all Aptos-related imports and code
  - Delete aptos/ directory and Move contracts
  - _Requirements: 1.4_

- [x] 2.1 Clean up Aptos-specific files and folders


  - Delete aptos/ directory completely
  - Remove Aptos configuration files
  - Clean up any Aptos references in documentation
  - _Requirements: 1.4_

- [ ]* 2.2 Write property test for Aptos dependency elimination
  - **Property 4: Aptos Dependency Elimination**
  - **Validates: Requirements 1.4**

- [x] 3. Install and configure QIE/EVM dependencies




  - Add ethers.js for blockchain interaction
  - Add Hardhat for smart contract development
  - Update wallet connection libraries for MetaMask
  - _Requirements: 1.1, 1.2_

- [x] 3.1 Update package.json with QIE dependencies

  - Install ethers.js, @metamask/sdk, hardhat
  - Remove Aptos SDK and related packages
  - Update development dependencies for Solidity
  - _Requirements: 1.1, 1.4_

- [ ]* 3.2 Write property test for QIE wallet compatibility
  - **Property 2: QIE Wallet Compatibility**
  - **Validates: Requirements 1.2**

- [x] 4. Update frontend for QIE network integration





  - Replace Petra wallet with MetaMask integration
  - Update network configuration for QIE testnet
  - Modify transaction signing for EVM format
  - _Requirements: 1.2, 1.3, 5.1, 5.2_

- [x] 4.1 Implement MetaMask wallet connection


  - Create QIE network configuration for MetaMask
  - Implement wallet connection and account management
  - Add network switching functionality
  - _Requirements: 1.2, 5.2_

- [x] 4.2 Update UI components for QIE branding


  - Replace Aptos branding with QIE branding
  - Update network information displays
  - Change token symbols from APT to QIE
  - _Requirements: 1.3, 5.1, 5.4_

- [ ]* 4.3 Write property test for QIE branding consistency
  - **Property 3: QIE Branding Consistency**
  - **Validates: Requirements 1.3, 5.1, 5.2, 5.4**

- [x] 4.4 Update transaction and explorer links


  - Replace Aptos explorer URLs with QIE explorer
  - Update transaction link generation
  - Modify address display formats for EVM
  - _Requirements: 5.3_

- [ ]* 4.5 Write property test for QIE explorer integration
  - **Property 15: QIE Explorer Integration**
  - **Validates: Requirements 5.3**

- [x] 5. Migrate stealth address cryptography for QIE





  - Adapt ECDH implementation for EVM addresses
  - Update address derivation for QIE format
  - Modify key generation for EVM compatibility
  - _Requirements: 2.5, 3.1, 3.3_

- [x] 5.1 Update cryptographic utilities for QIE


  - Modify stealth address generation for EVM format
  - Update ECDH shared secret computation
  - Adapt private key derivation for QIE addresses
  - _Requirements: 2.5, 3.1, 3.3_

- [ ]* 5.2 Write property test for QIE cryptographic compatibility
  - **Property 7: QIE Cryptographic Compatibility**
  - **Validates: Requirements 2.5, 3.3**

- [ ]* 5.3 Write property test for QIE address format compliance
  - **Property 8: QIE Address Format Compliance**
  - **Validates: Requirements 3.1, 4.2, 6.4**

- [x] 5.4 Update payment link generation for QIE


  - Modify stealth address generation in payment links
  - Update QR code generation for QIE addresses
  - Test payment link functionality end-to-end
  - _Requirements: 3.4_

- [ ]* 5.5 Write property test for QIE payment link generation
  - **Property 10: QIE Payment Link Generation**
  - **Validates: Requirements 3.4**

- [x] 6. Update backend services for QIE blockchain





  - Replace Aptos SDK with ethers.js in backend
  - Update blockchain service for QIE RPC endpoints
  - Modify event monitoring for QIE smart contracts
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [x] 6.1 Implement QIE blockchain service


  - Create QIEBlockchainService class with ethers.js
  - Implement contract interaction methods
  - Add transaction monitoring and validation
  - _Requirements: 6.1, 6.2, 6.5_

- [x] 6.2 Update event monitoring system


  - Replace Aptos event monitoring with QIE events
  - Implement real-time event listening
  - Update database storage for QIE transaction data
  - _Requirements: 6.3, 6.2_

- [ ]* 6.3 Write property test for QIE transaction monitoring
  - **Property 11: QIE Transaction Monitoring**
  - **Validates: Requirements 3.5**

- [ ]* 6.4 Write property test for QIE event system
  - **Property 6: QIE Event System**
  - **Validates: Requirements 2.3, 4.1, 6.3**

- [x] 6.5 Update payment processing for QIE


  - Implement QIE token transfers
  - Update gas fee calculation and handling
  - Modify transaction format processing
  - _Requirements: 3.2, 6.5_

- [ ]* 6.6 Write property test for QIE token operations
  - **Property 9: QIE Token Operations**
  - **Validates: Requirements 3.2**

- [ ]* 6.7 Write property test for QIE transaction processing
  - **Property 18: QIE Transaction Processing**
  - **Validates: Requirements 6.5**

- [x] 7. Update database schema and configuration





  - Add QIE-specific columns to existing tables
  - Create QIE network and contract configuration tables
  - Update environment variables for QIE endpoints
  - _Requirements: 7.2, 7.3_

- [x] 7.1 Update database schema for QIE


  - Add QIE address columns to user and payment tables
  - Create qie_contracts and qie_network_config tables
  - Add gas-related columns for QIE transactions
  - _Requirements: 6.2, 7.2_

- [x] 7.2 Update environment configuration


  - Replace Aptos RPC URLs with QIE testnet endpoints
  - Add QIE contract addresses to environment
  - Update wallet configuration parameters
  - _Requirements: 7.2, 7.3_

- [ ]* 7.3 Write property test for QIE configuration consistency
  - **Property 19: QIE Configuration Consistency**
  - **Validates: Requirements 7.2, 7.3, 7.4, 7.5**

- [x] 8. Implement fund withdrawal functionality for QIE





  - Update stealth private key computation for EVM
  - Implement QIE token withdrawal from stealth addresses
  - Add balance checking and display for QIE tokens
  - _Requirements: 4.2, 4.3, 4.4_

- [x] 8.1 Implement QIE fund withdrawal


  - Create withdrawal transaction signing for EVM
  - Update stealth private key derivation
  - Implement balance transfer to main QIE wallet
  - _Requirements: 4.2, 4.3_

- [ ]* 8.2 Write property test for QIE fund withdrawal
  - **Property 12: QIE Fund Withdrawal**
  - **Validates: Requirements 4.3**

- [x] 8.3 Update balance display for QIE tokens


  - Show QIE token balances with 18 decimal precision
  - Update token symbols and formatting
  - Add QIE price information if available
  - _Requirements: 4.4_

- [ ]* 8.4 Write property test for QIE balance display
  - **Property 13: QIE Balance Display**
  - **Validates: Requirements 4.4**

- [ ]* 8.5 Write property test for QIE address derivation consistency
  - **Property 14: QIE Address Derivation Consistency**
  - **Validates: Requirements 4.5**

- [ ] 9. Checkpoint - Ensure all core functionality works on QIE
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement data migration and user onboarding
  - Create migration scripts for existing user data
  - Implement user guidance for QIE wallet setup
  - Add network distinction for historical transactions
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 10.1 Create user data migration system
  - Preserve existing meta address relationships
  - Update payment links to use QIE generation
  - Maintain privacy across network transition
  - _Requirements: 8.1, 8.2, 8.5_

- [ ]* 10.2 Write property test for meta address migration integrity
  - **Property 20: Meta Address Migration Integrity**
  - **Validates: Requirements 8.1**

- [ ]* 10.3 Write property test for QIE payment link migration
  - **Property 21: QIE Payment Link Migration**
  - **Validates: Requirements 8.2**

- [ ] 10.4 Implement user onboarding for QIE
  - Create QIE wallet setup guidance
  - Add network switching instructions
  - Provide testnet token acquisition help
  - _Requirements: 8.4_

- [ ]* 10.5 Write property test for QIE user onboarding
  - **Property 23: QIE User Onboarding**
  - **Validates: Requirements 8.4**

- [ ] 10.6 Add historical transaction distinction
  - Mark transactions by network (Aptos vs QIE)
  - Update transaction history display
  - Maintain clear network indicators
  - _Requirements: 8.3_

- [ ]* 10.7 Write property test for network transaction distinction
  - **Property 22: Network Transaction Distinction**
  - **Validates: Requirements 8.3**

- [ ]* 10.8 Write property test for cross-network privacy preservation
  - **Property 24: Cross-Network Privacy Preservation**
  - **Validates: Requirements 8.5**

- [ ] 11. Update documentation and help content
  - Replace all Aptos references with QIE information
  - Update setup and usage instructions
  - Add QIE-specific troubleshooting guides
  - _Requirements: 5.5, 7.4_

- [ ] 11.1 Update all documentation for QIE
  - Replace Aptos setup instructions with QIE/MetaMask
  - Update API documentation for new endpoints
  - Add QIE testnet configuration guides
  - _Requirements: 5.5, 7.4_

- [ ]* 11.2 Write property test for QIE documentation consistency
  - **Property 16: QIE Documentation Consistency**
  - **Validates: Requirements 5.5**

- [ ] 12. Final testing and validation
  - Run comprehensive test suite on QIE testnet
  - Validate all privacy features work correctly
  - Test complete user workflows end-to-end
  - _Requirements: 7.5_

- [ ] 12.1 Execute comprehensive QIE testing
  - Test stealth address generation and payments
  - Validate event monitoring and fund withdrawal
  - Verify MetaMask integration and user experience
  - _Requirements: 7.5_

- [ ]* 12.2 Write property test for QIE transaction data format
  - **Property 17: QIE Transaction Data Format**
  - **Validates: Requirements 6.2**

- [ ] 13. Final Checkpoint - Complete migration validation
  - Ensure all tests pass, ask the user if questions arise.