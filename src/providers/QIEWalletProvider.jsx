import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { QIE_CONFIG, addQIENetworkToMetaMask, switchToQIENetwork } from '../config/qie-config.js';
import { qieBlockchainService } from '../lib/qie/qieBlockchainService.js';
import toast from 'react-hot-toast';

/**
 * @typedef {Object} QIEWalletContextType
 * @property {string|null} account - Connected wallet address
 * @property {boolean} isConnected - Connection status
 * @property {boolean} isConnecting - Connection in progress
 * @property {ethers.BrowserProvider|null} provider - Ethers provider
 * @property {ethers.Signer|null} signer - Ethers signer
 * @property {Function} connect - Connect wallet function
 * @property {Function} disconnect - Disconnect wallet function
 * @property {Function} switchNetwork - Switch to QIE network function
 * @property {number|null} chainId - Current chain ID
 * @property {boolean} isCorrectNetwork - Whether connected to QIE network
 */

/** @type {React.Context<QIEWalletContextType>} */
const QIEWalletContext = createContext({
  account: null,
  isConnected: false,
  isConnecting: false,
  provider: null,
  signer: null,
  connect: async () => {},
  disconnect: async () => {},
  switchNetwork: async () => {},
  chainId: null,
  isCorrectNetwork: false,
});

export const useQIEWallet = () => {
  const context = useContext(QIEWalletContext);
  if (!context) {
    throw new Error('useQIEWallet must be used within a QIEWalletProvider');
  }
  return context;
};

export default function QIEWalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  // Initialize provider and check existing connection
  const initializeProvider = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      console.warn('MetaMask is not installed');
      return;
    }

    try {
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethProvider);

      // Check if already connected
      const accounts = await ethProvider.listAccounts();
      if (accounts.length > 0) {
        const account = accounts[0];
        setAccount(account.address);
        setIsConnected(true);
        
        const signer = await ethProvider.getSigner();
        setSigner(signer);

        // Set signer in QIE blockchain service
        try {
          await qieBlockchainService.initialize();
          qieBlockchainService.signer = signer;
          console.log('QIE blockchain service signer initialized');
        } catch (error) {
          console.error('Failed to initialize QIE blockchain service signer:', error);
        }

        // Get current network
        const network = await ethProvider.getNetwork();
        setChainId(Number(network.chainId));
        setIsCorrectNetwork(Number(network.chainId) === QIE_CONFIG.chainId);
      }
    } catch (error) {
      console.error('Failed to initialize provider:', error);
    }
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      toast.error('Please install MetaMask to connect your wallet');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethProvider);

      const account = accounts[0];
      setAccount(account);
      setIsConnected(true);

      const signer = await ethProvider.getSigner();
      setSigner(signer);

      // Set signer in QIE blockchain service
      try {
        await qieBlockchainService.initialize();
        qieBlockchainService.signer = signer;
        console.log('QIE blockchain service signer set successfully');
      } catch (error) {
        console.error('Failed to set QIE blockchain service signer:', error);
      }

      // Get current network
      const network = await ethProvider.getNetwork();
      const currentChainId = Number(network.chainId);
      setChainId(currentChainId);
      
      // Check if on correct network
      if (currentChainId !== QIE_CONFIG.chainId) {
        setIsCorrectNetwork(false);
        toast.error(`Please switch to ${QIE_CONFIG.chainName} network`);
        
        // Attempt to switch network
        try {
          await switchToQIENetwork();
          setIsCorrectNetwork(true);
          toast.success(`Connected to ${QIE_CONFIG.chainName}`);
        } catch (switchError) {
          console.error('Failed to switch network:', switchError);
        }
      } else {
        setIsCorrectNetwork(true);
        toast.success(`Connected to ${QIE_CONFIG.chainName}`);
      }

    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error('Failed to connect wallet');
      setIsConnecting(false);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    setAccount(null);
    setIsConnected(false);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setIsCorrectNetwork(false);
    toast.success('Wallet disconnected');
  }, []);

  // Switch to QIE network
  const switchNetwork = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      toast.error('MetaMask is not installed');
      return;
    }

    try {
      await switchToQIENetwork();
      
      // Update network state
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      const network = await ethProvider.getNetwork();
      const currentChainId = Number(network.chainId);
      setChainId(currentChainId);
      setIsCorrectNetwork(currentChainId === QIE_CONFIG.chainId);
      
      if (currentChainId === QIE_CONFIG.chainId) {
        toast.success(`Switched to ${QIE_CONFIG.chainName}`);
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
      toast.error('Failed to switch network');
    }
  }, []);

  // Listen for account and network changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        // Re-initialize signer with new account
        if (provider) {
          provider.getSigner().then(setSigner).catch(console.error);
        }
      }
    };

    const handleChainChanged = (chainId) => {
      const newChainId = parseInt(chainId, 16);
      setChainId(newChainId);
      setIsCorrectNetwork(newChainId === QIE_CONFIG.chainId);
      
      if (newChainId !== QIE_CONFIG.chainId) {
        toast.error(`Please switch to ${QIE_CONFIG.chainName} network`);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [account, provider, disconnect]);

  // Initialize on mount
  useEffect(() => {
    initializeProvider();
  }, [initializeProvider]);

  const contextValue = {
    account,
    isConnected,
    isConnecting,
    provider,
    signer,
    connect,
    disconnect,
    switchNetwork,
    chainId,
    isCorrectNetwork,
  };

  return (
    <QIEWalletContext.Provider value={contextValue}>
      {children}
    </QIEWalletContext.Provider>
  );
}

// Backward compatibility hook (replaces useAptos)
export const useAptos = () => {
  const qieWallet = useQIEWallet();
  
  return {
    account: qieWallet.account,
    isConnected: qieWallet.isConnected,
    connect: qieWallet.connect,
    disconnect: qieWallet.disconnect,
    // Additional QIE-specific properties
    provider: qieWallet.provider,
    signer: qieWallet.signer,
    chainId: qieWallet.chainId,
    isCorrectNetwork: qieWallet.isCorrectNetwork,
    switchNetwork: qieWallet.switchNetwork,
  };
};