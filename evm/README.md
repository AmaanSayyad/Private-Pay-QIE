# QIE Smart Contracts

This directory contains the Solidity smart contracts for PrivatePay on QIE network, implementing stealth address functionality for private payments.

## Overview

The smart contracts provide:
- **StealthAddressRegistry**: Registry for meta addresses and payment announcements
- **PaymentManager**: Manager for private payments using stealth addresses

## Installation

To install dependencies:

```bash
npm install
```

## Compilation

To compile contracts:

```bash
npx hardhat compile
```

## Deployment

To deploy to QIE testnet:

```bash
npx hardhat run scripts/deploy-qie-contracts.ts --network qie-testnet
```

## Testing

To run tests:

```bash
npx hardhat test
```

## Configuration

The contracts are configured for QIE testnet in `hardhat.config.ts`. Update the network settings as needed for your deployment.

For detailed deployment instructions, see [QIE_DEPLOYMENT_GUIDE.md](./QIE_DEPLOYMENT_GUIDE.md).

This project uses Hardhat for smart contract development and deployment on QIE network.
