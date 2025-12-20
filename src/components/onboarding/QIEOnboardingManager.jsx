/**
 * QIE Onboarding Manager Component
 * 
 * Manages the overall QIE onboarding experience
 * Automatically shows onboarding when needed and provides manual triggers
 */

import React, { useState, useEffect } from 'react';
import QIEOnboardingDialog from '../dialogs/QIEOnboardingDialog.jsx';
import { useQIEOnboarding } from '../../hooks/use-qie-onboarding.js';
import { useQIEWallet } from '../../providers/QIEWalletProvider.jsx';
import toast from 'react-hot-toast';

const QIEOnboardingManager = ({ children, autoShow = true }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hasShownAutoOnboarding, setHasShownAutoOnboarding] = useState(false);
  
  const { 
    showOnboarding, 
    needsOnboarding,
    markOnboardingCompleted, 
    markOnboardingDismissed 
  } = useQIEOnboarding();
  
  const { account, isConnected, isCorrectNetwork } = useQIEWallet();

  // Auto-show onboarding dialog when needed
  useEffect(() => {
    if (autoShow && showOnboarding && !hasShownAutoOnboarding && !isDialogOpen) {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        setIsDialogOpen(true);
        setHasShownAutoOnboarding(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [autoShow, showOnboarding, hasShownAutoOnboarding, isDialogOpen]);

  // Listen for manual onboarding triggers
  useEffect(() => {
    const handleTriggerOnboarding = () => {
      setIsDialogOpen(true);
    };

    // Custom event listener for manual triggers
    window.addEventListener('qie-trigger-onboarding', handleTriggerOnboarding);
    
    return () => {
      window.removeEventListener('qie-trigger-onboarding', handleTriggerOnboarding);
    };
  }, []);

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    
    // If user closes without completing, mark as dismissed
    if (needsOnboarding) {
      markOnboardingDismissed();
      toast.info('You can restart QIE setup anytime from the wallet menu');
    }
  };

  const handleCompleteOnboarding = () => {
    markOnboardingCompleted();
    setIsDialogOpen(false);
    
    // Show success message with next steps
    toast.success('QIE setup complete! You can now make private payments.');
    
    // Emit completion event for other components
    window.dispatchEvent(new CustomEvent('qie-onboarding-completed', {
      detail: { account, isConnected, isCorrectNetwork }
    }));
  };

  return (
    <>
      {children}
      <QIEOnboardingDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onComplete={handleCompleteOnboarding}
      />
    </>
  );
};

// Helper function to manually trigger onboarding from anywhere in the app
export const triggerQIEOnboarding = () => {
  window.dispatchEvent(new CustomEvent('qie-trigger-onboarding'));
};

export default QIEOnboardingManager;