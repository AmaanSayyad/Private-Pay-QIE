/**
 * QIE Onboarding Integration Examples
 * 
 * This file demonstrates various ways to integrate QIE onboarding
 * into your application components.
 */

import React from 'react';
import QIEOnboardingManager, { triggerQIEOnboarding } from '../components/onboarding/QIEOnboardingManager.jsx';
import QIEOnboardingButton from '../components/shared/QIEOnboardingButton.jsx';
import QIESetupGuide from '../components/help/QIESetupGuide.jsx';
import { useQIEOnboarding } from '../hooks/use-qie-onboarding.js';
import { useQIEWallet } from '../providers/QIEWalletProvider.jsx';

// Example 1: Basic App Integration with Auto-Show Onboarding
export function AppWithAutoOnboarding() {
  return (
    <QIEOnboardingManager autoShow={true}>
      <div className="app">
        <h1>My App</h1>
        {/* Your app content */}
      </div>
    </QIEOnboardingManager>
  );
}

// Example 2: Manual Onboarding Trigger
export function ManualOnboardingTrigger() {
  const handleShowOnboarding = () => {
    triggerQIEOnboarding();
  };

  return (
    <div>
      <button onClick={handleShowOnboarding}>
        Show QIE Setup Guide
      </button>
    </div>
  );
}

// Example 3: Onboarding Button in Header
export function HeaderWithOnboarding() {
  const { isConnected, account } = useQIEWallet();
  const { needsOnboarding } = useQIEOnboarding();

  return (
    <header className="flex items-center justify-between p-4">
      <h1>PrivatePay</h1>
      
      <div className="flex items-center space-x-4">
        {needsOnboarding ? (
          <QIEOnboardingButton 
            variant="primary" 
            size="medium"
            showProgress={true}
          />
        ) : (
          <div className="text-sm">
            Connected: {account?.slice(0, 6)}...{account?.slice(-4)}
          </div>
        )}
      </div>
    </header>
  );
}

// Example 4: Conditional Content Based on Onboarding Status
export function ConditionalContent() {
  const { needsOnboarding, progress } = useQIEOnboarding();
  const { isConnected, isCorrectNetwork } = useQIEWallet();

  if (needsOnboarding) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Welcome to PrivatePay!</h2>
        <p className="text-gray-600 mb-6">
          Let's get you set up to start making private payments on QIE network.
        </p>
        
        <QIEOnboardingButton 
          variant="primary" 
          size="large"
          showProgress={true}
        />
        
        <div className="mt-4 text-sm text-gray-500">
          {progress.completedSteps} of {progress.totalSteps} steps completed
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      {/* Your main app content */}
    </div>
  );
}

// Example 5: Help Page with Setup Guide
export function HelpPage() {
  return (
    <div className="container mx-auto p-8">
      <QIESetupGuide 
        showTitle={true} 
        expandable={true} 
      />
    </div>
  );
}

// Example 6: Inline Setup Guide (Compact)
export function CompactSetupGuide() {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <QIESetupGuide 
        showTitle={false} 
        expandable={true} 
      />
    </div>
  );
}

// Example 7: Custom Onboarding Status Display
export function CustomOnboardingStatus() {
  const { needsOnboarding, progress, onboardingCompleted } = useQIEOnboarding();
  const { account, isConnected, isCorrectNetwork } = useQIEWallet();

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-semibold mb-3">Setup Status</h3>
      
      <div className="space-y-2">
        <StatusItem 
          label="MetaMask Installed" 
          completed={progress.steps.metaMaskInstalled} 
        />
        <StatusItem 
          label="Wallet Connected" 
          completed={progress.steps.walletConnected} 
        />
        <StatusItem 
          label="QIE Network" 
          completed={progress.steps.correctNetwork} 
        />
      </div>

      {needsOnboarding && (
        <div className="mt-4">
          <QIEOnboardingButton 
            variant="primary" 
            size="small"
            className="w-full"
          />
        </div>
      )}

      {onboardingCompleted && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg text-green-800 text-sm">
          ✓ All set up! You're ready to use PrivatePay.
        </div>
      )}
    </div>
  );
}

function StatusItem({ label, completed }) {
  return (
    <div className="flex items-center space-x-2">
      <div className={`w-4 h-4 rounded-full ${
        completed ? 'bg-green-500' : 'bg-gray-300'
      }`}>
        {completed && (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className={`text-sm ${completed ? 'text-gray-900' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
}

// Example 8: Onboarding with Custom Completion Handler
export function OnboardingWithCallback() {
  const handleOnboardingComplete = () => {
    console.log('User completed QIE onboarding!');
    // Track analytics, show welcome message, etc.
  };

  // Listen for completion event
  React.useEffect(() => {
    const handleComplete = (event) => {
      handleOnboardingComplete();
      console.log('Onboarding completed with:', event.detail);
    };

    window.addEventListener('qie-onboarding-completed', handleComplete);
    
    return () => {
      window.removeEventListener('qie-onboarding-completed', handleComplete);
    };
  }, []);

  return (
    <QIEOnboardingManager autoShow={true}>
      <div>Your app content</div>
    </QIEOnboardingManager>
  );
}

// Example 9: Reset Onboarding (for testing or re-setup)
export function ResetOnboardingButton() {
  const { resetOnboarding } = useQIEOnboarding();

  return (
    <button 
      onClick={resetOnboarding}
      className="text-sm text-gray-600 hover:text-gray-900 underline"
    >
      Reset QIE Setup (for testing)
    </button>
  );
}

// Example 10: Different Onboarding Button Variants
export function OnboardingButtonVariants() {
  return (
    <div className="space-y-4 p-8">
      <h3 className="font-bold mb-4">Onboarding Button Variants</h3>
      
      <div className="space-y-2">
        <QIEOnboardingButton variant="primary" size="small" />
        <QIEOnboardingButton variant="secondary" size="medium" />
        <QIEOnboardingButton variant="success" size="large" />
        <QIEOnboardingButton variant="warning" size="medium" />
        <QIEOnboardingButton variant="outline" size="medium" />
      </div>

      <div className="mt-6">
        <h4 className="font-semibold mb-2">With Progress Bar</h4>
        <QIEOnboardingButton 
          variant="primary" 
          size="medium"
          showProgress={true}
        />
      </div>

      <div className="mt-6">
        <h4 className="font-semibold mb-2">Custom Text</h4>
        <QIEOnboardingButton variant="primary" size="medium">
          Get Started with QIE
        </QIEOnboardingButton>
      </div>
    </div>
  );
}

export default {
  AppWithAutoOnboarding,
  ManualOnboardingTrigger,
  HeaderWithOnboarding,
  ConditionalContent,
  HelpPage,
  CompactSetupGuide,
  CustomOnboardingStatus,
  OnboardingWithCallback,
  ResetOnboardingButton,
  OnboardingButtonVariants
};