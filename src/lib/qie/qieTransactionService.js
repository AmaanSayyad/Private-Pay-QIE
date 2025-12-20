import { ethers } from 'ethers';
import { QIE_CONFIG } from '../../config/qie-config.js';
import { getQIETransactionUrl } from '../../utils/qie-utils.js';
import { qiePaymentProcessor } from './qiePaymentProcessor.js';

/**
 * QIE Transaction Service
 * Handles QIE blockchain transactions with enhanced payment processing
 */

/**
 * Send QIE native token transfer
 * @param {Object} params - Transaction parameters
 * @param {string} params.accountAddress - Sender address
 * @param {string} params.recipientAddress - Recipient address
 * @param {number} params.amount - Amount in QIE
 * @param {boolean} params.isTestnet - Whether using testnet
 * @param {Object} params.gasConfig - Gas configuration options
 * @returns {Promise<Object>} Transaction result
 */
export const sendQIETransfer = async ({
  accountAddress,
  recipientAddress,
  amount,
  isTestnet = true,
  gasConfig = {}
}) => {
  try {
    // Use the enhanced payment processor
    const result = await qiePaymentProcessor.processTokenTransfer({
      fromAddress: accountAddress,
      toAddress: recipientAddress,
      amount,
      ...gasConfig
    });

    return {
      success: result.success,
      hash: result.transactionHash,
      blockNumber: result.blockNumber,
      gasUsed: result.gasUsed,
      effectiveGasPrice: result.effectiveGasPrice,
      explorerUrl: result.explorerUrl,
      status: result.status,
      confirmations: result.confirmations
    };

  } catch (error) {
    console.error('QIE transfer error:', error);
    throw error;
  }
};

/**
 * Get QIE account balance
 * @param {string} address - Account address
 * @returns {Promise<Object>} Balance information
 */
export const getQIEBalance = async (address) => {
  try {
    if (!ethers.isAddress(address)) {
      throw new Error('Invalid address format');
    }

    const provider = new ethers.JsonRpcProvider(QIE_CONFIG.rpcUrls[0]);
    const balance = await provider.getBalance(address);
    
    return {
      wei: balance.toString(),
      qie: ethers.formatEther(balance),
      formatted: parseFloat(ethers.formatEther(balance)).toFixed(4),
    };
  } catch (error) {
    console.error('Error getting QIE balance:', error);
    throw error;
  }
};

/**
 * Get QIE transaction details
 * @param {string} txHash - Transaction hash
 * @returns {Promise<Object>} Transaction details
 */
export const getQIETransaction = async (txHash) => {
  try {
    if (!txHash || !txHash.startsWith('0x')) {
      throw new Error('Invalid transaction hash');
    }

    const provider = new ethers.JsonRpcProvider(QIE_CONFIG.rpcUrls[0]);
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!tx) {
      throw new Error('Transaction not found');
    }

    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: ethers.formatEther(tx.value),
      gasLimit: tx.gasLimit.toString(),
      gasPrice: tx.gasPrice?.toString(),
      gasUsed: receipt?.gasUsed?.toString(),
      blockNumber: tx.blockNumber,
      blockHash: tx.blockHash,
      status: receipt?.status,
      confirmations: await tx.confirmations(),
      explorerUrl: getQIETransactionUrl(txHash),
    };
  } catch (error) {
    console.error('Error getting QIE transaction:', error);
    throw error;
  }
};

/**
 * Wait for QIE transaction confirmation
 * @param {string} txHash - Transaction hash
 * @param {number} confirmations - Number of confirmations to wait for
 * @returns {Promise<Object>} Transaction receipt
 */
export const waitForQIETransaction = async (txHash, confirmations = 1) => {
  try {
    const provider = new ethers.JsonRpcProvider(QIE_CONFIG.rpcUrls[0]);
    const receipt = await provider.waitForTransaction(txHash, confirmations);
    
    if (!receipt) {
      throw new Error('Transaction not found or failed');
    }

    return {
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status,
      explorerUrl: getQIETransactionUrl(receipt.hash),
    };
  } catch (error) {
    console.error('Error waiting for QIE transaction:', error);
    throw error;
  }
};

/**
 * Get QIE network status
 * @returns {Promise<Object>} Network information
 */
export const getQIENetworkStatus = async () => {
  try {
    const provider = new ethers.JsonRpcProvider(QIE_CONFIG.rpcUrls[0]);
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    const gasPrice = await provider.getFeeData();

    return {
      blockNumber,
      blockTimestamp: block.timestamp,
      gasPrice: gasPrice.gasPrice?.toString(),
      maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString(),
      chainId: QIE_CONFIG.chainId,
      networkName: QIE_CONFIG.chainName,
    };
  } catch (error) {
    console.error('Error getting QIE network status:', error);
    throw error;
  }
};

/**
 * Send stealth payment on QIE
 * @param {Object} params - Stealth payment parameters
 * @returns {Promise<Object>} Transaction result
 */
export const sendQIEStealthPayment = async (params) => {
  try {
    const result = await qiePaymentProcessor.processStealthPayment(params);
    return result;
  } catch (error) {
    console.error('QIE stealth payment error:', error);
    throw error;
  }
};

/**
 * Get gas price recommendations
 * @returns {Promise<Object>} Gas price recommendations
 */
export const getQIEGasPriceRecommendations = async () => {
  try {
    return await qiePaymentProcessor.getGasPriceRecommendations();
  } catch (error) {
    console.error('Error getting gas price recommendations:', error);
    throw error;
  }
};

/**
 * Calculate transaction cost
 * @param {Object} params - Cost calculation parameters
 * @returns {Object} Cost breakdown
 */
export const calculateQIETransactionCost = (params) => {
  try {
    return qiePaymentProcessor.calculateTransactionCost(
      params.gasLimit,
      params.gasPrice,
      params.amount
    );
  } catch (error) {
    console.error('Error calculating transaction cost:', error);
    throw error;
  }
};

/**
 * Estimate gas for transaction
 * @param {Object} transaction - Transaction object
 * @returns {Promise<number>} Gas estimate
 */
export const estimateQIETransactionGas = async (transaction) => {
  try {
    return await qiePaymentProcessor.estimateTransactionGas(transaction);
  } catch (error) {
    console.error('Error estimating gas:', error);
    throw error;
  }
};

/**
 * Store QIE transaction with network marking
 * @param {Object} transactionData - Transaction data to store
 * @returns {Promise<Object>} Storage result
 */
export const storeQIETransaction = async (transactionData) => {
  try {
    // Ensure network is marked as 'qie'
    const qieTransactionData = {
      ...transactionData,
      network: 'qie',
      qie_transaction_hash: transactionData.hash || transactionData.qie_transaction_hash,
      qie_block_number: transactionData.blockNumber || transactionData.qie_block_number,
      gas_used: transactionData.gasUsed || transactionData.gas_used,
      gas_price: transactionData.gasPrice || transactionData.gas_price,
      effective_gas_price: transactionData.effectiveGasPrice || transactionData.effective_gas_price,
    };

    // Store in database (this would typically use a database service)
    console.log('Storing QIE transaction:', qieTransactionData);
    
    return {
      success: true,
      transactionData: qieTransactionData
    };
  } catch (error) {
    console.error('Error storing QIE transaction:', error);
    throw error;
  }
};

/**
 * Mark legacy transactions as Aptos network
 * @param {Array} transactions - Array of transaction objects
 * @returns {Array} Transactions with network marking
 */
export const markLegacyTransactions = (transactions) => {
  return transactions.map(tx => {
    // If no network is specified and transaction is old, mark as Aptos
    if (!tx.network && tx.created_at && new Date(tx.created_at) < new Date('2024-01-01')) {
      return { ...tx, network: 'aptos' };
    }
    // If no network is specified and transaction is new, mark as QIE
    if (!tx.network) {
      return { ...tx, network: 'qie' };
    }
    return tx;
  });
};

export default {
  sendQIETransfer,
  sendQIEStealthPayment,
  getQIEBalance,
  getQIETransaction,
  waitForQIETransaction,
  getQIENetworkStatus,
  getQIEGasPriceRecommendations,
  calculateQIETransactionCost,
  estimateQIETransactionGas,
  storeQIETransaction,
  markLegacyTransactions,
};