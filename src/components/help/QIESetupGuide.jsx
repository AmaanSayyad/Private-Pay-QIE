/**
 * QIE Setup Guide Component
 * 
 * Comprehensive guide for setting up QIE wallet and network
 * Can be used in help sections, documentation, or as a standalone guide
 */

import React, { useState } from 'react';
import { QIE_CONFIG } from '../../config/qie-config.js';
import { useQIEWallet } from '../../providers/QIEWalletProvider.jsx';

const QIESetupGuide = ({ showTitle = true, expandable = false }) => {
  const [expandedSection, setExpandedSection] = useState(expandable ? null : 'all');
  const { account, isConnected, isCorrectNetwork, chainId } = useQIEWallet();

  const toggleSection = (section) => {
    if (!expandable) return;
    setExpandedSection(expandedSection === section ? null : section);
  };

  const isExpanded = (section) => {
    return !expandable || expandedSection === 'all' || expandedSection === section;
  };

  const SectionHeader = ({ title, section, icon }) => (
    <div 
      className={`flex items-center justify-between p-3 bg-gray-50 rounded-t-lg ${
        expandable ? 'cursor-pointer hover:bg-gray-100' : ''
      }`}
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center space-x-2">
        <span className="text-lg">{icon}</span>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      {expandable && (
        <svg 
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isExpanded(section) ? 'rotate-180' : ''
          }`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {showTitle && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            QIE Network Setup Guide
          </h2>
          <p className="text-gray-600">
            Follow this comprehensive guide to set up your wallet for QIE network and start making private payments.
          </p>
        </div>
      )}

      {/* Current Status */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Current Status</h3>
        <div className="space-y-1 text-sm">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${
              typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' 
                ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span>MetaMask: {
              typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' 
                ? 'Installed' : 'Not Installed'
            }</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>Wallet: {isConnected ? `Connected (${account?.slice(0, 6)}...${account?.slice(-4)})` : 'Not Connected'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${isCorrectNetwork ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>Network: {isCorrectNetwork ? 'QIE Testnet' : `Wrong Network (Chain ID: ${chainId || 'Unknown'})`}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Step 1: Install MetaMask */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <SectionHeader 
            title="Step 1: Install MetaMask Wallet" 
            section="metamask"
            icon="🦊"
          />
          {isExpanded('metamask') && (
            <div className="p-4 space-y-4">
              <p className="text-gray-600">
                MetaMask is a browser extension wallet that allows you to interact with blockchain networks like QIE.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h4 className="font-medium text-yellow-900 mb-2">Installation Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
                  <li>Visit <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">metamask.io/download</a></li>
                  <li>Click "Install MetaMask for Chrome" (or your browser)</li>
                  <li>Add the extension to your browser</li>
                  <li>Create a new wallet or import an existing one</li>
                  <li>Secure your seed phrase (write it down safely!)</li>
                </ol>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h4 className="font-medium text-red-900 mb-1">⚠️ Security Warning</h4>
                <p className="text-sm text-red-800">
                  Never share your seed phrase with anyone. MetaMask will never ask for it. 
                  Store it securely offline.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Connect Wallet */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <SectionHeader 
            title="Step 2: Connect Your Wallet" 
            section="connect"
            icon="🔗"
          />
          {isExpanded('connect') && (
            <div className="p-4 space-y-4">
              <p className="text-gray-600">
                Connect your MetaMask wallet to PrivatePay to start using QIE network.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-medium text-blue-900 mb-2">Connection Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Click the "Connect Wallet" button in PrivatePay</li>
                  <li>MetaMask popup will appear</li>
                  <li>Select the account you want to connect</li>
                  <li>Click "Connect" in MetaMask</li>
                  <li>Approve the connection request</li>
                </ol>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-1">Troubleshooting</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• If MetaMask doesn't open, click the extension icon in your browser</li>
                  <li>• Make sure MetaMask is unlocked (enter your password)</li>
                  <li>• Try refreshing the page if connection fails</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Add QIE Network */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <SectionHeader 
            title="Step 3: Add QIE Testnet to MetaMask" 
            section="network"
            icon="🌐"
          />
          {isExpanded('network') && (
            <div className="p-4 space-y-4">
              <p className="text-gray-600">
                Add QIE Testnet to your MetaMask to interact with QIE blockchain.
              </p>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <h4 className="font-medium text-purple-900 mb-2">Automatic Method (Recommended):</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-purple-800">
                  <li>Click "Add & Switch to QIE Testnet" in PrivatePay</li>
                  <li>MetaMask will prompt to add the network</li>
                  <li>Click "Approve" to add QIE Testnet</li>
                  <li>Click "Switch network" to use QIE Testnet</li>
                </ol>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2">Manual Method:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 mb-3">
                  <li>Open MetaMask and click the network dropdown</li>
                  <li>Click "Add network" → "Add a network manually"</li>
                  <li>Enter the following details:</li>
                </ol>
                
                <div className="bg-white border border-gray-300 rounded p-3 font-mono text-xs space-y-1">
                  <div><strong>Network Name:</strong> {QIE_CONFIG.chainName}</div>
                  <div><strong>New RPC URL:</strong> {QIE_CONFIG.rpcUrls[0]}</div>
                  <div><strong>Chain ID:</strong> {QIE_CONFIG.chainId}</div>
                  <div><strong>Currency Symbol:</strong> {QIE_CONFIG.nativeCurrency.symbol}</div>
                  <div><strong>Block Explorer URL:</strong> {QIE_CONFIG.blockExplorerUrls[0]}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 4: Get Test Tokens */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <SectionHeader 
            title="Step 4: Get QIE Test Tokens" 
            section="tokens"
            icon="🪙"
          />
          {isExpanded('tokens') && (
            <div className="p-4 space-y-4">
              <p className="text-gray-600">
                Get free QIE test tokens to pay for transaction fees and test the network.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h4 className="font-medium text-green-900 mb-2">Getting Test Tokens:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-green-800">
                  <li>Visit the <a href="https://faucet.qie.digital" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">QIE Testnet Faucet</a></li>
                  <li>Copy your wallet address from MetaMask</li>
                  <li>Paste your address in the faucet</li>
                  <li>Complete any verification (captcha, etc.)</li>
                  <li>Click "Request Tokens"</li>
                  <li>Wait for tokens to arrive (usually 1-2 minutes)</li>
                </ol>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-medium text-blue-900 mb-1">Token Information</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Symbol: {QIE_CONFIG.nativeCurrency.symbol}</li>
                  <li>• Decimals: {QIE_CONFIG.nativeCurrency.decimals}</li>
                  <li>• Used for: Transaction fees (gas)</li>
                  <li>• Faucet limit: Usually 1-10 QIE per request</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h4 className="font-medium text-yellow-900 mb-1">💡 Tips</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Keep some QIE for gas fees</li>
                  <li>• You can request more tokens if you run out</li>
                  <li>• Test tokens have no real value</li>
                  <li>• Use the block explorer to verify transactions</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Step 5: Start Using PrivatePay */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <SectionHeader 
            title="Step 5: Start Making Private Payments" 
            section="usage"
            icon="🔒"
          />
          {isExpanded('usage') && (
            <div className="p-4 space-y-4">
              <p className="text-gray-600">
                Now you're ready to use PrivatePay's stealth address technology for private payments on QIE.
              </p>
              
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <h4 className="font-medium text-indigo-900 mb-2">What You Can Do:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-indigo-800">
                  <li>Create payment links with stealth addresses</li>
                  <li>Send private payments that can't be traced</li>
                  <li>Receive payments without revealing your main wallet</li>
                  <li>Withdraw funds from stealth addresses</li>
                  <li>View your payment history</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h4 className="font-medium text-green-900 mb-2">Next Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-green-800">
                  <li>Create your first payment link</li>
                  <li>Share it with someone to test</li>
                  <li>Monitor for incoming payments</li>
                  <li>Withdraw funds when ready</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">Need More Help?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Resources:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>
                <a href="https://metamask.io/faqs/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  MetaMask FAQ
                </a>
              </li>
              <li>
                <a href="https://faucet.qie.digital" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  QIE Testnet Faucet
                </a>
              </li>
              <li>
                <a href={QIE_CONFIG.blockExplorerUrls[0]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  QIE Block Explorer
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Common Issues:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• MetaMask not connecting: Try refreshing the page</li>
              <li>• Wrong network: Use the network switcher</li>
              <li>• No test tokens: Visit the faucet</li>
              <li>• Transaction failed: Check gas fees</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QIESetupGuide;