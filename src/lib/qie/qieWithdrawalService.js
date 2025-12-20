/**
 * QIE Withdrawal Service
 * Service for handling fund withdrawals from stealth addresses on QIE network
 */

import { ethers } from 'ethers';
import { qieBlockchainService } from './qieBlockchainService.js';
import { deriveStealthPrivateKey, createStealthWallet } from '../../utils/stealth-crypto.js';
import { weiToQIE, qieToWei } from '../../utils/qie-utils.js';

class QIEWithdrawalService {
  constructor() {
    this.blockchainService = qieBlockchainService;
  }

  /**
   * Initialize the withdrawal service
   */
  async initialize() {
    if (!this.blockchainService.isInitialized) {
      await this.blockchainService.initialize();
    }
  }

  /**
   * Scan for withdrawable payments for a meta address
   * @param {string} spendPrivateKey - User's spend private key
   * @param {string} viewingPrivateKey - User's viewing private key
   * @param {string} spendPublicKey - User's spend public key
   * @param {number} fromBlock - Starting block for scanning (default: 0)
   * @returns {Array} Array of withdrawable payments
   */
  async scanForWithdrawablePayments(spendPrivateKey, viewingPrivateKey, spendPublicKey, fromBlock = 0) {
    try {
      // Get payment events from blockchain
      const paymentEvents = await this.blockchainService.getPaymentEvents(fromBlock);
      const withdrawablePayments = [];

      for (const event of paymentEvents) {
        try {
          // Derive stealth private key for this payment
          const stealthPrivateKey = deriveStealthPrivateKey(
            spendPrivateKey,
            event.ephemeralPubKey,
            viewingPrivateKey
          );

          // Create wallet to verify address matches
          const stealthWallet = createStealthWallet(stealthPrivateKey);
          
          if (stealthWallet.address.toLowerCase() === event.stealthAddress.toLowerCase()) {
            // Check if there are funds to withdraw
            const balance = await this.blockchainService.getStealthBalance(event.stealthAddress);
            
            if (BigInt(balance) > 0n) {
              withdrawablePayments.push({
                ...event,
                stealthPrivateKey,
                balance,
                balanceQIE: weiToQIE(balance)
              });
            }
          }
        } catch (error) {
          console.warn('Failed to process payment event:', event, error);
          // Continue processing other events
        }
      }

      return withdrawablePayments;
    } catch (error) {
      console.error('Failed to scan for withdrawable payments:', error);
      throw error;
    }
  }

  /**
   * Withdraw funds from a single stealth address
   * @param {string} stealthPrivateKey - Private key for stealth address
   * @param {string} recipientAddress - Address to receive funds
   * @param {string} amount - Amount to withdraw in wei (optional, defaults to max)
   * @returns {Object} Withdrawal transaction result
   */
  async withdrawFromStealth(stealthPrivateKey, recipientAddress, amount = null) {
    try {
      await this.initialize();

      // Validate recipient address
      if (!ethers.isAddress(recipientAddress)) {
        throw new Error('Invalid recipient address');
      }

      // Use blockchain service to perform withdrawal
      const result = await this.blockchainService.withdrawFromStealthAddress(
        stealthPrivateKey,
        recipientAddress,
        amount
      );

      return {
        ...result,
        withdrawnAmountQIE: weiToQIE(result.withdrawnAmount),
        gasCostQIE: weiToQIE(result.gasCost)
      };
    } catch (error) {
      console.error('Failed to withdraw from stealth address:', error);
      throw error;
    }
  }

  /**
   * Withdraw all available funds from multiple stealth addresses
   * @param {Array} withdrawablePayments - Array of payments with stealth private keys
   * @param {string} recipientAddress - Address to receive all funds
   * @returns {Object} Batch withdrawal results
   */
  async withdrawAllFunds(withdrawablePayments, recipientAddress) {
    try {
      await this.initialize();

      if (!ethers.isAddress(recipientAddress)) {
        throw new Error('Invalid recipient address');
      }

      const withdrawals = withdrawablePayments.map((payment, index) => ({
        stealthPrivateKey: payment.stealthPrivateKey,
        recipientAddress,
        stealthAddress: payment.stealthAddress,
        amount: null, // Withdraw maximum
        index
      }));

      const results = await this.blockchainService.batchWithdrawFromStealthAddresses(withdrawals);

      // Add QIE formatting to results
      const formattedResults = {
        successful: results.successful.map(result => ({
          ...result,
          withdrawnAmountQIE: weiToQIE(result.withdrawnAmount),
          gasCostQIE: weiToQIE(result.gasCost)
        })),
        failed: results.failed,
        totalProcessed: results.totalProcessed,
        totalWithdrawn: results.successful.reduce((sum, result) => 
          sum + BigInt(result.withdrawnAmount), 0n).toString(),
        totalWithdrawnQIE: weiToQIE(
          results.successful.reduce((sum, result) => 
            sum + BigInt(result.withdrawnAmount), 0n).toString()
        )
      };

      return formattedResults;
    } catch (error) {
      console.error('Failed to withdraw all funds:', error);
      throw error;
    }
  }

  /**
   * Get withdrawal summary for a meta address
   * @param {string} spendPrivateKey - User's spend private key
   * @param {string} viewingPrivateKey - User's viewing private key
   * @param {string} spendPublicKey - User's spend public key
   * @param {number} fromBlock - Starting block for scanning
   * @returns {Object} Withdrawal summary
   */
  async getWithdrawalSummary(spendPrivateKey, viewingPrivateKey, spendPublicKey, fromBlock = 0) {
    try {
      const withdrawablePayments = await this.scanForWithdrawablePayments(
        spendPrivateKey,
        viewingPrivateKey,
        spendPublicKey,
        fromBlock
      );

      const totalBalance = withdrawablePayments.reduce((sum, payment) => 
        sum + BigInt(payment.balance), 0n);

      // Estimate total gas costs for all withdrawals
      let totalEstimatedGas = 0n;
      for (const payment of withdrawablePayments) {
        try {
          const gasEstimate = await this.blockchainService.estimateWithdrawalGas(
            payment.stealthAddress,
            '0x0000000000000000000000000000000000000000', // Dummy address for estimation
            payment.balance
          );
          totalEstimatedGas += BigInt(gasEstimate.gasCost);
        } catch (error) {
          // Use default gas estimate if estimation fails
          totalEstimatedGas += 21000n * 20000000000n; // 21k gas * 20 gwei
        }
      }

      const netWithdrawable = totalBalance > totalEstimatedGas ? 
        totalBalance - totalEstimatedGas : 0n;

      return {
        totalPayments: withdrawablePayments.length,
        totalBalance: totalBalance.toString(),
        totalBalanceQIE: weiToQIE(totalBalance.toString()),
        estimatedGasCost: totalEstimatedGas.toString(),
        estimatedGasCostQIE: weiToQIE(totalEstimatedGas.toString()),
        netWithdrawable: netWithdrawable.toString(),
        netWithdrawableQIE: weiToQIE(netWithdrawable.toString()),
        payments: withdrawablePayments.map(payment => ({
          stealthAddress: payment.stealthAddress,
          amount: payment.balance,
          amountQIE: payment.balanceQIE,
          transactionHash: payment.transactionHash,
          timestamp: payment.timestamp
        }))
      };
    } catch (error) {
      console.error('Failed to get withdrawal summary:', error);
      throw error;
    }
  }

  /**
   * Estimate gas cost for a withdrawal
   * @param {string} stealthAddress - Stealth address to withdraw from
   * @param {string} recipientAddress - Recipient address
   * @param {string} amount - Amount to withdraw (optional)
   * @returns {Object} Gas estimation
   */
  async estimateWithdrawalCost(stealthAddress, recipientAddress, amount = null) {
    try {
      await this.initialize();

      const balance = await this.blockchainService.getStealthBalance(stealthAddress);
      const withdrawAmount = amount || balance;

      const gasEstimate = await this.blockchainService.estimateWithdrawalGas(
        stealthAddress,
        recipientAddress,
        withdrawAmount
      );

      return {
        ...gasEstimate,
        gasCostQIE: weiToQIE(gasEstimate.gasCost),
        withdrawAmount,
        withdrawAmountQIE: weiToQIE(withdrawAmount),
        netAmount: (BigInt(withdrawAmount) - BigInt(gasEstimate.gasCost)).toString(),
        netAmountQIE: weiToQIE((BigInt(withdrawAmount) - BigInt(gasEstimate.gasCost)).toString())
      };
    } catch (error) {
      console.error('Failed to estimate withdrawal cost:', error);
      throw error;
    }
  }

  /**
   * Validate withdrawal parameters
   * @param {string} stealthPrivateKey - Stealth private key
   * @param {string} recipientAddress - Recipient address
   * @param {string} amount - Amount to withdraw (optional)
   * @returns {Object} Validation result
   */
  async validateWithdrawal(stealthPrivateKey, recipientAddress, amount = null) {
    const errors = [];
    const warnings = [];

    try {
      // Validate private key format
      if (!stealthPrivateKey || !stealthPrivateKey.startsWith('0x') || stealthPrivateKey.length !== 66) {
        errors.push('Invalid stealth private key format');
      }

      // Validate recipient address
      if (!ethers.isAddress(recipientAddress)) {
        errors.push('Invalid recipient address');
      }

      // Check if we can create wallet from private key
      let stealthWallet;
      try {
        stealthWallet = new ethers.Wallet(stealthPrivateKey);
      } catch (error) {
        errors.push('Cannot create wallet from stealth private key');
      }

      if (stealthWallet) {
        // Check balance
        const balance = await this.blockchainService.getStealthBalance(stealthWallet.address);
        
        if (BigInt(balance) === 0n) {
          errors.push('No funds available in stealth address');
        }

        // Validate amount if specified
        if (amount) {
          const withdrawAmount = BigInt(amount);
          if (withdrawAmount <= 0n) {
            errors.push('Withdrawal amount must be greater than 0');
          }
          
          if (withdrawAmount > BigInt(balance)) {
            errors.push('Withdrawal amount exceeds available balance');
          }
        }

        // Check gas costs
        try {
          const gasEstimate = await this.estimateWithdrawalCost(
            stealthWallet.address,
            recipientAddress,
            amount
          );
          
          if (BigInt(gasEstimate.netAmount) <= 0n) {
            warnings.push('Gas costs will consume most or all of the withdrawal amount');
          }
        } catch (error) {
          warnings.push('Unable to estimate gas costs accurately');
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Validation failed: ' + error.message],
        warnings
      };
    }
  }
}

// Export singleton instance
export const qieWithdrawalService = new QIEWithdrawalService();
export default QIEWithdrawalService;