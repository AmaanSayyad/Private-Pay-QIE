/**
 * QIE Blockchain Service
 * Service for interacting with QIE network and smart contracts
 */

import { ethers } from 'ethers';
import { QIE_CONFIG } from '../../config/qie-config.js';

// Contract ABIs (simplified for now - will be replaced with actual ABIs after compilation)
const STEALTH_REGISTRY_ABI = [
  "function registerMetaAddress(bytes33 spendPub, bytes33 viewingPub) external",
  "function announcePayment(address recipient, uint256 metaAddressIndex, bytes33 ephemeralPubKey, address stealthAddress, uint32 viewHint, uint32 k, uint256 amount) external",
  "function getMetaAddress(address user, uint256 index) external view returns (tuple(bytes33 spendPubKey, bytes33 viewingPubKey, uint256 createdAt))",
  "function getMetaAddressCount(address user) external view returns (uint256)",
  "function getAllMetaAddresses(address user) external view returns (tuple(bytes33 spendPubKey, bytes33 viewingPubKey, uint256 createdAt)[])",
  "event MetaAddressRegistered(address indexed user, uint256 indexed index, bytes33 spendPubKey, bytes33 viewingPubKey, uint256 timestamp)",
  "event PaymentAnnouncement(address indexed recipient, uint256 indexed metaAddressIndex, bytes33 ephemeralPubKey, address stealthAddress, uint32 viewHint, uint32 k, uint256 amount, uint256 timestamp)"
];

const PAYMENT_MANAGER_ABI = [
  "function sendPrivatePayment(address recipient, uint256 metaIndex, uint32 k, bytes33 ephemeralPubKey, address stealthAddress, uint32 viewHint) external payable",
  "function withdrawFromStealth(address payable to) external",
  "function getStealthBalance(address stealthAddress) external view returns (uint256)",
  "function registry() external view returns (address)",
  "event PrivatePaymentSent(address indexed sender, address indexed recipient, uint256 indexed metaAddressIndex, address stealthAddress, uint256 amount, uint256 timestamp)",
  "event StealthWithdrawal(address indexed stealthAddress, address indexed recipient, uint256 amount, uint256 timestamp)"
];

class QIEBlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.registryContract = null;
    this.paymentContract = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the service with provider and contracts
   */
  async initialize() {
    try {
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(QIE_CONFIG.rpcUrls[0]);
      
      // Test connection
      await this.provider.getNetwork();
      
      // Initialize contracts (read-only)
      if (QIE_CONFIG.contracts.StealthAddressRegistry.address) {
        this.registryContract = new ethers.Contract(
          QIE_CONFIG.contracts.StealthAddressRegistry.address,
          STEALTH_REGISTRY_ABI,
          this.provider
        );
      }
      
      if (QIE_CONFIG.contracts.PaymentManager.address) {
        this.paymentContract = new ethers.Contract(
          QIE_CONFIG.contracts.PaymentManager.address,
          PAYMENT_MANAGER_ABI,
          this.provider
        );
      }
      
      this.isInitialized = true;
      console.log('QIE Blockchain Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize QIE Blockchain Service:', error);
      throw error;
    }
  }

  /**
   * Connect to MetaMask and get signer
   */
  async connectWallet() {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await provider.getSigner();
      
      // Update contracts with signer
      if (this.registryContract) {
        this.registryContract = this.registryContract.connect(this.signer);
      }
      
      if (this.paymentContract) {
        this.paymentContract = this.paymentContract.connect(this.signer);
      }
      
      return await this.signer.getAddress();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  /**
   * Get current network information
   */
  async getNetworkInfo() {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    
    const network = await this.provider.getNetwork();
    return {
      chainId: Number(network.chainId),
      name: network.name,
      isQIETestnet: Number(network.chainId) === QIE_CONFIG.chainId
    };
  }

  /**
   * Register a meta address
   */
  async registerMetaAddress(spendPubKey, viewingPubKey) {
    if (!this.registryContract || !this.signer) {
      throw new Error('Contract or signer not available');
    }

    try {
      const tx = await this.registryContract.registerMetaAddress(spendPubKey, viewingPubKey);
      const receipt = await tx.wait();
      
      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Failed to register meta address:', error);
      throw error;
    }
  }

  /**
   * Get meta address for a user
   */
  async getMetaAddress(userAddress, index) {
    if (!this.registryContract) {
      throw new Error('Registry contract not available');
    }

    try {
      const metaAddress = await this.registryContract.getMetaAddress(userAddress, index);
      return {
        spendPubKey: metaAddress.spendPubKey,
        viewingPubKey: metaAddress.viewingPubKey,
        createdAt: Number(metaAddress.createdAt)
      };
    } catch (error) {
      console.error('Failed to get meta address:', error);
      throw error;
    }
  }

  /**
   * Get meta address count for a user
   */
  async getMetaAddressCount(userAddress) {
    if (!this.registryContract) {
      throw new Error('Registry contract not available');
    }

    try {
      const count = await this.registryContract.getMetaAddressCount(userAddress);
      return Number(count);
    } catch (error) {
      console.error('Failed to get meta address count:', error);
      throw error;
    }
  }

  /**
   * Send a private payment
   */
  async sendPrivatePayment(params) {
    if (!this.paymentContract || !this.signer) {
      throw new Error('Payment contract or signer not available');
    }

    const { recipient, metaIndex, k, ephemeralPubKey, stealthAddress, viewHint, amount } = params;

    try {
      const tx = await this.paymentContract.sendPrivatePayment(
        recipient,
        metaIndex,
        k,
        ephemeralPubKey,
        stealthAddress,
        viewHint,
        { value: amount }
      );
      
      const receipt = await tx.wait();
      
      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        stealthAddress
      };
    } catch (error) {
      console.error('Failed to send private payment:', error);
      throw error;
    }
  }

  /**
   * Get stealth address balance
   */
  async getStealthBalance(stealthAddress) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const balance = await this.provider.getBalance(stealthAddress);
      return balance.toString();
    } catch (error) {
      console.error('Failed to get stealth balance:', error);
      throw error;
    }
  }

  /**
   * Withdraw funds from stealth address to main wallet
   */
  async withdrawFromStealthAddress(stealthPrivateKey, recipientAddress, amount = null) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      // Create wallet from stealth private key
      const stealthWallet = new ethers.Wallet(stealthPrivateKey, this.provider);
      const stealthAddress = stealthWallet.address;
      
      // Get current balance
      const balance = await this.provider.getBalance(stealthAddress);
      
      if (balance === 0n) {
        throw new Error('No funds available in stealth address');
      }

      // Calculate withdrawal amount (default to max available minus gas)
      const gasPrice = await this.provider.getFeeData();
      const gasLimit = 21000n; // Standard transfer gas limit
      const gasCost = gasLimit * (gasPrice.gasPrice || gasPrice.maxFeePerGas || 20000000000n);
      
      let withdrawAmount;
      if (amount) {
        withdrawAmount = BigInt(amount);
        if (withdrawAmount + gasCost > balance) {
          throw new Error('Insufficient balance for withdrawal including gas fees');
        }
      } else {
        // Withdraw maximum available minus gas
        withdrawAmount = balance - gasCost;
        if (withdrawAmount <= 0n) {
          throw new Error('Insufficient balance to cover gas fees');
        }
      }

      // Prepare transaction
      const transaction = {
        to: recipientAddress,
        value: withdrawAmount,
        gasLimit: gasLimit,
        gasPrice: gasPrice.gasPrice || gasPrice.maxFeePerGas
      };

      // Send transaction
      const tx = await stealthWallet.sendTransaction(transaction);
      const receipt = await tx.wait();

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        withdrawnAmount: withdrawAmount.toString(),
        stealthAddress,
        recipientAddress,
        gasCost: gasCost.toString()
      };
    } catch (error) {
      console.error('Failed to withdraw from stealth address:', error);
      throw error;
    }
  }

  /**
   * Batch withdraw from multiple stealth addresses
   */
  async batchWithdrawFromStealthAddresses(withdrawals) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const results = [];
    const errors = [];

    for (const withdrawal of withdrawals) {
      try {
        const result = await this.withdrawFromStealthAddress(
          withdrawal.stealthPrivateKey,
          withdrawal.recipientAddress,
          withdrawal.amount
        );
        results.push({
          ...result,
          index: withdrawal.index || results.length
        });
      } catch (error) {
        errors.push({
          index: withdrawal.index || results.length,
          error: error.message,
          stealthAddress: withdrawal.stealthAddress
        });
      }
    }

    return {
      successful: results,
      failed: errors,
      totalProcessed: withdrawals.length
    };
  }

  /**
   * Estimate gas cost for stealth withdrawal
   */
  async estimateWithdrawalGas(stealthAddress, recipientAddress, amount) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const transaction = {
        from: stealthAddress,
        to: recipientAddress,
        value: amount || '1000000000000000000' // 1 QIE for estimation
      };

      const gasEstimate = await this.provider.estimateGas(transaction);
      const gasPrice = await this.provider.getFeeData();
      
      const gasCost = gasEstimate * (gasPrice.gasPrice || gasPrice.maxFeePerGas || 20000000000n);

      return {
        gasLimit: gasEstimate.toString(),
        gasPrice: (gasPrice.gasPrice || gasPrice.maxFeePerGas).toString(),
        gasCost: gasCost.toString()
      };
    } catch (error) {
      console.error('Failed to estimate withdrawal gas:', error);
      throw error;
    }
  }

  /**
   * Monitor payment events
   */
  async getPaymentEvents(fromBlock = 0, toBlock = 'latest') {
    if (!this.registryContract) {
      throw new Error('Registry contract not available');
    }

    try {
      const filter = this.registryContract.filters.PaymentAnnouncement();
      const events = await this.registryContract.queryFilter(filter, fromBlock, toBlock);
      
      return events.map(event => ({
        recipient: event.args.recipient,
        metaAddressIndex: Number(event.args.metaAddressIndex),
        ephemeralPubKey: event.args.ephemeralPubKey,
        stealthAddress: event.args.stealthAddress,
        viewHint: Number(event.args.viewHint),
        k: Number(event.args.k),
        amount: event.args.amount.toString(),
        timestamp: Number(event.args.timestamp),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      }));
    } catch (error) {
      console.error('Failed to get payment events:', error);
      throw error;
    }
  }

  /**
   * Start real-time event monitoring
   */
  startEventMonitoring(callback) {
    if (!this.registryContract) {
      throw new Error('Registry contract not available');
    }

    const filter = this.registryContract.filters.PaymentAnnouncement();
    
    this.registryContract.on(filter, (recipient, metaAddressIndex, ephemeralPubKey, stealthAddress, viewHint, k, amount, timestamp, event) => {
      const paymentEvent = {
        recipient,
        metaAddressIndex: Number(metaAddressIndex),
        ephemeralPubKey,
        stealthAddress,
        viewHint: Number(viewHint),
        k: Number(k),
        amount: amount.toString(),
        timestamp: Number(timestamp),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      };
      
      callback(paymentEvent);
    });
  }

  /**
   * Stop event monitoring
   */
  stopEventMonitoring() {
    if (this.registryContract) {
      this.registryContract.removeAllListeners();
    }
  }

  /**
   * Validate QIE address
   */
  isValidAddress(address) {
    return ethers.isAddress(address);
  }

  /**
   * Get current gas price
   */
  async getGasPrice() {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const gasPrice = await this.provider.getFeeData();
      return {
        gasPrice: gasPrice.gasPrice?.toString(),
        maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString()
      };
    } catch (error) {
      console.error('Failed to get gas price:', error);
      throw error;
    }
  }

  /**
   * Validate transaction before sending
   */
  async validateTransaction(transaction) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      // Validate addresses
      if (transaction.to && !ethers.isAddress(transaction.to)) {
        throw new Error('Invalid recipient address');
      }

      if (transaction.from && !ethers.isAddress(transaction.from)) {
        throw new Error('Invalid sender address');
      }

      // Validate amount
      if (transaction.value && transaction.value < 0) {
        throw new Error('Transaction value cannot be negative');
      }

      // Check balance if sender is specified
      if (transaction.from) {
        const balance = await this.provider.getBalance(transaction.from);
        const totalCost = BigInt(transaction.value || 0) + BigInt(transaction.gasLimit || 21000) * BigInt(transaction.gasPrice || 0);
        
        if (balance < totalCost) {
          throw new Error('Insufficient balance for transaction');
        }
      }

      return true;
    } catch (error) {
      console.error('Transaction validation failed:', error);
      throw error;
    }
  }

  /**
   * Monitor transaction status
   */
  async monitorTransaction(txHash, maxWaitTime = 300000) { // 5 minutes default
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const startTime = Date.now();
      
      while (Date.now() - startTime < maxWaitTime) {
        const receipt = await this.provider.getTransactionReceipt(txHash);
        
        if (receipt) {
          return {
            hash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            status: receipt.status,
            confirmations: await receipt.confirmations(),
            timestamp: Date.now()
          };
        }
        
        // Wait 2 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      throw new Error('Transaction monitoring timeout');
    } catch (error) {
      console.error('Failed to monitor transaction:', error);
      throw error;
    }
  }

  /**
   * Get transaction history for an address
   */
  async getTransactionHistory(address, fromBlock = 0, toBlock = 'latest') {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    if (!ethers.isAddress(address)) {
      throw new Error('Invalid address format');
    }

    try {
      // Get sent transactions
      const sentFilter = {
        fromBlock,
        toBlock,
        from: address
      };

      // Get received transactions  
      const receivedFilter = {
        fromBlock,
        toBlock,
        to: address
      };

      // Note: This is a simplified implementation
      // In production, you'd want to use event logs or a more efficient method
      const currentBlock = await this.provider.getBlockNumber();
      const transactions = [];

      // Scan recent blocks for transactions involving this address
      const blocksToScan = Math.min(1000, currentBlock - fromBlock); // Limit scan range
      
      for (let i = 0; i < blocksToScan; i++) {
        const blockNumber = currentBlock - i;
        const block = await this.provider.getBlock(blockNumber, true);
        
        if (block && block.transactions) {
          for (const tx of block.transactions) {
            if (tx.from === address || tx.to === address) {
              transactions.push({
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: tx.value.toString(),
                gasPrice: tx.gasPrice?.toString(),
                gasLimit: tx.gasLimit.toString(),
                blockNumber: tx.blockNumber,
                timestamp: block.timestamp
              });
            }
          }
        }
      }

      return transactions.sort((a, b) => b.blockNumber - a.blockNumber);
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      throw error;
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(transaction) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const gasEstimate = await this.provider.estimateGas(transaction);
      return gasEstimate.toString();
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      throw error;
    }
  }

  /**
   * Get block information
   */
  async getBlock(blockNumber = 'latest') {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const block = await this.provider.getBlock(blockNumber);
      return {
        number: block.number,
        hash: block.hash,
        timestamp: block.timestamp,
        gasLimit: block.gasLimit.toString(),
        gasUsed: block.gasUsed.toString(),
        transactionCount: block.transactions.length
      };
    } catch (error) {
      console.error('Failed to get block:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const qieBlockchainService = new QIEBlockchainService();
export default QIEBlockchainService;