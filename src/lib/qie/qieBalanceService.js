/**
 * QIE Balance Service
 * Service for managing and displaying QIE token balances with proper formatting
 */

import { ethers } from 'ethers';
import { qieBlockchainService } from './qieBlockchainService.js';
import { qieWithdrawalService } from './qieWithdrawalService.js';
import { weiToQIE, formatQIEAmount } from '../../utils/qie-utils.js';

class QIEBalanceService {
  constructor() {
    this.blockchainService = qieBlockchainService;
    this.withdrawalService = qieWithdrawalService;
    this.priceCache = null;
    this.priceLastUpdated = null;
    this.PRICE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Initialize the balance service
   */
  async initialize() {
    if (!this.blockchainService.isInitialized) {
      await this.blockchainService.initialize();
    }
  }

  /**
   * Get main wallet balance for QIE address
   * @param {string} address - QIE wallet address
   * @returns {Object} Balance information
   */
  async getMainWalletBalance(address) {
    try {
      await this.initialize();

      if (!ethers.isAddress(address)) {
        throw new Error('Invalid QIE address');
      }

      const balanceWei = await this.blockchainService.provider.getBalance(address);
      const balanceQIE = weiToQIE(balanceWei.toString());

      return {
        address,
        balanceWei: balanceWei.toString(),
        balanceQIE: parseFloat(balanceQIE),
        formattedBalance: formatQIEAmount(balanceQIE, false, 4),
        symbol: 'QIE',
        decimals: 18
      };
    } catch (error) {
      console.error('Failed to get main wallet balance:', error);
      throw error;
    }
  }

  /**
   * Get stealth address balances for a meta address
   * @param {string} spendPrivateKey - User's spend private key
   * @param {string} viewingPrivateKey - User's viewing private key
   * @param {string} spendPublicKey - User's spend public key
   * @param {number} fromBlock - Starting block for scanning
   * @returns {Object} Stealth balance information
   */
  async getStealthBalances(spendPrivateKey, viewingPrivateKey, spendPublicKey, fromBlock = 0) {
    try {
      await this.initialize();

      const withdrawablePayments = await this.withdrawalService.scanForWithdrawablePayments(
        spendPrivateKey,
        viewingPrivateKey,
        spendPublicKey,
        fromBlock
      );

      const totalBalanceWei = withdrawablePayments.reduce((sum, payment) => 
        sum + BigInt(payment.balance), 0n);

      const totalBalanceQIE = weiToQIE(totalBalanceWei.toString());

      return {
        totalBalanceWei: totalBalanceWei.toString(),
        totalBalanceQIE: parseFloat(totalBalanceQIE),
        formattedBalance: formatQIEAmount(totalBalanceQIE, false, 4),
        paymentCount: withdrawablePayments.length,
        payments: withdrawablePayments.map(payment => ({
          stealthAddress: payment.stealthAddress,
          balanceWei: payment.balance,
          balanceQIE: parseFloat(payment.balanceQIE),
          formattedBalance: formatQIEAmount(payment.balanceQIE, false, 4),
          transactionHash: payment.transactionHash,
          timestamp: payment.timestamp
        })),
        symbol: 'QIE',
        decimals: 18
      };
    } catch (error) {
      console.error('Failed to get stealth balances:', error);
      throw error;
    }
  }

  /**
   * Get combined balance (main wallet + stealth addresses)
   * @param {string} mainAddress - Main QIE wallet address
   * @param {string} spendPrivateKey - User's spend private key
   * @param {string} viewingPrivateKey - User's viewing private key
   * @param {string} spendPublicKey - User's spend public key
   * @param {number} fromBlock - Starting block for scanning
   * @returns {Object} Combined balance information
   */
  async getCombinedBalance(mainAddress, spendPrivateKey, viewingPrivateKey, spendPublicKey, fromBlock = 0) {
    try {
      const [mainBalance, stealthBalances] = await Promise.all([
        this.getMainWalletBalance(mainAddress),
        this.getStealthBalances(spendPrivateKey, viewingPrivateKey, spendPublicKey, fromBlock)
      ]);

      const totalBalanceQIE = mainBalance.balanceQIE + stealthBalances.totalBalanceQIE;
      const totalBalanceWei = (BigInt(mainBalance.balanceWei) + BigInt(stealthBalances.totalBalanceWei)).toString();

      return {
        mainWallet: mainBalance,
        stealthAddresses: stealthBalances,
        combined: {
          totalBalanceWei,
          totalBalanceQIE,
          formattedBalance: formatQIEAmount(totalBalanceQIE.toString(), false, 4),
          symbol: 'QIE',
          decimals: 18
        }
      };
    } catch (error) {
      console.error('Failed to get combined balance:', error);
      throw error;
    }
  }

  /**
   * Get QIE price information (placeholder - would integrate with price API)
   * @returns {Object} Price information
   */
  async getQIEPrice() {
    try {
      // Check cache first
      if (this.priceCache && this.priceLastUpdated && 
          Date.now() - this.priceLastUpdated < this.PRICE_CACHE_DURATION) {
        return this.priceCache;
      }

      // In a real implementation, this would fetch from a price API
      // For now, return placeholder data
      const priceData = {
        price: 0.0, // Placeholder - QIE price in USD
        change24h: 0.0,
        change24hPercent: 0.0,
        marketCap: 0,
        volume24h: 0,
        lastUpdated: Date.now(),
        currency: 'USD'
      };

      this.priceCache = priceData;
      this.priceLastUpdated = Date.now();

      return priceData;
    } catch (error) {
      console.error('Failed to get QIE price:', error);
      // Return default values on error
      return {
        price: 0.0,
        change24h: 0.0,
        change24hPercent: 0.0,
        marketCap: 0,
        volume24h: 0,
        lastUpdated: Date.now(),
        currency: 'USD'
      };
    }
  }

  /**
   * Format balance with USD value (when price is available)
   * @param {number} qieAmount - Amount in QIE
   * @param {number} decimals - Decimal places for QIE amount
   * @returns {Object} Formatted balance with USD value
   */
  async formatBalanceWithUSD(qieAmount, decimals = 4) {
    try {
      const priceData = await this.getQIEPrice();
      const usdValue = qieAmount * priceData.price;

      return {
        qie: {
          amount: qieAmount,
          formatted: formatQIEAmount(qieAmount.toString(), false, decimals),
          symbol: 'QIE'
        },
        usd: {
          amount: usdValue,
          formatted: usdValue > 0 ? `$${usdValue.toFixed(2)}` : '$0.00',
          symbol: 'USD'
        },
        price: priceData.price
      };
    } catch (error) {
      console.error('Failed to format balance with USD:', error);
      return {
        qie: {
          amount: qieAmount,
          formatted: formatQIEAmount(qieAmount.toString(), false, decimals),
          symbol: 'QIE'
        },
        usd: {
          amount: 0,
          formatted: '$0.00',
          symbol: 'USD'
        },
        price: 0
      };
    }
  }

  /**
   * Get balance history for charting (integrates with existing balance chart)
   * @param {string} address - QIE wallet address
   * @param {number} days - Number of days of history
   * @returns {Array} Balance history data
   */
  async getBalanceHistory(address, days = 7) {
    try {
      // This would integrate with the existing balance chart logic
      // For now, return current balance as a single point
      const currentBalance = await this.getMainWalletBalance(address);
      const today = new Date().toISOString().split('T')[0];

      return [{
        date: today,
        balance: currentBalance.balanceQIE,
        balanceWei: currentBalance.balanceWei
      }];
    } catch (error) {
      console.error('Failed to get balance history:', error);
      return [];
    }
  }

  /**
   * Monitor balance changes and emit events
   * @param {string} address - Address to monitor
   * @param {Function} callback - Callback function for balance updates
   */
  async startBalanceMonitoring(address, callback) {
    try {
      await this.initialize();

      if (!ethers.isAddress(address)) {
        throw new Error('Invalid QIE address');
      }

      let lastBalance = null;

      const checkBalance = async () => {
        try {
          const balance = await this.getMainWalletBalance(address);
          
          if (lastBalance === null || balance.balanceWei !== lastBalance) {
            lastBalance = balance.balanceWei;
            callback(balance);
            
            // Emit balance update event for UI components
            window.dispatchEvent(new CustomEvent('qie-balance-updated', {
              detail: balance
            }));
          }
        } catch (error) {
          console.error('Error checking balance:', error);
        }
      };

      // Check balance immediately
      await checkBalance();

      // Set up periodic balance checking (every 10 seconds)
      const intervalId = setInterval(checkBalance, 10000);

      // Return cleanup function
      return () => {
        clearInterval(intervalId);
      };
    } catch (error) {
      console.error('Failed to start balance monitoring:', error);
      throw error;
    }
  }

  /**
   * Get balance display configuration for UI components
   * @returns {Object} Display configuration
   */
  getBalanceDisplayConfig() {
    return {
      symbol: 'QIE',
      decimals: 18,
      displayDecimals: 4,
      minDisplayDecimals: 2,
      maxDisplayDecimals: 6,
      thousandsSeparator: ',',
      decimalSeparator: '.',
      symbolPosition: 'after', // 'before' or 'after'
      showUSD: true,
      showPrice: true,
      colors: {
        positive: '#10b981', // green-500
        negative: '#ef4444', // red-500
        neutral: '#6b7280'   // gray-500
      }
    };
  }
}

// Export singleton instance
export const qieBalanceService = new QIEBalanceService();
export default QIEBalanceService;