/**
 * QIE Network Configuration
 * Configuration for QIE testnet integration
 */

export const QIE_TESTNET_CONFIG = {
  // Network Information
  chainId: 1983, // QIE testnet actual chain ID
  chainName: 'QIE Testnet',
  nativeCurrency: {
    name: 'QIE',
    symbol: 'QIE',
    decimals: 18
  },
  rpcUrls: ['https://rpc1testnet.qie.digital/'], // Using working RPC
  blockExplorerUrls: ['https://testnet.qie.digital'],
  
  // Contract Addresses (updated after deployment)
  contracts: {
    StealthAddressRegistry: {
      address: '0x084e08c8011ed2b519ac844836c49efa944c5921',
      deploymentBlock: 0
    },
    PaymentManager: {
      address: '0x0ab4d2d7642d2ac00206042b87bfc82a6f96737b',
      deploymentBlock: 0
    }
  },
  
  // Gas Configuration
  gas: {
    limit: 8000000,
    price: 20000000000, // 20 gwei
    maxFeePerGas: 30000000000, // 30 gwei
    maxPriorityFeePerGas: 2000000000 // 2 gwei
  },
  
  // Transaction Configuration
  transaction: {
    confirmations: 1, // Number of confirmations to wait
    timeout: 60000, // 60 seconds timeout
    retries: 3
  },
  
  // Stealth Address Configuration
  stealth: {
    viewHintBytes: 1, // Number of bytes for view hint
    maxDerivationIndex: 2147483647, // Max k value for derivation
    defaultK: 0 // Default derivation index
  },
  
  // Payment Links Configuration
  paymentLinks: {
    baseUrl: 'https://privatepay.me',
    maxAliasLength: 15,
    allowedCharacters: /^[a-z0-9]+$/,
    qrCodeSize: 256
  }
};

export const QIE_MAINNET_CONFIG = {
  // Placeholder for future mainnet configuration
  chainId: 0, // Update with actual QIE mainnet chain ID
  chainName: 'QIE Mainnet',
  nativeCurrency: {
    name: 'QIE',
    symbol: 'QIE',
    decimals: 18
  },
  rpcUrls: ['https://rpc.qie.digital'],
  blockExplorerUrls: ['https://explorer.qie.digital'],
  contracts: {
    StealthAddressRegistry: {
      address: '',
      deploymentBlock: 0
    },
    PaymentManager: {
      address: '',
      deploymentBlock: 0
    }
  }
};

// Current active configuration
export const QIE_CONFIG = QIE_TESTNET_CONFIG;

// MetaMask network addition helper
export const addQIENetworkToMetaMask = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${QIE_CONFIG.chainId.toString(16)}`,
        chainName: QIE_CONFIG.chainName,
        nativeCurrency: QIE_CONFIG.nativeCurrency,
        rpcUrls: QIE_CONFIG.rpcUrls,
        blockExplorerUrls: QIE_CONFIG.blockExplorerUrls
      }]
    });
    return true;
  } catch (error) {
    console.error('Failed to add QIE network to MetaMask:', error);
    throw error;
  }
};

// Network switching helper
export const switchToQIENetwork = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${QIE_CONFIG.chainId.toString(16)}` }]
    });
    return true;
  } catch (error) {
    // If network doesn't exist, try to add it
    if (error.code === 4902) {
      return await addQIENetworkToMetaMask();
    }
    console.error('Failed to switch to QIE network:', error);
    throw error;
  }
};

// Validate QIE address format (EVM compatible)
export const isValidQIEAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Format QIE amount with proper decimals
export const formatQIEAmount = (amount, decimals = 4) => {
  const qieAmount = parseFloat(amount) / Math.pow(10, 18);
  return qieAmount.toFixed(decimals);
};

// Convert QIE amount to wei
export const qieToWei = (qieAmount) => {
  return (parseFloat(qieAmount) * Math.pow(10, 18)).toString();
};

// Convert wei to QIE
export const weiToQIE = (weiAmount) => {
  return (parseFloat(weiAmount) / Math.pow(10, 18)).toString();
};

export default QIE_CONFIG;