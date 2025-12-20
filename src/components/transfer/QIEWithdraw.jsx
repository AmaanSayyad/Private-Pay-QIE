import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "@nextui-org/react";
import { Icons } from "../shared/Icons.jsx";
import { useAptos } from "../../providers/QIEWalletProvider.jsx";
import { getUserBalance, withdrawFunds } from "../../lib/supabase.js";
import { qiePaymentProcessor } from "../../lib/qie/qiePaymentProcessor.js";
import toast from "react-hot-toast";
import { getQIETransactionUrl, formatQIEAmount } from "../../utils/qie-utils.js";
import { ethers } from "ethers";

const TREASURY_WALLET_ADDRESS = import.meta.env.VITE_TREASURY_WALLET_ADDRESS;
const TREASURY_PRIVATE_KEY = import.meta.env.VITE_TREASURY_PRIVATE_KEY;

export function QIEWithdraw() {
  const navigate = useNavigate();
  const { account, isConnected, connect } = useAptos();
  
  const [username, setUsername] = useState("");
  const [availableBalance, setAvailableBalance] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  // Load user data and balance
  useEffect(() => {
    async function loadUserData() {
      if (account) {
        // Get username from localStorage
        const savedUsername = localStorage.getItem(`qie_username_${account}`);
        const userUsername = savedUsername || account.slice(2, 8);
        setUsername(userUsername);
        
        // Set destination address to connected wallet by default
        setDestinationAddress(account);
        
        // Load balance
        await loadBalance(userUsername);
      }
    }
    
    loadUserData();
  }, [account]);

  const loadBalance = async (userUsername) => {
    try {
      setIsLoadingBalance(true);
      const balanceData = await getUserBalance(userUsername || username);
      setAvailableBalance(balanceData?.available_balance || 0);
    } catch (error) {
      console.error('Error loading balance:', error);
      toast.error('Failed to load balance');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connect();
      toast.success("Wallet connected successfully!");
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error(error.message || "Failed to connect wallet");
    }
  };

  const handleMaxClick = () => {
    setWithdrawAmount(availableBalance.toString());
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (parseFloat(withdrawAmount) > availableBalance) {
      toast.error("Insufficient balance");
      return;
    }

    if (!destinationAddress || !ethers.isAddress(destinationAddress)) {
      toast.error("Please enter a valid destination address");
      return;
    }

    if (!TREASURY_WALLET_ADDRESS || !TREASURY_PRIVATE_KEY) {
      toast.error("Treasury wallet not configured");
      return;
    }

    setIsWithdrawing(true);
    try {
      // Create treasury wallet signer
      const provider = new ethers.JsonRpcProvider('https://rpc1testnet.qie.digital/');
      const treasuryWallet = new ethers.Wallet(TREASURY_PRIVATE_KEY, provider);
      
      console.log('Treasury wallet address:', treasuryWallet.address);
      console.log('Expected treasury address:', TREASURY_WALLET_ADDRESS);
      
      // Verify treasury wallet
      if (treasuryWallet.address.toLowerCase() !== TREASURY_WALLET_ADDRESS.toLowerCase()) {
        throw new Error('Treasury wallet configuration mismatch');
      }

      // Check treasury balance
      const treasuryBalance = await provider.getBalance(TREASURY_WALLET_ADDRESS);
      const withdrawAmountWei = ethers.parseEther(withdrawAmount);
      
      if (treasuryBalance < withdrawAmountWei) {
        throw new Error('Insufficient treasury balance');
      }

      // Prepare transaction
      const transaction = {
        to: destinationAddress,
        value: withdrawAmountWei,
        gasLimit: 21000,
      };

      // Get gas price
      const feeData = await provider.getFeeData();
      if (feeData.gasPrice) {
        transaction.gasPrice = feeData.gasPrice;
      } else {
        transaction.maxFeePerGas = feeData.maxFeePerGas;
        transaction.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
      }

      console.log('Sending transaction:', transaction);

      // Send transaction from treasury
      const txResponse = await treasuryWallet.sendTransaction(transaction);
      console.log('Transaction sent:', txResponse.hash);

      // Wait for confirmation
      const receipt = await provider.waitForTransaction(txResponse.hash, 1);
      console.log('Transaction confirmed:', receipt);

      // Record withdrawal in database
      await withdrawFunds(username, parseFloat(withdrawAmount), destinationAddress, txResponse.hash);

      // Update balance
      await loadBalance();

      // Trigger balance update event
      window.dispatchEvent(new Event('balance-updated'));

      const shortHash = txResponse.hash.slice(0, 6) + "..." + txResponse.hash.slice(-4);
      
      toast.success(
        (t) => (
          <div 
            onClick={() => {
              window.open(getQIETransactionUrl(txResponse.hash), '_blank');
              toast.dismiss(t.id);
            }}
            className="cursor-pointer hover:underline"
          >
            Withdrawal successful! TX: {shortHash} (click to view)
          </div>
        ),
        { duration: 8000 }
      );

      // Reset form
      setWithdrawAmount("");
      
    } catch (error) {
      console.error("Withdrawal error:", error);
      
      // Show specific error messages
      if (error.message.includes('Insufficient treasury balance')) {
        toast.error("Treasury has insufficient funds. Please contact support.");
      } else if (error.message.includes('configuration mismatch')) {
        toast.error("Treasury wallet configuration error. Please contact support.");
      } else if (error.message.includes('insufficient funds')) {
        toast.error("Insufficient gas fees in treasury wallet");
      } else if (error.message.includes('rejected')) {
        toast.error("Transaction was rejected");
      } else {
        toast.error(error.message || "Withdrawal failed");
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="relative flex flex-col w-full max-w-md items-center justify-center bg-[#F9F9FA] rounded-[32px] p-4 md:p-6">
      <div className="flex items-center justify-between w-full mb-6">
        <h1 className="font-bold text-lg text-[#19191B]">Withdraw Funds</h1>
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
                Connect your QIE wallet to withdraw funds
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

            {/* Available Balance */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-800 font-medium">Available Balance</p>
                  <p className="text-xs text-primary-600 mt-1">
                    Held in treasury wallet
                  </p>
                </div>
                <div className="text-right">
                  {isLoadingBalance ? (
                    <div className="animate-pulse bg-primary-200 h-6 w-16 rounded"></div>
                  ) : (
                    <p className="text-lg font-bold text-primary-900">
                      {formatQIEAmount(availableBalance.toString(), false, 6)} QIE
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Destination Address */}
            <Input
              label="Destination Address"
              placeholder="0x..."
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              description="Address where you want to receive the QIE tokens"
              classNames={{
                input: "text-sm",
                inputWrapper: "h-14",
              }}
            />

            {/* Withdraw Amount */}
            <div className="relative">
              <Input
                label="Withdraw Amount (QIE)"
                type="number"
                placeholder="0.0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                description={`Available: ${formatQIEAmount(availableBalance.toString(), false, 6)} QIE`}
                classNames={{
                  input: "text-lg pr-16",
                  inputWrapper: "h-14",
                }}
                min="0"
                step="0.00000001"
                max={availableBalance}
                endContent={
                  <Button
                    size="sm"
                    onClick={handleMaxClick}
                    className="bg-primary-100 text-primary-700 font-medium"
                    disabled={availableBalance <= 0}
                  >
                    Max
                  </Button>
                }
              />
            </div>

            {/* Withdraw Button */}
            <Button
              onClick={handleWithdraw}
              isLoading={isWithdrawing}
              disabled={
                !withdrawAmount || 
                parseFloat(withdrawAmount) <= 0 || 
                parseFloat(withdrawAmount) > availableBalance ||
                !destinationAddress ||
                !ethers.isAddress(destinationAddress)
              }
              className="bg-primary text-white font-bold py-5 px-6 h-16 w-full rounded-[32px]"
              size="lg"
            >
              {isWithdrawing ? "Processing..." : `Withdraw ${withdrawAmount || "0"} QIE`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}