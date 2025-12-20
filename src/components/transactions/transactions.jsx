import TxItem from "../alias/TxItem.jsx";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { shortenId } from "../../utils/formatting-utils.js";
import { Spinner, Chip } from "@nextui-org/react";
import { getUserPayments } from "../../lib/supabase.js";
import { useAptos } from "../../providers/QIEWalletProvider.jsx";
import { 
  getNetworkDisplayInfo, 
  determineTransactionNetwork, 
  formatTransactionAmount,
  getNetworkBadgeProps 
} from "../../utils/qie-utils.js";

export default function Transactions() {
  const { account } = useAptos();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState("");

  // Get username from localStorage when account changes
  useEffect(() => {
    if (account) {
      const savedUsername = localStorage.getItem(`qie_username_${account}`);
      const userUsername = savedUsername || account.slice(2, 8);
      setUsername(userUsername);
    }
  }, [account]);

  const loadTransactions = async () => {
    if (!username) return; // Don't load if no username
    
    try {
      console.log('Loading transactions for username:', username);
      // Get transactions from database with network information
      const allTransactions = await getUserPayments(username);
      console.log('Loaded transactions:', allTransactions);
      setTransactions(allTransactions);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (username) {
      loadTransactions();

      // Refresh every 10 seconds
      const interval = setInterval(() => {
        loadTransactions();
      }, 10000);

      // Listen for balance updates (triggered after payments/withdrawals)
      const handleBalanceUpdate = () => {
        console.log('Balance updated, refreshing transactions...');
        loadTransactions();
      };

      window.addEventListener('balance-updated', handleBalanceUpdate);

      return () => {
        clearInterval(interval);
        window.removeEventListener('balance-updated', handleBalanceUpdate);
      };
    }
  }, [username]); // Depend on username instead of empty array

  const groupedTransactions = useMemo(() => {
    // Show all transactions (no filtering needed since we only use QIE now)
    return transactions?.reduce((acc, tx) => {
      const dateKey = format(new Date(tx.created_at), "MM/dd/yyyy");
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(tx);
      return acc;
    }, {});
  }, [transactions]);

  // Calculate network statistics - only show QIE
  const networkStats = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return { total: 0, qie: 0 };
    }

    const stats = transactions.reduce((acc, tx) => {
      const network = determineTransactionNetwork(tx);
      acc.total++;
      if (network === 'qie') {
        acc.qie = (acc.qie || 0) + 1;
      }
      return acc;
    }, { total: 0, qie: 0 });

    return stats;
  }, [transactions]);

  return (
    <div className={"relative flex h-full w-full flex-col"}>
      {/* Simplified Header - No Network Filter */}
      {transactions && transactions.length > 0 && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Recent Transactions</h3>
            <div className="text-xs text-gray-500">
              {networkStats.total} transaction{networkStats.total !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      {/* Transaction List */}
      {isLoading ? (
        <Spinner
          size="md"
          color="primary"
          className="flex items-center justify-center w-full h-40"
        />
      ) : transactions && transactions.length > 0 ? (
        <div className="flex flex-col w-full">
          {Object.keys(groupedTransactions).map((date) => (
            <div key={date} className="mb-4">
              <p className="text-[#A1A1A3] font-medium text-sm mt-1">{date}</p>
              {groupedTransactions[date].map((tx, idx) => {
                const isWithdrawal = tx.status === 'withdrawn';
                const isSent = tx.is_sent === true;
                const isReceived = !isWithdrawal && !isSent;
                
                // Determine network using utility function
                const network = determineTransactionNetwork(tx);
                const networkInfo = getNetworkDisplayInfo(network);
                const badgeProps = getNetworkBadgeProps(network);
                
                let title, subtitle, value;
                
                if (isWithdrawal) {
                  title = "Withdrawal";
                  subtitle = "to your wallet";
                  value = formatTransactionAmount(tx.amount, network, false);
                } else if (isSent) {
                  title = "Sent Payment";
                  subtitle = `to ${tx.recipient_username}.privatepay.me`;
                  value = formatTransactionAmount(tx.amount, network, false);
                } else {
                  title = `${username}.privatepay.me`;
                  subtitle = `from ${shortenId(tx.sender_address)}`;
                  value = formatTransactionAmount(tx.amount, network, true);
                }
                
                return (
                  <TxItem
                    key={idx}
                    isNounsies
                    addressNounsies={`${username}.privatepay.me`}
                    chainImg={networkInfo.icon}
                    title={title}
                    subtitle={subtitle}
                    value={value}
                    subValue={tx.tx_hash ? shortenId(tx.tx_hash) : ''}
                  />
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full flex flex-col items-center justify-center min-h-64 gap-2">
          <p className="text-gray-600">No transactions found</p>
          <p className="text-sm text-gray-400">
            Transactions will appear here when you receive or withdraw funds
          </p>
        </div>
      )}
    </div>
  );
}
