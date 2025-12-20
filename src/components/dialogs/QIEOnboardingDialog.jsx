/**
 * QIE Onboarding Dialog Component
 * 
 * Provides comprehensive onboarding for new QIE users including:
 * - QIE wallet setup guidance
 * - Network switching instructions  
 * - Testnet token acquisition help
 * - Step-by-step setup process
 */

import React, { useState, useEffect } from 'react';
import { useQIEWallet } from '../../providers/QIEWalletProvider.jsx';
import { QIE_CONFIG, addQIENetworkToMetaMask, switchToQIENetwork } from '../../config/qie-config.js';
import toast from 'react-hot-toast';

const QIEOnboardingDialog = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const { 
    account, 
    isConnected, 
    isConnecting, 
    connect, 
    switchNetwork, 
    isCorrectNetwork,
    chainId 
  } = useQIEWallet();

  // Check which steps are completed
  useEffect(() => {
    const newCompletedSteps = new Set();
    
    // Step 1: MetaMask installed
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      newCompletedSteps.add(1);
    }
    
    // Step 2: Wallet connected
    if (isConnected && account) {
      newCompletedSteps.add(2);
    }
    
    // Step 3: Correct network
    if (isCorrectNetwork) {
      newCompletedSteps.add(3);
    }
    
    setCompletedSteps(newCompletedSteps);
    
    // Auto-advance to next incomplete step
    if (newCompletedSteps.has(1) && currentStep === 1) {
      setCurrentStep(2);
    }
    if (newCompletedSteps.has(2) && currentStep === 2) {
      setCurrentStep(3);
    }
    if (newCompletedSteps.has(3) && currentStep === 3) {
      setCurrentStep(4);
    }
  }, [account, isConnected, isCorrectNetwork, currentStep]);

  const handleInstallMetaMask = () => {
    window.open('https://metamask.io/download/', '_blank');
    toast.success('Opening MetaMask download page...');
  };

  const handleConnectWallet = async () => {
    setIsLoading(true);
    try {
      await connect();
      toast.success('Wallet connected successfully!');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error('Failed to connect wallet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchNetwork = async () => {
    setIsLoading(true);
    try {
      await switchNetwork();
      toast.success('Successfully switched to QIE Testnet!');
    } catch (error) {
      console.error('Failed to switch network:', error);
      toast.error('Failed to switch network. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetTestTokens = () => {
    // Open QIE testnet faucet
    window.open('https://faucet.qie.digital', '_blank');
    toast.success('Opening QIE testnet faucet...');
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
    onClose();
    toast.success('Welcome to QIE! You\'re all set up.');
  };

  if (!isOpen) return null;

  const isMetaMaskInstalled = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  const allStepsComplete = completedSteps.has(1) && completedSteps.has(2) && completedSteps.has(3);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome to QIE Network
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Let's get you set up to use PrivatePay on QIE network. Follow these simple steps:
          </p>
          
          {/* Progress indicator */}
          <div className="flex items-center mb-6">
            {[1, 2, 3, 4].map((step) => (
              <React.Fragment key={step}>
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${completedSteps.has(step) 
                    ? 'bg-green-500 text-white' 
                    : currentStep === step 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {completedSteps.has(step) ? '✓' : step}
                </div>
                {step < 4 && (
                  <div className={`
                    flex-1 h-1 mx-2
                    ${completedSteps.has(step) ? 'bg-green-500' : 'bg-gray-200'}
                  `} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {/* Step 1: Install MetaMask */}
          <div className={`
            p-4 rounded-lg border-2 transition-all
            ${currentStep === 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
            ${completedSteps.has(1) ? 'border-green-500 bg-green-50' : ''}
          `}>
            <div className="flex items-start space-x-3">
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mt-1
                ${completedSteps.has(1) 
                  ? 'bg-green-500 text-white' 
                  : 'bg-blue-500 text-white'
                }
              `}>
                {completedSteps.has(1) ? '✓' : '1'}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Install MetaMask Wallet
                </h3>
                {completedSteps.has(1) ? (
                  <p className="text-green-700 text-sm">
                    ✓ MetaMask is installed and ready to use
                  </p>
                ) : (
                  <>
                    <p className="text-gray-600 text-sm mb-3">
                      MetaMask is required to connect to QIE network. It's a secure wallet that runs in your browser.
                    </p>
                    <button
                      onClick={handleInstallMetaMask}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 text-sm font-medium"
                    >
                      Install MetaMask
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Connect Wallet */}
          <div className={`
            p-4 rounded-lg border-2 transition-all
            ${currentStep === 2 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
            ${completedSteps.has(2) ? 'border-green-500 bg-green-50' : ''}
          `}>
            <div className="flex items-start space-x-3">
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mt-1
                ${completedSteps.has(2) 
                  ? 'bg-green-500 text-white' 
                  : currentStep === 2 
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }
              `}>
                {completedSteps.has(2) ? '✓' : '2'}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Connect Your Wallet
                </h3>
                {completedSteps.has(2) ? (
                  <div className="text-green-700 text-sm">
                    <p>✓ Wallet connected successfully</p>
                    <p className="font-mono text-xs mt-1 bg-green-100 p-2 rounded">
                      {account}
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-600 text-sm mb-3">
                      Connect your MetaMask wallet to start using QIE network.
                    </p>
                    <button
                      onClick={handleConnectWallet}
                      disabled={!isMetaMaskInstalled || isConnecting || isLoading}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {isConnecting || isLoading ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Switch to QIE Network */}
          <div className={`
            p-4 rounded-lg border-2 transition-all
            ${currentStep === 3 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
            ${completedSteps.has(3) ? 'border-green-500 bg-green-50' : ''}
          `}>
            <div className="flex items-start space-x-3">
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mt-1
                ${completedSteps.has(3) 
                  ? 'bg-green-500 text-white' 
                  : currentStep === 3 
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }
              `}>
                {completedSteps.has(3) ? '✓' : '3'}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Switch to QIE Testnet
                </h3>
                {completedSteps.has(3) ? (
                  <div className="text-green-700 text-sm">
                    <p>✓ Connected to QIE Testnet</p>
                    <div className="mt-2 p-2 bg-green-100 rounded text-xs">
                      <p><strong>Network:</strong> {QIE_CONFIG.chainName}</p>
                      <p><strong>Chain ID:</strong> {QIE_CONFIG.chainId}</p>
                      <p><strong>RPC:</strong> {QIE_CONFIG.rpcUrls[0]}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-600 text-sm mb-3">
                      Add QIE Testnet to MetaMask and switch to it. This will allow you to interact with QIE blockchain.
                    </p>
                    {chainId && chainId !== QIE_CONFIG.chainId && (
                      <div className="mb-3 p-2 bg-yellow-100 border border-yellow-400 rounded text-sm text-yellow-800">
                        Currently connected to chain ID: {chainId}. Please switch to QIE Testnet.
                      </div>
                    )}
                    <button
                      onClick={handleSwitchNetwork}
                      disabled={!isConnected || isLoading}
                      className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {isLoading ? 'Switching...' : 'Add & Switch to QIE Testnet'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Step 4: Get Test Tokens */}
          <div className={`
            p-4 rounded-lg border-2 transition-all
            ${currentStep === 4 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
          `}>
            <div className="flex items-start space-x-3">
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mt-1
                ${currentStep === 4 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'}
              `}>
                4
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Get QIE Test Tokens
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  Get free QIE test tokens from the faucet to start making transactions. You'll need these tokens to pay for gas fees.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={handleGetTestTokens}
                    disabled={!allStepsComplete}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Get Test Tokens
                  </button>
                  <div className="text-xs text-gray-500">
                    <p>• Visit the QIE testnet faucet</p>
                    <p>• Enter your wallet address</p>
                    <p>• Receive free QIE tokens for testing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Need Help?</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div>
              <strong>QIE Network Info:</strong>
              <ul className="ml-4 mt-1 space-y-1 text-xs">
                <li>• Chain ID: {QIE_CONFIG.chainId}</li>
                <li>• RPC URL: {QIE_CONFIG.rpcUrls[0]}</li>
                <li>• Explorer: {QIE_CONFIG.blockExplorerUrls[0]}</li>
                <li>• Symbol: {QIE_CONFIG.nativeCurrency.symbol}</li>
              </ul>
            </div>
            <div className="pt-2">
              <strong>Useful Links:</strong>
              <div className="flex flex-wrap gap-2 mt-1">
                <a 
                  href="https://metamask.io/faqs/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                >
                  MetaMask Help
                </a>
                <a 
                  href="https://faucet.qie.digital" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                >
                  QIE Faucet
                </a>
                <a 
                  href={QIE_CONFIG.blockExplorerUrls[0]} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                >
                  QIE Explorer
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex space-x-3">
          {allStepsComplete ? (
            <button
              onClick={handleComplete}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-medium"
            >
              Complete Setup
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 font-medium"
            >
              I'll finish this later
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QIEOnboardingDialog;