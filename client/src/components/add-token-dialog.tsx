"use client";
import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X, CheckCircle2, ShieldAlert } from "lucide-react";
import { isAddress } from "viem";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useTokenRegistry } from "@/context/token-registry-provider";
import { TokenInfo } from "@/types/token";
import IconBuilder from "./icon-builder";

// Wrappers auto-deploy; add only resolves
const AddTokenDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { resolveToken, addToken } = useTokenRegistry();
  const isMobile = useMediaQuery("(max-width: 640px)");

  const busyRef = React.useRef(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  const [addr, setAddr] = React.useState("");
  const [resolved, setResolved] = React.useState<TokenInfo | null>(null);
  const [isResolving, setIsResolving] = React.useState(false);

  React.useEffect(() => {
    if (!addr) return;
    let cancelled = false;
    void (async () => {
      if (!isAddress(addr)) {
        if (addr.length >= 42) setError("Enter a valid contract address.");
        return;
      }
      setIsResolving(true);
      try {
        const info = await resolveToken(addr);
        if (!cancelled) setResolved(info);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Could not resolve token.");
      } finally {
        if (!cancelled) setIsResolving(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [addr, resolveToken]);

  const resetAll = (): void => {
    setAddr("");
    setResolved(null);
    setError("");
  };

  const handleClose = (): void => {
    if (busyRef.current) return;
    resetAll();
    onOpenChange(false);
  };

  const setBusyState = (v: boolean) => {
    busyRef.current = v;
    setBusy(v);
  };

  const handleAdd = async (): Promise<void> => {
    if (!resolved) return;
    setBusyState(true);
    setError("");
    try {
      await addToken(addr);
      toast.success(`${resolved.encryptedSymbol} added`);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add token.");
    } finally {
      setBusyState(false);
    }
  };

  const DialogComponent = isMobile ? Sheet : AlertDialog;
  const DialogContentComponent = isMobile ? SheetContent : AlertDialogContent;
  const DialogHeaderComponent = isMobile ? SheetHeader : "div";
  const DialogTitleComponent = isMobile ? SheetTitle : AlertDialogTitle;

  return (
    <DialogComponent open={open} onOpenChange={onOpenChange}>
      <DialogContentComponent
        className={`overflow-y-auto max-h-[92vh] ${isMobile ? "w-full rounded-t-2xl" : "w-[448px]"} p-0`}
        side={isMobile ? "bottom" : undefined}
      >
        <DialogHeaderComponent className="px-8 py-6 pb-2 flex flex-row items-center justify-between">
          <DialogTitleComponent className="text-xl font-semibold">
            Add Token
          </DialogTitleComponent>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 rounded-xl"
            onClick={handleClose}
            disabled={busy}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeaderComponent>

        <div className="px-8 pb-8 space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Paste a confidential token or its underlying ERC20 address.
          </div>

          <Input
            type="text"
            placeholder="0x… token address"
            value={addr}
            onChange={(e) => {
              setAddr(e.target.value.trim());
              setResolved(null);
              setError("");
            }}
            className="text-sm p-6 px-4 rounded-xl shadow-none border-gray-200"
            disabled={busy}
            autoFocus
          />

          {isResolving && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Reading token…
            </div>
          )}

          {resolved && !isResolving && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 border rounded-xl bg-muted/40">
                <div className="w-10 h-10 shrink-0">
                  <IconBuilder symbol={resolved.symbol} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium flex items-center gap-1.5">
                    {resolved.encryptedSymbol}
                    {resolved.verified && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    Base {resolved.symbol}, {resolved.decimals} decimals
                  </div>
                </div>
              </div>

              {!resolved.verified && (
                <div className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-500">
                  <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>Not recognized by the official factory.</span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="pt-2 space-y-3">
            <Button
              className="w-full h-12 rounded-xl dark:bg-[#3673F5] dark:text-white dark:hover:bg-[#3673F5]/80"
              onClick={handleAdd}
              disabled={!resolved || isResolving || busy}
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Adding…
                </span>
              ) : (
                "Add token"
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl"
              onClick={handleClose}
              disabled={busy}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContentComponent>
    </DialogComponent>
  );
};

export default AddTokenDialog;
