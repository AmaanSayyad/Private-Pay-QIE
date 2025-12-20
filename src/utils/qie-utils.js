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

/**
 * Get network display information
 * @param {string} network - Network identifier ('qie' or 'aptos')
 * @returns {Object} Network display information
 */
export const getNetworkDisplayInfo = (network = 'qie') => {
  const networkInfo = {
    qie: {
      symbol: 'QIE',
      name: 'QIE Network',
      icon: 'https://qie.digital/favicon.ico',
      color: 'primary',
      explorerUrl: 'https://testnet.qie.digital',
      isEVM: true
    },
    aptos: {
      symbol: 'APT',
      name: 'Aptos Network',
      icon: 'https://aptoslabs.com/favicon.ico',
      color: 'warning',
      explorerUrl: 'https://explorer.aptoslabs.com',
      isEVM: false
    }
  };

  return networkInfo[network.toLowerCase()] || networkInfo.qie;
};

/**
 * Determine transaction network from transaction data
 * @param {Object} transaction - Transaction object
 * @returns {string} Network identifier
 */
export const determineTransactionNetwork = (transaction) => {
  // If network is explicitly set, use it
  if (transaction.network) {
    return transaction.network;
  }

  // If QIE-specific fields are present, it's a QIE transaction
  if (transaction.qie_transaction_hash || transaction.qie_block_number || transaction.gas_used) {
    return 'qie';
  }

  // If sender/recipient addresses are EVM format (0x...), it's likely QIE
  if (transaction.sender_address?.startsWith('0x') || transaction.recipient_address?.startsWith('0x')) {
    return 'qie';
  }

  // Default to QIE for new transactions, Aptos for legacy
  return transaction.created_at && new Date(transaction.created_at) < new Date('2024-01-01') ? 'aptos' : 'qie';
};

/**
 * Format transaction amount with network-specific symbol
 * @param {number|string} amount - Transaction amount
 * @param {string} network - Network identifier
 * @param {boolean} isPositive - Whether amount is positive (received) or negative (sent)
 * @returns {string} Formatted amount string
 */
export const formatTransactionAmount = (amount, network = 'qie', isPositive = true) => {
  const networkInfo = getNetworkDisplayInfo(network);
  const sign = isPositive ? '+' : '-';
  const absAmount = Math.abs(parseFloat(amount));
  
  // Format with appropriate decimal places
  const formattedAmount = absAmount.toFixed(4);
  
  return `${sign}${formattedAmount} ${networkInfo.symbol}`;
};

/**
 * Get transaction explorer URL
 * @param {string} txHash - Transaction hash
 * @param {string} network - Network identifier
 * @returns {string} Explorer URL
 */
export const getTransactionExplorerUrl = (txHash, network = 'qie') => {
  const networkInfo = getNetworkDisplayInfo(network);
  
  if (network === 'qie') {
    return `${networkInfo.explorerUrl}/tx/${txHash}`;
  } else if (network === 'aptos') {
    return `${networkInfo.explorerUrl}/txn/${txHash}`;
  }
  
  return `${networkInfo.explorerUrl}/tx/${txHash}`;
};

/**
 * Check if transaction is from legacy Aptos network
 * @param {Object} transaction - Transaction object
 * @returns {boolean} True if transaction is from Aptos
 */
export const isLegacyAptosTransaction = (transaction) => {
  return determineTransactionNetwork(transaction) === 'aptos';
};

/**
 * Get network indicator badge props
 * @param {string} network - Network identifier
 * @returns {Object} Badge props for UI components
 */
export const getNetworkBadgeProps = (network = 'qie') => {
  const networkInfo = getNetworkDisplayInfo(network);
  
  return {
    label: network.toUpperCase(),
    color: networkInfo.color,
    variant: 'flat',
    size: 'sm'
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
  getNetworkDisplayInfo,
  determineTransactionNetwork,
  formatTransactionAmount,
  getTransactionExplorerUrl,
  isLegacyAptosTransaction,
  getNetworkBadgeProps,
};