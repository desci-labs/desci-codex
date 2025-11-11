import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";

export function EnvironmentSwitch() {
  const { environment, setEnvironment } = useUIStore();

  return (
    <div className="flex items-center space-x-1 rounded-lg border p-1 bg-muted/50">
      <button
        onClick={() => setEnvironment("testnet")}
        className={cn(
          "px-3 py-1 rounded-md text-xs font-medium transition-all",
          environment === "testnet"
            ? "bg-amber-600 text-white shadow-sm dark:bg-amber-700 dark:text-amber-100"
            : "text-muted-foreground hover:text-foreground hover:bg-amber-50 dark:hover:bg-amber-950/20",
        )}
      >
        Testnet
      </button>
      <button
        onClick={() => setEnvironment("mainnet")}
        className={cn(
          "px-3 py-1 rounded-md text-xs font-medium transition-all",
          environment === "mainnet"
            ? "bg-emerald-600 text-white shadow-sm dark:bg-emerald-700 dark:text-emerald-100"
            : "text-muted-foreground hover:text-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950/20",
        )}
      >
        Mainnet
      </button>
    </div>
  );
}
