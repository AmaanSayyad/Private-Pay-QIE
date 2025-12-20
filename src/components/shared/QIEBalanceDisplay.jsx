/**
 * QIE Balance Display Component
 * Reusable component for displaying QIE token balances with proper formatting
 */

import { useState, useEffect } from 'react';
import { Skeleton } from '@nextui-org/react';
import { formatQIEAmount, weiToQIE } from '../../utils/qie-utils.js';
import { qieBalanceService } from '../../lib/qie/qieBalanceService.js';

/**
 * QIE Balance Display Component
 * @param {Object} props
 * @param {string|number} props.balance - Balance in QIE or wei
 * @param {boolean} props.fromWei - Whether balance is in wei format
 * @param {number} props.decimals - Number of decimal places to show
 * @param {string} props.size - Size variant: 'sm', 'md', 'lg', 'xl'
 * @param {boolean} props.showSymbol - Whether to show QIE symbol
 * @param {boolean} props.showUSD - Whether to show USD value
 * @param {boolean} props.isLoading - Loading state
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Inline styles
 */
export default function QIEBalanceDisplay({
  balance = 0,
  fromWei = false,
  decimals = 4,
  size = 'md',
  showSymbol = true,
  showUSD = false,
  isLoading = false,
  className = '',
  style = {}
}) {
  const [formattedBalance, setFormattedBalance] = useState(null);
  const [usdValue, setUSDValue] = useState(null);

  useEffect(() => {
    const formatBalance = async () => {
      try {
        let qieAmount;
        if (fromWei) {
          qieAmount = parseFloat(weiToQIE(balance.toString()));
        } else {
          qieAmount = parseFloat(balance.toString());
        }

        const formatted = formatQIEAmount(qieAmount.toString(), false, decimals);
        setFormattedBalance(formatted);

        if (showUSD) {
          const balanceWithUSD = await qieBalanceService.formatBalanceWithUSD(qieAmount, decimals);
          setUSDValue(balanceWithUSD.usd.formatted);
        }
      } catch (error) {
        console.error('Error formatting balance:', error);
        setFormattedBalance('0');
        setUSDValue('$0.00');
      }
    };

    if (balance !== null && balance !== undefined) {
      formatBalance();
    }
  }, [balance, fromWei, decimals, showUSD]);

  // Size configurations
  const sizeConfig = {
    sm: {
      balanceText: 'text-sm',
      symbolText: 'text-xs',
      usdText: 'text-xs',
      gap: 'gap-1',
      skeletonHeight: 'h-4',
      skeletonWidth: 'w-16'
    },
    md: {
      balanceText: 'text-lg',
      symbolText: 'text-sm',
      usdText: 'text-sm',
      gap: 'gap-2',
      skeletonHeight: 'h-6',
      skeletonWidth: 'w-20'
    },
    lg: {
      balanceText: 'text-2xl',
      symbolText: 'text-lg',
      usdText: 'text-base',
      gap: 'gap-2',
      skeletonHeight: 'h-8',
      skeletonWidth: 'w-24'
    },
    xl: {
      balanceText: 'text-4xl',
      symbolText: 'text-xl',
      usdText: 'text-lg',
      gap: 'gap-3',
      skeletonHeight: 'h-12',
      skeletonWidth: 'w-32'
    }
  };

  const config = sizeConfig[size] || sizeConfig.md;

  if (isLoading) {
    return (
      <div className={`flex items-baseline ${config.gap} ${className}`} style={style}>
        <Skeleton className={`${config.skeletonWidth} ${config.skeletonHeight} rounded`} />
        {showSymbol && (
          <Skeleton className="w-8 h-4 rounded" />
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`} style={style}>
      <div className={`flex items-baseline ${config.gap}`}>
        <span className={`font-bold text-gray-900 ${config.balanceText}`}>
          {formattedBalance || '0'}
        </span>
        {showSymbol && (
          <span className={`font-semibold text-gray-600 ${config.symbolText}`}>
            QIE
          </span>
        )}
      </div>
      {showUSD && usdValue && (
        <span className={`text-gray-500 ${config.usdText} mt-1`}>
          {usdValue}
        </span>
      )}
    </div>
  );
}

/**
 * QIE Balance Card Component
 * Card wrapper for balance display with additional styling
 */
export function QIEBalanceCard({
  balance,
  fromWei = false,
  title = "Balance",
  subtitle = null,
  showUSD = true,
  isLoading = false,
  className = '',
  children
}) {
  return (
    <div className={`bg-white rounded-2xl p-6 border border-gray-200 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      
      <QIEBalanceDisplay
        balance={balance}
        fromWei={fromWei}
        size="xl"
        showSymbol={true}
        showUSD={showUSD}
        isLoading={isLoading}
        decimals={6}
      />
      
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * QIE Balance Summary Component
 * Shows multiple balance types (main wallet, stealth, total)
 */
export function QIEBalanceSummary({
  mainBalance = 0,
  stealthBalance = 0,
  isLoading = false,
  className = ''
}) {
  const totalBalance = parseFloat(mainBalance) + parseFloat(stealthBalance);

  return (
    <div className={`space-y-4 ${className}`}>
      <QIEBalanceCard
        balance={totalBalance}
        title="Total Balance"
        subtitle="Combined main wallet and stealth addresses"
        showUSD={true}
        isLoading={isLoading}
      />
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Main Wallet</h4>
          <QIEBalanceDisplay
            balance={mainBalance}
            size="md"
            showSymbol={true}
            showUSD={false}
            isLoading={isLoading}
            decimals={4}
          />
        </div>
        
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Stealth Addresses</h4>
          <QIEBalanceDisplay
            balance={stealthBalance}
            size="md"
            showSymbol={true}
            showUSD={false}
            isLoading={isLoading}
            decimals={4}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * QIE Balance List Item Component
 * For displaying balances in lists (transactions, payments, etc.)
 */
export function QIEBalanceListItem({
  balance,
  fromWei = false,
  label = null,
  timestamp = null,
  address = null,
  isIncoming = true,
  className = ''
}) {
  const balanceNum = parseFloat(fromWei ? weiToQIE(balance.toString()) : balance.toString());
  const isPositive = balanceNum > 0;
  const colorClass = isIncoming && isPositive ? 'text-green-600' : 
                    !isIncoming && isPositive ? 'text-red-600' : 'text-gray-600';

  return (
    <div className={`flex items-center justify-between py-3 ${className}`}>
      <div className="flex-1">
        {label && (
          <p className="font-medium text-gray-900 text-sm">{label}</p>
        )}
        {address && (
          <p className="text-xs text-gray-500 mt-1">
            {address.slice(0, 10)}...{address.slice(-8)}
          </p>
        )}
        {timestamp && (
          <p className="text-xs text-gray-400 mt-1">
            {new Date(timestamp * 1000).toLocaleDateString()}
          </p>
        )}
      </div>
      
      <div className="text-right">
        <QIEBalanceDisplay
          balance={balance}
          fromWei={fromWei}
          size="sm"
          showSymbol={true}
          showUSD={false}
          decimals={4}
          className={colorClass}
        />
      </div>
    </div>
  );
}