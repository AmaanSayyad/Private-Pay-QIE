import useSWR from "swr";
import { squidlAPI } from "../../api/squidl.js";
import { useEffect, useState } from "react";
import { Spinner } from "@nextui-org/react";
import AssetItem from "../alias/AssetItem.jsx";
import { formatCurrency } from "@coingecko/cryptoformat";
import { useUser } from "../../providers/UserProvider.jsx";
import { useAptos } from "../../providers/QIEWalletProvider.jsx";
import { qieBalanceService } from "../../lib/qie/qieBalanceService.js";
import { formatQIEAmount } from "../../utils/qie-utils.js";

export default function Assets() {
  const { assets } = useUser();
  const { account, isConnected } = useAptos();
  const [qieBalance, setQieBalance] = useState(null);
  const [isLoadingQIE, setIsLoadingQIE] = useState(true);

  // Load QIE balance
  useEffect(() => {
    const loadQIEBalance = async () => {
      if (account && isConnected) {
        try {
          const balance = await qieBalanceService.getMainWalletBalance(account);
          setQieBalance(balance);
        } catch (error) {
          console.error('Failed to load QIE balance:', error);
          setQieBalance({ balanceQIE: 0, formattedBalance: '0' });
        } finally {
          setIsLoadingQIE(false);
        }
      } else {
        setIsLoadingQIE(false);
      }
    };

    loadQIEBalance();

    // Listen for balance updates
    const handleBalanceUpdate = () => {
      loadQIEBalance();
    };

    window.addEventListener('qie-balance-updated', handleBalanceUpdate);
    window.addEventListener('balance-updated', handleBalanceUpdate);

    return () => {
      window.removeEventListener('qie-balance-updated', handleBalanceUpdate);
      window.removeEventListener('balance-updated', handleBalanceUpdate);
    };
  }, [account, isConnected]);

  // Merge QIE balance with other assets
  const mergedAssets = [];

  // Add QIE native token first
  if (qieBalance && isConnected) {
    mergedAssets.push({
      balance: qieBalance.balanceQIE,
      formattedBalance: qieBalance.formattedBalance,
      nativeToken: {
        symbol: 'QIE',
        logo: '/assets/qie-logo.png', // Add QIE logo to public/assets/
        name: 'QIE Token'
      },
      chainName: 'QIE Testnet',
      chainLogo: '/assets/qie-logo.png',
      priceUSD: 0, // Will be updated when price API is available
      isQIE: true
    });
  }

  // Add other assets if available
  if (assets?.aggregatedBalances) {
    const otherAssets = [
      ...(assets.aggregatedBalances.native || []),
      ...(assets.aggregatedBalances.erc20 || []),
    ];
    mergedAssets.push(...otherAssets);
  }

  return (
    <div className={"relative flex w-full h-full"}>
      {(isLoadingQIE && !assets) ? (
        <Spinner
          size="md"
          color="primary"
          className="flex items-center justify-center w-full h-40"
        />
      ) : mergedAssets.length > 0 ? (
        <div className="flex flex-col w-full">
          {mergedAssets.map((item, idx) => (
            <AssetItem
              key={idx}
              logoImg={
                item?.nativeToken ? item.nativeToken.logo : item.token?.logo
              }
              balance={
                item.isQIE 
                  ? `${item.formattedBalance} QIE`
                  : `${formatCurrency(
                      item.balance,
                      item?.nativeToken ? item.nativeToken.symbol : item.token.symbol,
                      "de",
                      true,
                      {
                        significantFigures: 5,
                      }
                    )}`
              }
              chainName={item.chainName}
              chainLogo={item.chainLogo}
              priceUSD={
                item.isQIE 
                  ? "$0.00" // Placeholder until price API is available
                  : formatCurrency(item.priceUSD, "USD", "en", false, {
                      significantFigures: 5,
                    })
              }
              tokenSymbol={
                item?.nativeToken ? item.nativeToken.symbol : item.token?.symbol
              }
            />
          ))}
        </div>
      ) : (
        <div className="w-full flex items-center justify-center min-h-64">
          {isConnected ? "No assets found" : "Connect wallet to view assets"}
        </div>
      )}
    </div>
  );
}
