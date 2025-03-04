import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ArrowRight, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { assets } from "@/utils/constants";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";
import {
  CONFIDENTIAL_ERC20_ADDRESS,
  ERC20_CONTRACT_ABI,
  ERC20_CONTRACT_ADDRESS,
  CONFIDENTIAL_ERC20_ABI,
} from "@/utils/contracts";

export const TransactionForm = ({
  mode,
  selectedAsset: defaultSelectedAsset,
  handleClose,
}) => {
  const [amount, setAmount] = useState("0");
  const [isApproving, setIsApproving] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(defaultSelectedAsset);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  const { address } = useAccount();

  // Handle clicks outside of dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isDropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Contract interactions
  const { writeContractAsync: approve } = useWriteContract();
  const { writeContractAsync: wrap } = useWriteContract();
  const { data: txData, waitForTransactionReceipt } =
    useWaitForTransactionReceipt();

  // Contract reads
  const { data: allowance } = useReadContract({
    address: ERC20_CONTRACT_ADDRESS,
    abi: ERC20_CONTRACT_ABI,
    functionName: "allowance",
    args: [address, CONFIDENTIAL_ERC20_ADDRESS],
    watch: true,
  });

  const { data: balance } = useReadContract({
    address: ERC20_CONTRACT_ADDRESS,
    abi: ERC20_CONTRACT_ABI,
    functionName: "balanceOf",
    args: [address],
    watch: true,
  });

  const handleTransaction = async () => {
    if (!amount || !address) return;
    setError("");
    setIsProcessing(true);
    setIsApproving(true);

    try {
      const parsedAmount = parseUnits(amount, 6);

      if (mode === "shield") {
        // Check if approval is needed
        if (allowance < parsedAmount) {
          setIsApproving(true);
          try {
            const approveTxHash = await approve({
              address: ERC20_CONTRACT_ADDRESS,
              abi: ERC20_CONTRACT_ABI,
              functionName: "approve",
              args: [CONFIDENTIAL_ERC20_ADDRESS, parsedAmount],
            });

            // Wait for approval transaction
            await waitForTransactionReceipt({ hash: approveTxHash });

            // Proceed with wrapping after approval
            const wrapTxHash = await wrap({
              address: CONFIDENTIAL_ERC20_ADDRESS,
              abi: CONFIDENTIAL_ERC20_ABI,
              functionName: "wrap",
              args: [parsedAmount],
            });

            // Wait for wrap transaction
            await waitForTransactionReceipt({ hash: wrapTxHash });
            handleClose(mode);
          } catch (error) {
            console.error("Transaction failed:", error);
            setError("Transaction failed. Please try again.");
          } finally {
            setIsApproving(false);
          }
        } else {
          // Direct wrap if already approved
          try {
            const wrapTxHash = await wrap({
              address: CONFIDENTIAL_ERC20_ADDRESS,
              abi: CONFIDENTIAL_ERC20_ABI,
              functionName: "wrap",
              args: [parsedAmount],
            });

            // Wait for wrap transaction
            await waitForTransactionReceipt({ hash: wrapTxHash });
            handleClose(mode);
          } catch (error) {
            console.error("Wrap failed:", error);
            setError("Wrap failed. Please try again.");
          }
        }
      }
    } catch (error) {
      console.error("Transaction failed:", error);
      setError("Transaction failed. Please try again.");
    } finally {
      setIsApproving(false);
      setIsProcessing(false);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    if (value.split(".").length > 2) return;
    setAmount(value);

    if (Number(value) > Number(selectedAsset?.amount)) {
      setError(
        `Insufficient balance. Maximum available: ${selectedAsset?.amount} ${selectedAsset?.name}`
      );
    } else {
      setError("");
    }
  };

  const handleMaxClick = (e) => {
    // Prevent event from bubbling up to parent elements
    e.stopPropagation();
    setAmount(selectedAsset?.amount);
    setError("");
  };

  const toggleDropdown = (e) => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const isAmountValid =
    Number(amount) > 0 && Number(amount) <= Number(selectedAsset?.amount);

  const renderDestination = () => {
    if (mode === "shield") {
      return (
        <>
          <div className="flex items-center gap-2 pl-0.5 py-0.5 pr-4 border w-full rounded-full">
            <img
              src="/profile/pf.svg"
              alt="Avatar"
              className="w-6 h-6 rounded-full"
            />
            <span className="text-sm">
              {address
                ? `${address.slice(0, 4)}...${address.slice(-4)}`
                : "0x...0000"}
            </span>
          </div>
          <ArrowRight className="h-10 w-10" />
          <div className="flex items-center gap-2 pl-0.5 py-0.5 pr-4 border w-full rounded-full">
            <div className="w-6 h-6 bg-blue-500 rounded-full" />
            <span className="text-sm">Confidential</span>
          </div>
        </>
      );
    }
    return (
      <>
        <div className="flex items-center gap-2 pl-0.5 py-0.5 pr-4 border w-full rounded-full">
          <div className="w-6 h-6 bg-blue-500 rounded-full" />
          <span className="text-sm">Confidential</span>
        </div>
        <ArrowRight className="h-10 w-10" />
        <div className="flex items-center gap-2 pl-0.5 py-0.5 pr-4 border w-full rounded-full">
          <img
            src="/profile/pf.svg"
            alt="Destination"
            className="w-6 h-6 rounded-full"
          />
          <span className="text-sm">
            {address
              ? `${address.slice(0, 4)}...${address.slice(-4)}`
              : "0x...0000"}
          </span>
        </div>
      </>
    );
  };

  return (
    <div className="relative pb-8">
      {/* <div className="flex items-center gap-3 mb-4">{renderDestination()}</div> */}

      {isApproving && isProcessing && (
        <div>
          {" "}
          <div className="border bg-[#E8E8E8] rounded-xl md:h-48 p-6 mb-6 text-center grid place-items-center">
            <div>
              <p className="font-medium text-[#AFAFAF]">
                Animated loading state (placeholder)
              </p>
            </div>
          </div>{" "}
        </div>
      )}

      {!isApproving && !isProcessing && (
        <div className="relative">
          {mode === "withdraw" && (
            <div className="border rounded-xl md:h-64 p-6 mb-6 text-center grid place-items-center">
              <div>
                <div className="grid place-items-center gap-6">
                  <img
                    src={"/tokens/confidential/usdt-polygon.png"}
                    alt={selectedAsset?.name}
                    className="w-16"
                  />

                  <p className="text-3xl font-semibold mb-1 bg-transparent text-center w-full focus:outline-none text-black disabled:opacity-50">
                    $12,000
                  </p>
                </div>

                <div className="text-[#AFAFAF]">
                  {amount || "0"} {selectedAsset?.name}
                </div>
                {error && (
                  <div className="text-red-500 text-sm mt-2">{error}</div>
                )}
              </div>
            </div>
          )}

          {mode === "shield" && (
            <div
              ref={triggerRef}
              onClick={toggleDropdown}
              className="p-4 border rounded-xl mb-4 cursor-pointer hover:bg-gray-50"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <img
                    src={selectedAsset?.icon}
                    alt={selectedAsset?.name}
                    className="w-10 h-10"
                  />
                  <div>
                    <p>{selectedAsset?.name}</p>
                    <div className="text-sm text-gray-500">
                      Balance: {selectedAsset?.amount} {selectedAsset?.name}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Max button that stops propagation */}
                  <div
                    onClick={handleMaxClick}
                    className="h-8 px-3 text-sm text-blue-500 cursor-pointer transition-colors hover:bg-blue-50 bg-[#E7EEFE] rounded-full inline-flex items-center justify-center"
                  >
                    Max
                  </div>
                  {/* <ChevronDown className="h-5 w-5" /> */}
                </div>
              </div>
            </div>
          )}

          {/* Custom dropdown menu */}
          {/* {isDropdownOpen && (
          <div 
            ref={dropdownRef}
            className="absolute z-50 w-full bg-white rounded-md border shadow-md p-1 mt-1"
          >
            <div className="max-h-60 overflow-y-auto">
              {assets.map((asset, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => {
                    setSelectedAsset(asset);
                    setIsDropdownOpen(false);
                    setAmount("");
                    setError("");
                  }}
                >
                  <img src={asset.icon} alt={asset.name} className="w-8 h-8" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{asset.name}</p>
                      <p className="text-sm text-gray-500">{asset.amount}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">{asset.chain}</p>
                      <p className="text-sm text-gray-500">{asset.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )} */}
        </div>
      )}

      {!isApproving && !isProcessing && (
        <>
          {mode === "shield" && (
            <div className="border rounded-xl md:h-48 p-6 mb-6 text-center grid place-items-center">
              <div>
                <div>
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    className="text-3xl font-semibold mb-1 bg-transparent text-center w-full focus:outline-none text-black disabled:opacity-50"
                    placeholder="0"
                    disabled={isProcessing}
                  />
                </div>

                <div className="text-[#AFAFAF]">
                  {amount || "0"} {selectedAsset?.name}
                </div>
                {error && (
                  <div className="text-red-500 text-sm mt-2">{error}</div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {!isApproving && !isProcessing && (
        <div className="grid gap-4">
          {mode === "shield" ? (
            <Button
              className="w-full rounded-full"
              disabled={!isAmountValid || isProcessing}
              onClick={handleTransaction}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isApproving ? "Approving..." : "Processing..."}
                </>
              ) : (
                <>{mode === "shield" ? "Encrypt" : "Decrypt"}</>
              )}
            </Button>
          ) : (
            <Button
              className="w-full rounded-full"
              // disabled={!isAmountValid || isProcessing}
              onClick={() => {
                setIsApproving(true);
                setIsProcessing(true);
              }}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isApproving ? "Approving..." : "Processing..."}
                </>
              ) : (
                <>{mode === "shield" ? "Encrypt" : "Decrypt"}</>
              )}
            </Button>
          )}

          {/* {mode === "shield" && (
          <div className="text-center text-muted-foreground">
            <p>Your tokens will be confidential after shielding.</p>
          </div>
        )} */}
        </div>
      )}
    </div>
  );
};

export default TransactionForm;
