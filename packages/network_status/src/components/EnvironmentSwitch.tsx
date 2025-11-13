import { useUIStore } from "@/store/uiStore";
import { cva } from "class-variance-authority";

const environmentButtonVariants = cva(
  "px-3 py-1 rounded-md text-xs font-medium transition-all",
  {
    variants: {
      variant: {
        testnet: "",
        mainnet: "",
      },
      state: {
        active: "cursor-default",
        inactive: "text-muted-foreground hover:text-foreground cursor-pointer",
      },
    },
    compoundVariants: [
      {
        variant: "testnet",
        state: "active",
        className:
          "bg-amber-600 text-white shadow-sm dark:bg-amber-700 dark:text-amber-100",
      },
      {
        variant: "testnet",
        state: "inactive",
        className: "hover:bg-amber-50 dark:hover:bg-amber-950/20",
      },
      {
        variant: "mainnet",
        state: "active",
        className:
          "bg-emerald-600 text-white shadow-sm dark:bg-emerald-700 dark:text-emerald-100",
      },
      {
        variant: "mainnet",
        state: "inactive",
        className: "hover:bg-emerald-50 dark:hover:bg-emerald-950/20",
      },
    ],
  },
);

export function EnvironmentSwitch() {
  const { environment, setEnvironment } = useUIStore();

  return (
    <div className="flex items-center space-x-1 rounded-lg border p-1 bg-muted/50">
      <button
        onClick={() => setEnvironment("testnet")}
        className={environmentButtonVariants({
          variant: "testnet",
          state: environment === "testnet" ? "active" : "inactive",
        })}
      >
        Testnet
      </button>
      <button
        onClick={() => setEnvironment("mainnet")}
        className={environmentButtonVariants({
          variant: "mainnet",
          state: environment === "mainnet" ? "active" : "inactive",
        })}
      >
        Mainnet
      </button>
    </div>
  );
}
