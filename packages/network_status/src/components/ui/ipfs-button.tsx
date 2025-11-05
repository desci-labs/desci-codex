import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface IPFSButtonProps {
  cid: string;
  className?: string;
  size?: "sm" | "md";
}

export function IPFSButton({ cid, className, size = "sm" }: IPFSButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://ipfs.desci.com/ipfs/${cid}`, "_blank");
  };

  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const buttonSize = size === "sm" ? "p-1" : "p-1.5";

  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center rounded hover:bg-accent transition-colors",
        buttonSize,
        className,
      )}
      title="Open in IPFS gateway"
    >
      <ExternalLink
        className={cn(iconSize, "text-muted-foreground hover:text-foreground")}
      />
    </button>
  );
}
