# QIE Testnet Deployment Guide

This guide explains how to deploy the stealth address contracts to QIE testnet.

## Prerequisites

1. **Install Dependencies**
   ```bash
   cd evm
   npm install
   ```

2. **Configure Private Key**
   Create a `.env` file in the `evm` directory with your private key:
   ```
   PRIVATE_KEY=your_private_key_here
   ```

3. **Get QIE Testnet Tokens**
   - Visit the QIE testnet faucet (if available)
   - Or contact QIE team for testnet tokens
   - Ensure your deployer account has sufficient QIE tokens for gas fees

## Deployment Steps

### 1. Compile Contracts

```bash
npx hardhat compile
```

This will compile:
- `StealthAddressRegistry.sol` - Registry for meta addresses and payment announcements
- `PaymentManager.sol` - Manager for private payments using stealth addresses

### 2. Deploy to QIE Testnet

```bash
npx hardhat run scripts/deploy-qie-contracts.ts --network qie-testnet
```

This script will:
1. Deploy `StealthAddressRegistry` contract
2. Deploy `PaymentManager` contract (with registry address)
3. Save deployment addresses to `deployments/qie-testnet.json`
4. Test basic functionality

### 3. Verify Deployment

After deployment, the script will output:
- StealthAddressRegistry address
- PaymentManager address
- Deployment transaction hashes

The deployment information is saved in:
- `deployments/qie-testnet.json` - Full deployment details
- `qie-config.json` - Network and contract configuration

### 4. Update Environment Variables

Copy the deployed contract addresses to your main `.env` file:

```bash
VITE_QIE_STEALTH_REGISTRY_ADDRESS=<StealthAddressRegistry_address>
VITE_QIE_PAYMENT_MANAGER_ADDRESS=<PaymentManager_address>
```

### 5. Verify on QIE Explorer (Optional)

If QIE testnet supports contract verification:

```bash
npx hardhat verify --network qie-testnet <CONTRACT_ADDRESS> [CONSTRUCTOR_ARGS]
```

For PaymentManager:
```bash
npx hardhat verify --network qie-testnet <PAYMENT_MANAGER_ADDRESS> <REGISTRY_ADDRESS>
```

## Contract Addresses

After deployment, update `qie-config.json` with the actual addresses:

```json
{
  "contracts": {
    "StealthAddressRegistry": {
      "address": "0x...",
      "deploymentBlock": 12345
    },
    "PaymentManager": {
      "address": "0x...",
      "deploymentBlock": 12346
    }
  }
}
```

## Network Configuration

The QIE testnet is configured in `hardhat.config.ts`:

```typescript
'qie-testnet': {
  url: "https://testnet-rpc.qie.digital",
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  chainId: 0x1234, // Update with actual QIE testnet chain ID
  gasPrice: 20000000000, // 20 gwei
  gas: 8000000,
}
```

**Note:** Update the `chainId` with the actual QIE testnet chain ID once confirmed.

## Troubleshooting

### Issue: "Insufficient funds for gas"
- Ensure your deployer account has enough QIE tokens
- Check gas price settings in `hardhat.config.ts`

### Issue: "Network connection failed"
- Verify QIE testnet RPC URL is correct
- Check if QIE testnet is operational
- Try alternative RPC endpoints if available

### Issue: "Contract deployment failed"
- Check Solidity compiler version (0.8.19)
- Verify contract code has no syntax errors
- Review deployment script for errors

## Testing Deployed Contracts

After deployment, you can test the contracts using Hardhat console:

```bash
npx hardhat console --network qie-testnet
```

Then in the console:
```javascript
const registry = await ethers.getContractAt("StealthAddressRegistry", "REGISTRY_ADDRESS");
const paymentManager = await ethers.getContractAt("PaymentManager", "PAYMENT_MANAGER_ADDRESS");

// Test registry
const count = await registry.getMetaAddressCount("YOUR_ADDRESS");
console.log("Meta address count:", count.toString());

// Test payment manager
const registryAddr = await paymentManager.registry();
console.log("Registry address:", registryAddr);
```

## Next Steps

After successful deployment:

1. Update frontend configuration with contract addresses
2. Test stealth address generation with deployed contracts
3. Test payment sending and receiving
4. Monitor contract events for payment announcements
5. Implement withdrawal functionality

## Contract ABIs

The compiled contract ABIs are located in:
- `artifacts/contracts/StealthAddressRegistry.sol/StealthAddressRegistry.json`
- `artifacts/contracts/PaymentManager.sol/PaymentManager.json`

These ABIs are needed for frontend integration.
