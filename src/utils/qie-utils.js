import { QIE_CONFIG } from '../config/qie-config.js';

/**
 * QIE Network Utilities
 * Helper functions for QIE blockchain operations
 */

/**
 * Generate QIE explorer URL for a transaction
 * @param {string} txHash - Transaction hash
 * @returns {string} Explorer URL
 */
export const getQIETransactionUrl = (txHash) => {
  if (!txHash) return '';
  return `${QIE_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`;
};

/**
 * Generate QIE explorer URL for an address
 * @param {string} address - Wallet address
 * @returns {string} Explorer URL
 */
export const getQIEAddressUrl = (address) => {
  if (!address) return '';
  return `${QIE_CONFIG.blockExplorerUrls[0]}/address/${address}`;
};

/**
 * Generate QIE explorer URL for a block
 * @param {number|string} blockNumber - Block number
 * @returns {string} Explorer URL
 */
export const getQIEBlockUrl = (blockNumber) => {
  if (!blockNumber) return '';
  return `${QIE_CONFIG.blockExplorerUrls[0]}/block/${blockNumber}`;
};

/**
 * Format QIE address for display (shortened)
 * @param {string} address - Full address
 * @param {number} startChars - Characters to show at start (default: 6)
 * @param {number} endChars - Characters to show at end (default: 4)
 * @returns {string} Formatted address
 */
export const formatQIEAddress = (address, startChars = 6, endChars = 4) => {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Format QIE transaction hash for display (shortened)
 * @param {string} txHash - Full transaction hash
 * @param {number} startChars - Characters to show at start (default: 6)
 * @param {number} endChars - Characters to show at end (default: 4)
 * @returns {string} Formatted transaction hash
 */
export const formatQIETxHash = (txHash, startChars = 6, endChars = 4) => {
  if (!txHash) return '';
  if (txHash.length <= startChars + endChars) return txHash;
  return `${txHash.slice(0, startChars)}...${txHash.slice(-endChars)}`;
};

/**
 * Validate QIE address format
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid QIE address
 */
export const isValidQIEAddress = (address) => {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Validate QIE transaction hash format
 * @param {string} txHash - Transaction hash to validate
 * @returns {boolean} True if valid QIE transaction hash
 */
export const isValidQIETxHash = (txHash) => {
  if (!txHash) return false;
  return /^0x[a-fA-F0-9]{64}$/.test(txHash);
};

/**
 * Format QIE amount with proper decimals
 * @param {string|number} amount - Amount in wei or QIE
 * @param {boolean} fromWei - Whether amount is in wei (default: false)
 * @param {number} decimals - Decimal places to show (default: 4)
 * @returns {string} Formatted amount
 */
export const formatQIEAmount = (amount, fromWei = false, decimals = 4) => {
  if (!amount) return '0';
  
  let qieAmount;
  if (fromWei) {
    qieAmount = parseFloat(amount) / Math.pow(10, 18);
  } else {
    qieAmount = parseFloat(amount);
  }
  
  return qieAmount.toFixed(decimals);
};

/**
 * Convert QIE amount to wei
 * @param {string|number} qieAmount - Amount in QIE
 * @returns {string} Amount in wei
 */
export const qieToWei = (qieAmount) => {
  if (!qieAmount) return '0';
  return (parseFloat(qieAmount) * Math.pow(10, 18)).toString();
};

/**
 * Convert wei to QIE
 * @param {string|number} weiAmount - Amount in wei
 * @returns {string} Amount in QIE
 */
export const weiToQIE = (weiAmount) => {
  if (!weiAmount) return '0';
  return (parseFloat(weiAmount) / Math.pow(10, 18)).toString();
};

/**
 * Get QIE network information
 * @returns {object} Network configuration
 */
export const getQIENetworkInfo = () => {
  return {
    chainId: QIE_CONFIG.chainId,
    chainName: QIE_CONFIG.chainName,
    nativeCurrency: QIE_CONFIG.nativeCurrency,
    rpcUrls: QIE_CONFIG.rpcUrls,
    blockExplorerUrls: QIE_CONFIG.blockExplorerUrls,
  };
};

/**
 * Generate a clickable link element for QIE explorer
 * @param {string} hash - Transaction hash or address
 * @param {string} type - Type: 'tx', 'address', or 'block'
 * @param {string} text - Display text (optional)
 * @returns {object} Link properties
 */
export const getQIEExplorerLink = (hash, type = 'tx', text = null) => {
  let url;
  switch (type) {
    case 'tx':
      url = getQIETransactionUrl(hash);
      break;
    case 'address':
      url = getQIEAddressUrl(hash);
      break;
    case 'block':
      url = getQIEBlockUrl(hash);
      break;
    default:
      url = getQIETransactionUrl(hash);
  }
  
  return {
    url,
    text: text || (type === 'address' ? formatQIEAddress(hash) : formatQIETxHash(hash)),
    target: '_blank',
    rel: 'noopener noreferrer'
  };
};

export default {
  getQIETransactionUrl,
  getQIEAddressUrl,
  getQIEBlockUrl,
  formatQIEAddress,
  formatQIETxHash,
  isValidQIEAddress,
  isValidQIETxHash,
  formatQIEAmount,
  qieToWei,
  weiToQIE,
  getQIENetworkInfo,
  getQIEExplorerLink,
};