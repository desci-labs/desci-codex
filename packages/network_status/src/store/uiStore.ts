import { create } from "zustand";
import { persist } from "zustand/middleware";

type Environment = "testnet" | "mainnet";

interface UIStore {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (nodeId: string | null) => void;
  refreshInterval: number;
  setRefreshInterval: (interval: number) => void;
  environment: Environment;
  setEnvironment: (environment: Environment) => void;
  initializeTheme: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      isDarkMode: false,
      toggleDarkMode: () =>
        set((state) => {
          const newMode = !state.isDarkMode;
          if (typeof document !== "undefined") {
            if (newMode) {
              document.documentElement.classList.add("dark");
            } else {
              document.documentElement.classList.remove("dark");
            }
          }
          if (typeof localStorage !== "undefined") {
            localStorage.setItem("theme", newMode ? "dark" : "light");
          }
          return { isDarkMode: newMode };
        }),
      selectedNodeId: null,
      setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),
      refreshInterval: 30000,
      setRefreshInterval: (interval) => set({ refreshInterval: interval }),
      environment: "testnet",
      setEnvironment: (environment) => set({ environment }),
      initializeTheme: () => {
        if (typeof window === "undefined") {
          return;
        }
        const stored = localStorage.getItem("theme");
        const isDark =
          stored === "dark" ||
          (!stored &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);
        if (isDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        set({ isDarkMode: isDark });
      },
    }),
    {
      name: "ui-store",
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        refreshInterval: state.refreshInterval,
        environment: state.environment,
      }),
      storage: {
        getItem: (name) => {
          if (typeof window === "undefined") return null;
          const str = localStorage.getItem(name);
          if (!str) return null;
          return JSON.parse(str);
        },
        setItem: (name, value) => {
          if (typeof window === "undefined") return;
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          if (typeof window === "undefined") return;
          localStorage.removeItem(name);
        },
      },
    },
  ),
);
