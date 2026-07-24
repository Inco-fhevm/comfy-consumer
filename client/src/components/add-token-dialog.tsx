"use client";
import React from "react";
import { LoaderCircle, CircleCheck, ShieldAlert } from "lucide-react";
import { isAddress } from "viem";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const handleClose = (): void => {
    if (busy) return;
    setAddr("");
    setResolved(null);
    setError("");
    onOpenChange(false);
  };

  const handleAdd = async (): Promise<void> => {
    if (!resolved) return;
    setBusy(true);
    setError("");
    try {
      await addToken(addr);
      toast.success(`${resolved.encryptedSymbol} added`);
      onOpenChange(false);
      setAddr("");
      setResolved(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add token.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => !o && handleClose()}
      onClose={handleClose}
      closeDisabled={busy}
      title="Add Token"
      contentClassName="overflow-y-auto max-h-[92vh]"
    >
      <div className="px-8 pb-8 space-y-4">
        <div className="text-sm text-muted-foreground">
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
          className="text-sm p-6 px-4 rounded-xl shadow-none"
          disabled={busy}
          autoFocus
        />

        {isResolving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" /> Reading token…
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
                    <CircleCheck className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
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
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="pt-2 space-y-3">
          <Button
            className="w-full h-12 rounded-xl"
            onClick={handleAdd}
            disabled={!resolved || isResolving || busy}
          >
            {busy ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin" /> Adding…
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
    </ResponsiveDialog>
  );
};

export default AddTokenDialog;
