/**
 * QIE Configuration Validation
 * Validates that all required QIE environment variables are properly configured
 */

export const validateQIEConfig = () => {
  const requiredEnvVars = [
    'VITE_QIE_TESTNET_RPC_URL',
    'VITE_QIE_TESTNET_CHAIN_ID',
    'VITE_QIE_TESTNET_EXPLORER_URL',
    'VITE_QIE_STEALTH_REGISTRY_ADDRESS',
    'VITE_QIE_PAYMENT_MANAGER_ADDRESS'
  ];

  const missingVars = [];
  const invalidVars = [];

  for (const envVar of requiredEnvVars) {
    const value = import.meta.env[envVar];
    
    if (!value) {
      missingVars.push(envVar);
      continue;
    }

    // Validate specific formats
    switch (envVar) {
      case 'VITE_QIE_TESTNET_CHAIN_ID':
        if (isNaN(parseInt(value))) {
          invalidVars.push(`${envVar}: must be a valid number`);
        }
        break;
      
      case 'VITE_QIE_TESTNET_RPC_URL':
      case 'VITE_QIE_TESTNET_EXPLORER_URL':
        try {
          new URL(value);
        } catch {
          invalidVars.push(`${envVar}: must be a valid URL`);
        }
        break;
      
      case 'VITE_QIE_STEALTH_REGISTRY_ADDRESS':
      case 'VITE_QIE_PAYMENT_MANAGER_ADDRESS':
        if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
          invalidVars.push(`${envVar}: must be a valid Ethereum address`);
        }
        break;
    }
  }

  const errors = [];
  if (missingVars.length > 0) {
    errors.push(`Missing environment variables: ${missingVars.join(', ')}`);
  }
  if (invalidVars.length > 0) {
    errors.push(`Invalid environment variables: ${invalidVars.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    config: {
      rpcUrl: import.meta.env.VITE_QIE_TESTNET_RPC_URL,
      chainId: parseInt(import.meta.env.VITE_QIE_TESTNET_CHAIN_ID),
      explorerUrl: import.meta.env.VITE_QIE_TESTNET_EXPLORER_URL,
      stealthRegistryAddress: import.meta.env.VITE_QIE_STEALTH_REGISTRY_ADDRESS,
      paymentManagerAddress: import.meta.env.VITE_QIE_PAYMENT_MANAGER_ADDRESS
    }
  };
};

// Validate configuration on import (development only)
if (import.meta.env.DEV) {
  const validation = validateQIEConfig();
  if (!validation.isValid) {
    console.warn('QIE Configuration Issues:', validation.errors);
  } else {
    console.log('QIE Configuration validated successfully');
  }
}

export default validateQIEConfig;