"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Download, LoaderCircle, CircleCheck, CircleAlert } from "lucide-react";
import { formatUnits } from "viem";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { getTransactions, type IndexerTx } from "@/lib/indexer";
import { classifyKind, keepTx, ZERO } from "@/lib/tx-format";
import clientLogger from "@/lib/logging/client-logger";

const LIMIT = 100; // indexer max page size
const MAX_PAGES = 10000; // runaway guard

type Status = "idle" | "running" | "done" | "error";
type DecimalsFor = (token: string, fallback: number) => number;

interface ExportRow {
  block: number;
  dateUtc: string;
  type: string;
  direction: string;
  token: string;
  tokenAddress: string;
  amount: string;
  visibility: string;
  from: string;
  to: string;
  tx: string;
}

function toRow(tx: IndexerTx, me: string, decimalsFor: DecimalsFor): ExportRow {
  const k = classifyKind(tx, me);
  const decimals = decimalsFor(tx.token, tx.decimals);
  const isPublic = tx.amount != null;
  return {
    block: Number(tx.block_number),
    dateUtc: tx.block_time
      ? new Date(Number(tx.block_time) * 1000).toISOString()
      : "",
    type: k.label,
    direction: k.direction === "in" ? "In" : "Out",
    token: tx.symbol.replace(/^c/, ""),
    tokenAddress: tx.token,
    // Full-precision decimal string (never scientific); "Encrypted" when confidential.
    amount: isPublic ? formatUnits(BigInt(tx.amount as string), decimals) : "Encrypted",
    visibility: isPublic ? "Public" : "Confidential",
    from: tx.from_addr ?? ZERO,
    to: tx.to_addr ?? ZERO,
    tx: tx.tx_hash,
  };
}

// Pull every page (limit 100) so the export is the full history, not one page.
async function fetchAll(
  address: string,
  signal: AbortSignal,
  onProgress: (fetched: number, total: number) => void
): Promise<IndexerTx[]> {
  const all: IndexerTx[] = [];
  let page = 1;
  let pages = 1;
  do {
    const res = await getTransactions(address, { page, limit: LIMIT }, signal);
    pages = Math.max(1, res.pages);
    all.push(...res.items);
    onProgress(all.length, res.total);
    if (res.items.length === 0) break;
    page += 1;
  } while (page <= pages && page <= MAX_PAGES);
  return all;
}

export function ExportTransactionsDialog({
  address,
  decimalsFor,
  totalHint,
}: {
  address: string;
  decimalsFor: DecimalsFor;
  totalHint?: number;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [fetched, setFetched] = useState(0);
  const [total, setTotal] = useState(totalHint ?? 0);
  const [errorMsg, setErrorMsg] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  // Warn before closing the tab mid-export (the fetch loop lives in this tab).
  useEffect(() => {
    if (status !== "running") return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status]);

  const run = useCallback(async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("running");
    setErrorMsg("");
    setFetched(0);
    setTotal(totalHint ?? 0);

    try {
      const rows = await fetchAll(address, controller.signal, (f, t) => {
        setFetched(f);
        setTotal(t);
      });
      if (controller.signal.aborted) return;

      const data = rows.filter(keepTx).map((tx) => toRow(tx, address, decimalsFor));
      if (data.length === 0) throw new Error("Nothing to export.");

      // Load the xlsx writer only when actually exporting (keeps it out of the bundle).
      const writeXlsxFile = (await import("write-excel-file")).default;
      const schema = [
        { column: "Block", type: Number, value: (r: ExportRow) => r.block, width: 12 },
        { column: "Date (UTC)", type: String, value: (r: ExportRow) => r.dateUtc, width: 22 },
        { column: "Type", type: String, value: (r: ExportRow) => r.type, width: 13 },
        { column: "Direction", type: String, value: (r: ExportRow) => r.direction, width: 10 },
        { column: "Token", type: String, value: (r: ExportRow) => r.token, width: 10 },
        { column: "Token Address", type: String, value: (r: ExportRow) => r.tokenAddress, width: 46 },
        { column: "Amount", type: String, value: (r: ExportRow) => r.amount, width: 20 },
        { column: "Visibility", type: String, value: (r: ExportRow) => r.visibility, width: 12 },
        { column: "From", type: String, value: (r: ExportRow) => r.from, width: 46 },
        { column: "To", type: String, value: (r: ExportRow) => r.to, width: 46 },
        { column: "Tx Hash", type: String, value: (r: ExportRow) => r.tx, width: 70 },
      ];
      const stamp = new Date().toISOString().slice(0, 10);
      await writeXlsxFile(data, {
        schema,
        fileName: `comfy-transactions-${address.slice(0, 10)}-${stamp}.xlsx`,
      });

      setStatus("done");
    } catch (err) {
      if (controller.signal.aborted) return;
      const msg = err instanceof Error ? err.message : "Export failed.";
      clientLogger.error("Transaction export failed", { error: msg });
      setErrorMsg(msg);
      setStatus("error");
    } finally {
      abortRef.current = null;
    }
  }, [address, decimalsFor, totalHint]);

  const start = () => {
    setOpen(true);
    void run();
  };

  const cancel = () => {
    abortRef.current?.abort();
    setStatus("idle");
    setOpen(false);
  };

  const close = () => {
    if (status === "running") return; // must cancel first
    setOpen(false);
    setStatus("idle");
  };

  const pct = total > 0 ? Math.min(100, Math.round((fetched / total) * 100)) : 0;

  return (
    <>
      <button
        onClick={start}
        aria-label="Export transactions"
        className="btn-secondary inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Export</span>
      </button>

      <ResponsiveDialog
        open={open}
        onOpenChange={(v) => {
          if (!v) close();
        }}
        title="Export transactions"
        onClose={close}
        closeDisabled={status === "running"}
        desktopWidthClassName="w-[400px]"
      >
        <div className="space-y-4 px-8 pb-6">
            {status === "running" && (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                  Preparing your file…
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.max(pct, 6)}%` }}
                  />
                </div>
                <p className="tabular text-xs text-muted-foreground">
                  {fetched.toLocaleString()}
                  {total > 0 ? ` of ${total.toLocaleString()}` : ""} rows
                </p>
                <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                  Keep this tab open until the download starts.
                </p>
                <button
                  onClick={cancel}
                  className="btn-secondary w-full rounded-lg py-2.5 text-sm font-medium"
                >
                  Cancel
                </button>
              </>
            )}

            {status === "done" && (
              <>
                <div className="flex items-center gap-2 text-sm text-success">
                  <CircleCheck className="h-5 w-5" />
                  Exported {fetched.toLocaleString()} transactions.
                </div>
                <p className="text-xs text-muted-foreground">
                  Check your downloads for the .xlsx file.
                </p>
                <button
                  onClick={close}
                  className="btn-primary w-full rounded-lg py-2.5 text-sm font-medium"
                >
                  Done
                </button>
              </>
            )}

            {status === "error" && (
              <>
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <CircleAlert className="h-5 w-5" />
                  {errorMsg || "Export failed."}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => void run()}
                    className="btn-primary flex-1 rounded-lg py-2.5 text-sm font-medium"
                  >
                    Try again
                  </button>
                  <button
                    onClick={close}
                    className="btn-secondary flex-1 rounded-lg py-2.5 text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
        </div>
      </ResponsiveDialog>
    </>
  );
}
