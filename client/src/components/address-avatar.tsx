import { blo } from "blo";
import { cn } from "@/lib/utils";

export function AddressAvatar({
  address,
  className,
}: {
  address: string;
  className?: string;
}) {
  const valid = /^0x[0-9a-fA-F]{40}$/.test(address);
  const base = cn(
    "inline-block shrink-0 rounded-full ring-1 ring-inset ring-black/10",
    className
  );
  if (!valid) return <span className={cn(base, "bg-secondary")} aria-hidden />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={blo(address as `0x${string}`)}
      alt=""
      aria-hidden
      draggable={false}
      className={base}
    />
  );
}
