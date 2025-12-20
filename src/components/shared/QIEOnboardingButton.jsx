/**
 * QIE Onboarding Button Component
 * 
 * A reusable button component that triggers QIE onboarding
 * Can be used in various parts of the app to help users get started
 */

import React from 'react';
import { useQIEOnboarding } from '../../hooks/use-qie-onboarding.js';
import { useQIEWallet } from '../../providers/QIEWalletProvider.jsx';

const QIEOnboardingButton = ({ 
  children, 
  className = '', 
  variant = 'primary',
  size = 'medium',
  showProgress = false,
  ...props 
}) => {
  const { triggerOnboarding, needsOnboarding, progress } = useQIEOnboarding();
  const { isConnected, isCorrectNetwork } = useQIEWallet();

  // Don't show if user doesn't need onboarding
  if (!needsOnboarding) {
    return null;
  }

  const getButtonText = () => {
    if (children) return children;
    
    if (!isConnected) {
      return 'Connect QIE Wallet';
    }
    
    if (!isCorrectNetwork) {
      return 'Switch to QIE Network';
    }
    
    return 'Complete QIE Setup';
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600';
      case 'secondary':
        return 'bg-gray-200 text-gray-800 hover:bg-gray-300 border-gray-200';
      case 'success':
        return 'bg-green-600 text-white hover:bg-green-700 border-green-600';
      case 'warning':
        return 'bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-500';
      case 'outline':
        return 'bg-transparent text-blue-600 hover:bg-blue-50 border-blue-600';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-3 py-1.5 text-sm';
      case 'medium':
        return 'px-4 py-2 text-base';
      case 'large':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={triggerOnboarding}
        className={`
          inline-flex items-center justify-center
          font-medium rounded-lg border transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${getVariantClasses()}
          ${getSizeClasses()}
          ${className}
        `}
        {...props}
      >
        <svg 
          className="w-4 h-4 mr-2" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M13 10V3L4 14h7v7l9-11h-7z" 
          />
        </svg>
        {getButtonText()}
      </button>
      
      {showProgress && needsOnboarding && (
        <div className="text-xs text-gray-600">
          <div className="flex justify-between items-center mb-1">
            <span>Setup Progress</span>
            <span>{progress.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          <div className="mt-1 text-xs">
            {progress.completedSteps} of {progress.totalSteps} steps completed
          </div>
        </div>
      )}
    </div>
  );
};

export default QIEOnboardingButton;