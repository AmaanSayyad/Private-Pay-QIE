import TxItem from "../alias/TxItem.jsx";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { shortenId } from "../../utils/formatting-utils.js";
import { Spinner } from "@nextui-org/react";
import { getUserPayments } from "../../lib/supabase.js";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState("");

  const loadTransactions = async () => {
    try {
      // TODO: Replace with QIE wallet integration
      // For now, show empty state
      setTransactions([]);
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
    return transactions?.reduce((acc, tx) => {
      const dateKey = format(new Date(tx.created_at), "MM/dd/yyyy");
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(tx);
      return acc;
    }, {});
  }, [transactions]);

  return (
    <div className={"relative flex h-full w-full"}>
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
                
                let title, subtitle, value;
                
                if (isWithdrawal) {
                  title = "Withdrawal";
                  subtitle = "to your wallet";
                  value = `-${Math.abs(tx.amount).toFixed(4)} QIE`;
                } else if (isSent) {
                  title = "Sent Payment";
                  subtitle = `to ${tx.recipient_username}.privatepay.me`;
                  value = `-${Math.abs(tx.amount).toFixed(4)} QIE`;
                } else {
                  title = `${username}.privatepay.me`;
                  subtitle = `from ${shortenId(tx.sender_address)}`;
                  value = `+${Math.abs(tx.amount).toFixed(4)} QIE`;
                }
                
                return (
                  <TxItem
                    key={idx}
                    isNounsies
                    addressNounsies={`${username}.privatepay.me`}
                    chainImg="https://qie.digital/favicon.ico"
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
            Transactions will appear here when you receive or withdraw QIE
          </p>
        </div>
      )}
    </div>
  );
}
