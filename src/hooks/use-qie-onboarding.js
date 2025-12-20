/**
 * QIE Onboarding Hook
 * 
 * Manages QIE onboarding state and determines when to show onboarding
 * Tracks user progress through wallet setup, network configuration, and token acquisition
 */

import { useState, useEffect } from 'react';
import { useQIEWallet } from '../providers/QIEWalletProvider.jsx';

const ONBOARDING_STORAGE_KEY = 'qie_onboarding_completed';
const ONBOARDING_DISMISSED_KEY = 'qie_onboarding_dismissed';

export const useQIEOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  
  const { 
    account, 
    isConnected, 
    isCorrectNetwork,
    provider 
  } = useQIEWallet();

  // Check onboarding status from localStorage
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
    const dismissed = localStorage.getItem(ONBOARDING_DISMISSED_KEY) === 'true';
    
    setOnboardingCompleted(completed);
    setOnboardingDismissed(dismissed);
  }, []);

  // Determine if onboarding should be shown
  useEffect(() => {
    const shouldShowOnboarding = () => {
      // Don't show if already completed or dismissed
      if (onboardingCompleted || onboardingDismissed) {
        return false;
      }

      // Don't show if MetaMask is not installed
      if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
        return true; // Show to guide user to install MetaMask
      }

      // Show if wallet is not connected
      if (!isConnected || !account) {
        return true;
      }

      // Show if not on correct network
      if (!isCorrectNetwork) {
        return true;
      }

      // All requirements met, mark as completed
      markOnboardingCompleted();
      return false;
    };

    setShowOnboarding(shouldShowOnboarding());
  }, [account, isConnected, isCorrectNetwork, onboardingCompleted, onboardingDismissed]);

  const markOnboardingCompleted = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    localStorage.removeItem(ONBOARDING_DISMISSED_KEY); // Clear dismissed flag
    setOnboardingCompleted(true);
    setOnboardingDismissed(false);
    setShowOnboarding(false);
  };

  const markOnboardingDismissed = () => {
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, 'true');
    setOnboardingDismissed(true);
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    localStorage.removeItem(ONBOARDING_DISMISSED_KEY);
    setOnboardingCompleted(false);
    setOnboardingDismissed(false);
    setShowOnboarding(true);
  };

  const triggerOnboarding = () => {
    setShowOnboarding(true);
  };

  // Check if user needs onboarding (for external components to check)
  const needsOnboarding = () => {
    if (onboardingCompleted) return false;
    
    const isMetaMaskInstalled = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
    
    return !isMetaMaskInstalled || !isConnected || !account || !isCorrectNetwork;
  };

  // Get onboarding progress for display
  const getOnboardingProgress = () => {
    const steps = {
      metaMaskInstalled: typeof window !== 'undefined' && typeof window.ethereum !== 'undefined',
      walletConnected: isConnected && !!account,
      correctNetwork: isCorrectNetwork,
      hasTokens: false // This would need to be checked separately
    };

    const completedSteps = Object.values(steps).filter(Boolean).length;
    const totalSteps = Object.keys(steps).length;
    
    return {
      steps,
      completedSteps,
      totalSteps,
      progress: Math.round((completedSteps / totalSteps) * 100)
    };
  };

  return {
    showOnboarding,
    onboardingCompleted,
    onboardingDismissed,
    needsOnboarding: needsOnboarding(),
    progress: getOnboardingProgress(),
    markOnboardingCompleted,
    markOnboardingDismissed,
    resetOnboarding,
    triggerOnboarding
  };
};

export default useQIEOnboarding;