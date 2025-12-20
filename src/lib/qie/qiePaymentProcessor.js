/**
 * QIE Payment Processor
 * Handles QIE token transfers, gas fee calculation, and transaction processing
 */

import { ethers } from 'ethers';
import { qieBlockchainService } from './qieBlockchainService.js';
import { QIE_CONFIG } from '../../config/qie-config.js';

class QIEPaymentProcessor {
  constructor() {
    this.gasBuffer = 1.2; // 20% buffer for gas estimates
    this.maxGasPrice = ethers.parseUnits('100', 'gwei'); // Maximum gas price
    this.minGasPrice = ethers.parseUnits('1', 'gwei'); // Minimum gas price
  }

  /**
   * Process a QIE token transfer
   */
  async processTokenTransfer(params) {
    const {
      fromAddress,
      toAddress,
      amount,
      gasLimit,
      gasPrice,
      maxFeePerGas,
      maxPriorityFeePerGas
    } = params;

    try {
      // Validate inputs
      await this.validateTransferParams(params);

      // Create fresh provider and signer to avoid network caching issues
      if (!window.ethereum) {
        throw new Error('MetaMask not found');
      }

      // Create a fresh provider instance
      const freshProvider = new ethers.BrowserProvider(window.ethereum);
      const freshSigner = await freshProvider.getSigner();

      // Verify we're on the correct network
      const network = await freshProvider.getNetwork();
      console.log('Current network:', Number(network.chainId), 'Expected:', QIE_CONFIG.chainId);
      
      if (Number(network.chainId) !== QIE_CONFIG.chainId) {
        throw new Error(`Please switch to QIE Testnet (Chain ID: ${QIE_CONFIG.chainId}). Currently on Chain ID: ${network.chainId}`);
      }

      // Calculate gas fees using fresh provider
      const gasConfig = await this.calculateGasFeesWithProvider(freshProvider, {
        gasLimit,
        gasPrice,
        maxFeePerGas,
        maxPriorityFeePerGas
      });

      // Prepare transaction
      const transaction = {
        to: toAddress,
        value: ethers.parseEther(amount.toString()),
        gasLimit: gasConfig.gasLimit,
        ...gasConfig.feeData
      };

      console.log('Sending transaction:', transaction);

      // Send transaction with fresh signer
      const txResponse = await freshSigner.sendTransaction(transaction);
      console.log('Transaction sent:', txResponse.hash);

      // Wait for transaction receipt
      const receipt = await freshProvider.waitForTransaction(txResponse.hash, 1);
      console.log('Transaction confirmed:', receipt);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
        status: receipt.status,
        confirmations: 1,
        explorerUrl: this.getExplorerUrl(receipt.hash)
      };

    } catch (error) {
      console.error('Token transfer failed:', error);
      throw this.handleTransferError(error);
    }
  }

  /**
   * Process a stealth payment
   */
  async processStealthPayment(params) {
    const {
      recipient,
      metaIndex,
      k,
      ephemeralPubKey,
      stealthAddress,
      viewHint,
      amount,
      gasConfig
    } = params;

    try {
      // Validate stealth payment params
      await this.validateStealthPaymentParams(params);

      // Initialize blockchain service if needed
      if (!qieBlockchainService.isInitialized) {
        await qieBlockchainService.initialize();
      }

      // Calculate gas fees for contract interaction
      const calculatedGasConfig = await this.calculateContractGasFees(gasConfig);

      // Send stealth payment through contract
      const result = await qieBlockchainService.sendPrivatePayment({
        recipient,
        metaIndex,
        k,
        ephemeralPubKey,
        stealthAddress,
        viewHint,
        amount: ethers.parseEther(amount.toString()),
        ...calculatedGasConfig
      });

      return {
        success: true,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        stealthAddress: result.stealthAddress,
        explorerUrl: this.getExplorerUrl(result.transactionHash)
      };

    } catch (error) {
      console.error('Stealth payment failed:', error);
      throw this.handleTransferError(error);
    }
  }

  /**
   * Calculate gas fees for transactions with specific provider
   */
  async calculateGasFeesWithProvider(provider, params = {}) {
    try {
      const { gasLimit, gasPrice, maxFeePerGas, maxPriorityFeePerGas } = params;

      // Get current network gas data
      const feeData = await provider.getFeeData();

      let calculatedGasLimit = gasLimit;
      if (!calculatedGasLimit) {
        // Estimate gas for basic transfer
        calculatedGasLimit = 21000; // Standard ETH transfer
      }

      // Apply gas buffer
      calculatedGasLimit = Math.floor(calculatedGasLimit * this.gasBuffer);

      // Determine fee structure (EIP-1559 vs legacy)
      let feeConfig = {};

      if (maxFeePerGas || maxPriorityFeePerGas || feeData.maxFeePerGas) {
        // EIP-1559 transaction
        feeConfig = {
          maxFeePerGas: maxFeePerGas ? ethers.parseUnits(maxFeePerGas.toString(), 'gwei') : 
                       BigInt(feeData.maxFeePerGas || feeData.gasPrice),
          maxPriorityFeePerGas: maxPriorityFeePerGas ? ethers.parseUnits(maxPriorityFeePerGas.toString(), 'gwei') :
                               BigInt(feeData.maxPriorityFeePerGas || '2000000000') // 2 gwei default
        };

        // Validate fee limits
        if (feeConfig.maxFeePerGas > this.maxGasPrice) {
          feeConfig.maxFeePerGas = this.maxGasPrice;
        }
        if (feeConfig.maxFeePerGas < this.minGasPrice) {
          feeConfig.maxFeePerGas = this.minGasPrice;
        }
      } else {
        // Legacy transaction
        const calculatedGasPrice = gasPrice ? ethers.parseUnits(gasPrice.toString(), 'gwei') :
                                   BigInt(feeData.gasPrice);

        feeConfig = {
          gasPrice: calculatedGasPrice > this.maxGasPrice ? this.maxGasPrice :
                   calculatedGasPrice < this.minGasPrice ? this.minGasPrice : calculatedGasPrice
        };
      }

      return {
        gasLimit: calculatedGasLimit,
        feeData: feeConfig
      };

    } catch (error) {
      console.error('Gas calculation failed:', error);
      throw new Error(`Failed to calculate gas fees: ${error.message}`);
    }
  }

  /**
   * Calculate gas fees for transactions
   */
  async calculateGasFees(params = {}) {
    try {
      const { gasLimit, gasPrice, maxFeePerGas, maxPriorityFeePerGas } = params;

      // Get current network gas data
      const feeData = await qieBlockchainService.getGasPrice();

      let calculatedGasLimit = gasLimit;
      if (!calculatedGasLimit) {
        // Estimate gas for basic transfer
        calculatedGasLimit = 21000; // Standard ETH transfer
      }

      // Apply gas buffer
      calculatedGasLimit = Math.floor(calculatedGasLimit * this.gasBuffer);

      // Determine fee structure (EIP-1559 vs legacy)
      let feeConfig = {};

      if (maxFeePerGas || maxPriorityFeePerGas || feeData.maxFeePerGas) {
        // EIP-1559 transaction
        feeConfig = {
          maxFeePerGas: maxFeePerGas ? ethers.parseUnits(maxFeePerGas.toString(), 'gwei') : 
                       BigInt(feeData.maxFeePerGas || feeData.gasPrice),
          maxPriorityFeePerGas: maxPriorityFeePerGas ? ethers.parseUnits(maxPriorityFeePerGas.toString(), 'gwei') :
                               BigInt(feeData.maxPriorityFeePerGas || '2000000000') // 2 gwei default
        };

        // Validate fee limits
        if (feeConfig.maxFeePerGas > this.maxGasPrice) {
          feeConfig.maxFeePerGas = this.maxGasPrice;
        }
        if (feeConfig.maxFeePerGas < this.minGasPrice) {
          feeConfig.maxFeePerGas = this.minGasPrice;
        }
      } else {
        // Legacy transaction
        const calculatedGasPrice = gasPrice ? ethers.parseUnits(gasPrice.toString(), 'gwei') :
                                   BigInt(feeData.gasPrice);

        feeConfig = {
          gasPrice: calculatedGasPrice > this.maxGasPrice ? this.maxGasPrice :
                   calculatedGasPrice < this.minGasPrice ? this.minGasPrice : calculatedGasPrice
        };
      }

      return {
        gasLimit: calculatedGasLimit,
        feeData: feeConfig
      };

    } catch (error) {
      console.error('Gas calculation failed:', error);
      throw new Error(`Failed to calculate gas fees: ${error.message}`);
    }
  }

  /**
   * Calculate gas fees for contract interactions
   */
  async calculateContractGasFees(gasConfig = {}) {
    try {
      // Contract interactions typically require more gas
      const baseGasLimit = gasConfig.gasLimit || 150000; // Higher default for contracts
      
      return await this.calculateGasFees({
        ...gasConfig,
        gasLimit: baseGasLimit
      });
    } catch (error) {
      console.error('Contract gas calculation failed:', error);
      throw error;
    }
  }

  /**
   * Estimate gas for a specific transaction
   */
  async estimateTransactionGas(transaction) {
    try {
      if (!qieBlockchainService.provider) {
        throw new Error('Provider not initialized');
      }

      const gasEstimate = await qieBlockchainService.estimateGas(transaction);
      return Math.floor(parseInt(gasEstimate) * this.gasBuffer);
    } catch (error) {
      console.error('Gas estimation failed:', error);
      // Return a safe default if estimation fails
      return transaction.to && transaction.data ? 150000 : 21000;
    }
  }

  /**
   * Get current gas price recommendations
   */
  async getGasPriceRecommendations() {
    try {
      const feeData = await qieBlockchainService.getGasPrice();
      
      const baseGasPrice = BigInt(feeData.gasPrice || '1000000000'); // 1 gwei fallback
      const baseFee = BigInt(feeData.maxFeePerGas || baseGasPrice);
      const priorityFee = BigInt(feeData.maxPriorityFeePerGas || '1000000000');

      return {
        slow: {
          gasPrice: ethers.formatUnits(baseGasPrice, 'gwei'),
          maxFeePerGas: ethers.formatUnits(baseFee, 'gwei'),
          maxPriorityFeePerGas: ethers.formatUnits(priorityFee, 'gwei'),
          estimatedTime: '5-10 minutes'
        },
        standard: {
          gasPrice: ethers.formatUnits(baseGasPrice * BigInt(120) / BigInt(100), 'gwei'),
          maxFeePerGas: ethers.formatUnits(baseFee * BigInt(120) / BigInt(100), 'gwei'),
          maxPriorityFeePerGas: ethers.formatUnits(priorityFee * BigInt(120) / BigInt(100), 'gwei'),
          estimatedTime: '2-5 minutes'
        },
        fast: {
          gasPrice: ethers.formatUnits(baseGasPrice * BigInt(150) / BigInt(100), 'gwei'),
          maxFeePerGas: ethers.formatUnits(baseFee * BigInt(150) / BigInt(100), 'gwei'),
          maxPriorityFeePerGas: ethers.formatUnits(priorityFee * BigInt(150) / BigInt(100), 'gwei'),
          estimatedTime: '30 seconds - 2 minutes'
        }
      };
    } catch (error) {
      console.error('Failed to get gas price recommendations:', error);
      throw error;
    }
  }

  /**
   * Calculate transaction cost
   */
  calculateTransactionCost(gasLimit, gasPrice, amount = '0') {
    try {
      const gasCost = BigInt(gasLimit) * BigInt(gasPrice);
      const transferAmount = ethers.parseEther(amount.toString());
      const totalCost = gasCost + transferAmount;

      return {
        gasCost: ethers.formatEther(gasCost),
        transferAmount: ethers.formatEther(transferAmount),
        totalCost: ethers.formatEther(totalCost),
        gasCostWei: gasCost.toString(),
        transferAmountWei: transferAmount.toString(),
        totalCostWei: totalCost.toString()
      };
    } catch (error) {
      console.error('Cost calculation failed:', error);
      throw error;
    }
  }

  /**
   * Validate transfer parameters
   */
  async validateTransferParams(params) {
    const { fromAddress, toAddress, amount } = params;

    if (!fromAddress || !ethers.isAddress(fromAddress)) {
      throw new Error('Invalid sender address');
    }

    if (!toAddress || !ethers.isAddress(toAddress)) {
      throw new Error('Invalid recipient address');
    }

    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Skip balance check to avoid network issues
    // Balance will be checked by MetaMask during transaction
    console.log('Validation passed for transfer:', { fromAddress, toAddress, amount });

    return true;
  }

  /**
   * Validate stealth payment parameters
   */
  async validateStealthPaymentParams(params) {
    const { recipient, metaIndex, k, ephemeralPubKey, stealthAddress, viewHint, amount } = params;

    if (!recipient || !ethers.isAddress(recipient)) {
      throw new Error('Invalid recipient address');
    }

    if (typeof metaIndex !== 'number' || metaIndex < 0) {
      throw new Error('Invalid meta address index');
    }

    if (typeof k !== 'number' || k < 0) {
      throw new Error('Invalid k value');
    }

    if (!ephemeralPubKey || ephemeralPubKey.length !== 66) {
      throw new Error('Invalid ephemeral public key');
    }

    if (!stealthAddress || !ethers.isAddress(stealthAddress)) {
      throw new Error('Invalid stealth address');
    }

    if (typeof viewHint !== 'number') {
      throw new Error('Invalid view hint');
    }

    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    return true;
  }

  /**
   * Handle transfer errors with user-friendly messages
   */
  handleTransferError(error) {
    if (error.code === 'ACTION_REJECTED') {
      return new Error('Transaction was rejected by user');
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      return new Error('Insufficient funds for transaction');
    } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('network changed')) {
      return new Error('Network error. Please ensure you are on QIE Testnet and try again.');
    } else if (error.message?.includes('Chain ID')) {
      return new Error('Wrong network. Please switch to QIE Testnet in MetaMask.');
    } else if (error.message?.includes('gas')) {
      return new Error('Transaction failed due to gas issues. Try increasing gas limit.');
    } else if (error.message?.includes('nonce')) {
      return new Error('Transaction nonce error. Please try again.');
    } else if (error.message?.includes('replacement')) {
      return new Error('Transaction replacement error. Please wait and try again.');
    }
    
    return error;
  }

  /**
   * Get explorer URL for transaction
   */
  getExplorerUrl(txHash) {
    return `${QIE_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`;
  }

  /**
   * Format QIE amount for display
   */
  formatQIEAmount(amount, decimals = 4) {
    try {
      const formatted = ethers.formatEther(amount.toString());
      return parseFloat(formatted).toFixed(decimals);
    } catch (error) {
      console.error('Amount formatting failed:', error);
      return '0.0000';
    }
  }

  /**
   * Parse QIE amount from string
   */
  parseQIEAmount(amount) {
    try {
      return ethers.parseEther(amount.toString());
    } catch (error) {
      console.error('Amount parsing failed:', error);
      throw new Error('Invalid amount format');
    }
  }
}

// Export singleton instance
export const qiePaymentProcessor = new QIEPaymentProcessor();
export default QIEPaymentProcessor;