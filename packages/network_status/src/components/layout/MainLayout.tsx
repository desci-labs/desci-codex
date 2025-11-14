import { Link, useLocation } from "@tanstack/react-router";
import { useUIStore } from "@/store/uiStore";
import { Activity, Network, Moon, Sun, Database, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { EnvironmentSwitch } from "@/components/EnvironmentSwitch";
import blackLogo from "@/static/DeSci_Protocol_A_Black_v01.svg";
import whiteLogo from "@/static/DeSci_Protocol_A_White_v01.svg";
import { motion } from "motion/react";
import { AnimatedButton } from "@/components/animations/AnimatedButton";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const { isDarkMode, toggleDarkMode, initializeTheme } = useUIStore();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  const navLinks = [
    { to: "/", label: "Dashboard", icon: Activity },
    { to: "/nodes", label: "Nodes", icon: Network },
    { to: "/manifests", label: "Manifests", icon: Database },
    { to: "/streams", label: "Streams", icon: FileCode },
  ];

  return (
    <div className="min-h-screen bg-background">
      <motion.header
        className="border-b"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-8">
              <motion.div
                className="flex items-center space-x-3"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <motion.img
                  src={isDarkMode ? whiteLogo : blackLogo}
                  alt="Codex Network Logo"
                  className="h-12 w-12"
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{
                    rotate: [0, -360],
                    opacity: 1,
                  }}
                  transition={{
                    rotate: {
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    },
                    opacity: { duration: 0.5 },
                  }}
                />
                <h1 className="text-xl font-bold">Codex Network Status</h1>
              </motion.div>
              <motion.nav
                className="flex space-x-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={cn(
                        "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                        location.pathname === link.to
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </motion.nav>
            </div>
            <motion.div
              className="flex items-center space-x-3"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <EnvironmentSwitch />
              <AnimatedButton
                onClick={toggleDarkMode}
                className="rounded-md p-2 hover:bg-accent cursor-pointer"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </AnimatedButton>
            </motion.div>
          </div>
        </div>
      </motion.header>
      <motion.main
        className="container mx-auto px-4 py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {children}
      </motion.main>
    </div>
  );
}
