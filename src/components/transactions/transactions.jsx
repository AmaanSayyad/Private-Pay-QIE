import TxItem from "../alias/TxItem.jsx";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { shortenId } from "../../utils/formatting-utils.js";
import { Spinner, Chip } from "@nextui-org/react";
import { getUserPayments } from "../../lib/supabase.js";
import { 
  getNetworkDisplayInfo, 
  determineTransactionNetwork, 
  formatTransactionAmount,
  getNetworkBadgeProps 
} from "../../utils/qie-utils.js";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [networkFilter, setNetworkFilter] = useState("all"); // "all", "qie", "aptos"

  const loadTransactions = async () => {
    try {
      // Get transactions from database with network information
      const allTransactions = await getUserPayments(username);
      setTransactions(allTransactions);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();

    // Refresh every 10 seconds
    const interval = setInterval(() => {
      loadTransactions();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const groupedTransactions = useMemo(() => {
    // Filter transactions by network if filter is applied
    let filteredTransactions = transactions;
    if (networkFilter !== "all") {
      filteredTransactions = transactions?.filter(tx => {
        const network = determineTransactionNetwork(tx);
        return network === networkFilter;
      });
    }

    return filteredTransactions?.reduce((acc, tx) => {
      const dateKey = format(new Date(tx.created_at), "MM/dd/yyyy");
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(tx);
      return acc;
    }, {});
  }, [transactions, networkFilter]);

  // Calculate network statistics
  const networkStats = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return { total: 0, qie: 0, aptos: 0 };
    }

    const stats = transactions.reduce((acc, tx) => {
      const network = determineTransactionNetwork(tx);
      acc.total++;
      acc[network] = (acc[network] || 0) + 1;
      return acc;
    }, { total: 0, qie: 0, aptos: 0 });

    return stats;
  }, [transactions]);

  return (
    <div className={"relative flex h-full w-full flex-col"}>
      {/* Network Filter Header */}
      {transactions && transactions.length > 0 && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Filter by Network</h3>
            <div className="text-xs text-gray-500">
              Total: {networkStats.total} transactions
            </div>
          </div>
          <div className="flex gap-2">
            <Chip
              size="sm"
              color={networkFilter === "all" ? "primary" : "default"}
              variant={networkFilter === "all" ? "solid" : "bordered"}
              className="cursor-pointer"
              onClick={() => setNetworkFilter("all")}
            >
              All ({networkStats.total})
            </Chip>
            <Chip
              size="sm"
              color={networkFilter === "qie" ? "primary" : "default"}
              variant={networkFilter === "qie" ? "solid" : "bordered"}
              className="cursor-pointer"
              onClick={() => setNetworkFilter("qie")}
            >
              QIE ({networkStats.qie || 0})
            </Chip>
            {networkStats.aptos > 0 && (
              <Chip
                size="sm"
                color={networkFilter === "aptos" ? "warning" : "default"}
                variant={networkFilter === "aptos" ? "solid" : "bordered"}
                className="cursor-pointer"
                onClick={() => setNetworkFilter("aptos")}
              >
                Aptos ({networkStats.aptos})
              </Chip>
            )}
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
                  <div key={idx} className="relative">
                    <TxItem
                      isNounsies
                      addressNounsies={`${username}.privatepay.me`}
                      chainImg={networkInfo.icon}
                      title={title}
                      subtitle={subtitle}
                      value={value}
                      subValue={tx.tx_hash ? shortenId(tx.tx_hash) : ''}
                    />
                    {/* Network indicator badge */}
                    <div className="absolute top-3 right-0">
                      <Chip 
                        size={badgeProps.size}
                        color={badgeProps.color}
                        variant={badgeProps.variant}
                        className="text-xs"
                      >
                        {badgeProps.label}
                      </Chip>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full flex flex-col items-center justify-center min-h-64 gap-2">
          <p className="text-gray-600">
            {networkFilter === "all" 
              ? "No transactions found" 
              : `No ${networkFilter.toUpperCase()} transactions found`
            }
          </p>
          <p className="text-sm text-gray-400">
            {networkFilter === "all"
              ? "Transactions will appear here when you receive or withdraw funds"
              : `Switch to "All" to see transactions from other networks`
            }
          </p>
          {networkFilter !== "all" && (
            <Chip
              size="sm"
              color="primary"
              variant="bordered"
              className="cursor-pointer mt-2"
              onClick={() => setNetworkFilter("all")}
            >
              Show All Networks
            </Chip>
          )}
        </div>
      )}
    </div>
  );
}
