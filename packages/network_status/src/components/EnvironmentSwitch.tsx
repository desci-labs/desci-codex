import { useUIStore } from "@/store/uiStore";
import { cva } from "class-variance-authority";
import { motion } from "motion/react";

const environmentButtonVariants = cva(
  "px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap",
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
        className: "text-white shadow-sm dark:text-amber-100",
      },
      {
        variant: "testnet",
        state: "inactive",
        className: "hover:bg-amber-100 dark:hover:bg-amber-950/40",
      },
      {
        variant: "mainnet",
        state: "active",
        className: "text-white shadow-sm dark:text-emerald-100",
      },
      {
        variant: "mainnet",
        state: "inactive",
        className: "hover:bg-emerald-100 dark:hover:bg-emerald-950/40",
      },
    ],
  },
);

export function EnvironmentSwitch() {
  const { environment, setEnvironment } = useUIStore();

  return (
    <div className="relative flex rounded-lg border p-1 bg-muted/50 min-w-fit whitespace-nowrap">
      <motion.button
        onClick={() => setEnvironment("testnet")}
        className={environmentButtonVariants({
          variant: "testnet",
          state: environment === "testnet" ? "active" : "inactive",
        })}
        style={{ position: "relative", flex: 1 }}
      >
        {environment === "testnet" && (
          <motion.div
            layoutId="activeBackground"
            className="absolute inset-0 rounded-md bg-amber-600 dark:bg-amber-700"
            initial={false}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          />
        )}
        <span className="relative z-10">Testnet</span>
      </motion.button>
      <motion.button
        onClick={() => setEnvironment("mainnet")}
        className={environmentButtonVariants({
          variant: "mainnet",
          state: environment === "mainnet" ? "active" : "inactive",
        })}
        style={{ position: "relative", flex: 1 }}
      >
        {environment === "mainnet" && (
          <motion.div
            layoutId="activeBackground"
            className="absolute inset-0 rounded-md bg-emerald-600 dark:bg-emerald-700"
            initial={false}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          />
        )}
        <span className="relative z-10">Mainnet</span>
      </motion.button>
    </div>
  );
}
