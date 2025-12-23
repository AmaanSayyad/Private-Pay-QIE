import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "@nextui-org/react";
import { Icons } from "../components/shared/Icons.jsx";
import { useAptos } from "../providers/QIEWalletProvider.jsx";
import { sendQIETransfer } from "../lib/qie/qieTransactionService.js";
import { recordPayment, getUserByUsername, getPaymentLinkByAlias } from "../lib/supabase.js";
import toast from "react-hot-toast";
import { getQIETransactionUrl } from "../utils/qie-utils.js";

const TREASURY_WALLET = import.meta.env.VITE_TREASURY_WALLET_ADDRESS;

export default function SendPage() {
  const navigate = useNavigate();
  const { account, isConnected, connect } = useAptos();
  
  const [recipientUsername, setRecipientUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isValidatingRecipient, setIsValidatingRecipient] = useState(false);
  const [recipientValid, setRecipientValid] = useState(null);

  const handleConnectWallet = async () => {
    try {
      await connect();
      toast.success("Wallet connected successfully!");
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error(error.message || "Failed to connect wallet");
    }
  };

  const validateRecipient = async (username) => {
    if (!username.trim()) {
      setRecipientValid(null);
      return;
    }

    setIsValidatingRecipient(true);
    try {
      // First check if it's a username
      try {
        const user = await getUserByUsername(username.trim());
        if (user) {
          setRecipientValid(true);
          return;
        }
      } catch (userError) {
        console.warn('Username check failed:', userError);
        // Continue to alias check
      }

      // If not found as username, check if it's a payment link alias
      try {
        const paymentLink = await getPaymentLinkByAlias(username.trim());
        if (paymentLink) {
          setRecipientValid(true);
          return;
        }
      } catch (aliasError) {
        console.warn('Alias check failed:', aliasError);
      }

      // Not found as either username or alias
      setRecipientValid(false);
    } catch (error) {
      console.error("Error validating recipient:", error);
      // If there's a network error, assume valid for now
      if (error.message?.includes('unreachable') || error.message?.includes('406')) {
        console.warn('Database unreachable, allowing recipient');
        setRecipientValid(true);
      } else {
        setRecipientValid(false);
      }
    } finally {
      setIsValidatingRecipient(false);
    }
  };

  const handleRecipientChange = (e) => {
    const value = e.target.value;
    setRecipientUsername(value);
    
    // Debounce validation
    clearTimeout(window.recipientValidationTimeout);
    window.recipientValidationTimeout = setTimeout(() => {
      validateRecipient(value);
    }, 500);
  };

  const handleSendPayment = async () => {
    if (!recipientUsername.trim()) {
      toast.error("Please enter a recipient username");
      return;
    }

    if (recipientValid === false) {
      toast.error(`Username or alias '${recipientUsername}' not found. Please check the spelling.`);
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!isConnected || !account) {
      toast.error("Please connect your QIE wallet first");
      return;
    }

    if (!TREASURY_WALLET) {
      toast.error("Treasury wallet not configured");
      return;
    }

    // Validate treasury wallet address format
    if (!TREASURY_WALLET.startsWith('0x') || TREASURY_WALLET.length !== 42) {
      console.error('Invalid treasury wallet format:', TREASURY_WALLET);
      toast.error("Treasury wallet address is not in valid EVM format. Please contact support.");
      return;
    }

    setIsSending(true);
    try {
      // Determine if it's a username or alias and get the actual recipient username
      let actualRecipientUsername = recipientUsername.trim();
      
      // First check if it's a direct username
      try {
        const recipientUser = await getUserByUsername(recipientUsername.trim());
        if (recipientUser) {
          actualRecipientUsername = recipientUser.username;
        } else {
          // Check if it's a payment link alias
          try {
            const paymentLink = await getPaymentLinkByAlias(recipientUsername.trim());
            if (paymentLink) {
              actualRecipientUsername = paymentLink.username;
            } else {
              // If neither found, use the input as username (for cases where DB is unreachable)
              console.warn('Recipient not found in database, using input as username');
              actualRecipientUsername = recipientUsername.trim();
            }
          } catch (aliasError) {
            console.warn('Alias check failed, using input as username:', aliasError);
            actualRecipientUsername = recipientUsername.trim();
          }
        }
      } catch (userError) {
        console.warn('User check failed, using input as username:', userError);
        actualRecipientUsername = recipientUsername.trim();
      }

      // Send QIE to treasury wallet
      const result = await sendQIETransfer({
        accountAddress: account,
        recipientAddress: TREASURY_WALLET,
        amount: parseFloat(amount),
        isTestnet: true,
      });

      if (!result.success) {
        throw new Error("Transaction failed");
      }

      // Record payment in Supabase with the actual username.
      // If the recipient was a payment link alias, tag it so we can
      // show per-link totals on the dashboard.
      const paymentAlias =
        (await getPaymentLinkByAlias(recipientUsername.trim()))?.alias || null;

      await recordPayment(
        account,
        actualRecipientUsername,
        parseFloat(amount),
        result.hash,
        paymentAlias
      );

      // Trigger balance update event
      window.dispatchEvent(new Event('balance-updated'));

      const shortHash = result.hash.slice(0, 6) + "..." + result.hash.slice(-4);
      
      toast.success(
        (t) => (
          <div 
            onClick={() => {
              window.open(getQIETransactionUrl(result.hash), '_blank');
              toast.dismiss(t.id);
            }}
            className="cursor-pointer hover:underline"
          >
            Payment sent to {actualRecipientUsername}.privatepay.me! TX: {shortHash} (click to view)
          </div>
        ),
        { duration: 8000 }
      );

      // Reset form
      setRecipientUsername("");
      setAmount("");
      setRecipientValid(null);
      
      // Navigate back to home after successful payment
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Payment error:", error);
      
      // Show more specific error messages
      if (error.message.includes('Invalid recipient address')) {
        toast.error("Treasury wallet address is invalid. Please contact support.");
      } else if (error.message.includes('not found')) {
        toast.error(`Username or alias '${recipientUsername}' not found. Please check the spelling.`);
      } else if (error.message.includes('insufficient')) {
        toast.error("Insufficient balance for this transaction");
      } else if (error.message.includes('rejected')) {
        toast.error("Transaction was rejected");
      } else {
        toast.error(error.message || "Failed to send payment");
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-start justify-center py-20 px-4 md:px-10">
      <div className="relative flex flex-col gap-4 w-full max-w-md items-center justify-center bg-[#F9F9FA] rounded-[32px] p-4 md:p-6">
        <div className="flex items-center justify-between w-full mb-2">
          <h1 className="font-bold text-lg text-[#19191B]">Send Payment</h1>
          <Button
            onClick={() => navigate("/")}
            className="bg-white rounded-full px-4 h-10 flex items-center gap-2"
          >
            <Icons.back className="size-4" />
            <span className="text-sm">Back</span>
          </Button>
        </div>

        <div className="bg-white rounded-[32px] py-6 px-6 flex flex-col gap-4 w-full border border-gray-200 shadow-lg">
          {/* Wallet Connection */}
          {!isConnected ? (
            <div className="flex flex-col gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="text-sm text-blue-800 text-center">
                  Connect your QIE wallet (MetaMask) to send a payment
                </p>
              </div>
              <Button
                onClick={handleConnectWallet}
                className="bg-primary text-white font-bold py-5 px-6 h-16 w-full rounded-[32px]"
                size="lg"
              >
                Connect QIE Wallet
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Connected Wallet Info */}
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-800 font-medium">Wallet Connected</p>
                    <p className="text-xs text-green-600 mt-1">
                      {account?.slice(0, 6)}...{account?.slice(-4)}
                    </p>
                  </div>
                  <svg className="text-green-600 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* Recipient Input */}
              <Input
                label="Recipient Username or Alias"
                placeholder="username or alias"
                value={recipientUsername}
                onChange={handleRecipientChange}
                description={
                  recipientValid === true ? "✅ Recipient found" :
                  recipientValid === false ? "❌ Username or alias not found" :
                  "Enter username or payment link alias (without .privatepay.me)"
                }
                classNames={{
                  input: "text-lg",
                  inputWrapper: "h-14",
                  description: recipientValid === true ? "text-green-600" :
                              recipientValid === false ? "text-red-600" : ""
                }}
                endContent={
                  <div className="flex items-center gap-2">
                    {isValidatingRecipient && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    )}
                    <span className="text-gray-400 text-sm">.privatepay.me</span>
                  </div>
                }
                color={
                  recipientValid === true ? "success" :
                  recipientValid === false ? "danger" : "default"
                }
              />

              {/* Amount Input */}
              <Input
                label="Amount (QIE)"
                type="number"
                placeholder="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                description="Enter the amount you want to send"
                classNames={{
                  input: "text-lg",
                  inputWrapper: "h-14",
                }}
                min="0"
                step="0.00000001"
              />

              {/* Send Button */}
              <Button
                onClick={handleSendPayment}
                isLoading={isSending}
                disabled={
                  !recipientUsername.trim() || 
                  recipientValid !== true || 
                  !amount || 
                  parseFloat(amount) <= 0 ||
                  isValidatingRecipient
                }
                className="bg-primary text-white font-bold py-5 px-6 h-16 w-full rounded-[32px]"
                size="lg"
              >
                {isSending ? "Sending..." : `Send ${amount || "0"} QIE`}
              </Button>

              {/* Info */}
              <p className="text-xs text-gray-500 text-center mt-2">
                Funds will be sent to the treasury wallet. The recipient can withdraw anytime.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
