import { Link, useLocation } from "@tanstack/react-router";
import { useUIStore } from "@/store/uiStore";
import {
  Activity,
  Network,
  Moon,
  Sun,
  Database,
  FileCode,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { EnvironmentSwitch } from "@/components/EnvironmentSwitch";
import blackLogo from "@/static/DeSci_Protocol_A_Black_v01.svg";
import whiteLogo from "@/static/DeSci_Protocol_A_White_v01.svg";
import { motion, AnimatePresence } from "motion/react";
import { AnimatedButton } from "@/components/animations/AnimatedButton";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const { isDarkMode, toggleDarkMode, initializeTheme } = useUIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navLinks = [
    { to: "/", label: "Dashboard", icon: Activity },
    { to: "/nodes", label: "Nodes", icon: Network },
    { to: "/manifests", label: "Manifests", icon: Database },
    { to: "/streams", label: "Streams", icon: FileCode },
  ];

  return (
    <div className="min-h-screen bg-background prevent-overflow">
      <motion.header
        className="border-b"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <motion.img
                  src={isDarkMode ? whiteLogo : blackLogo}
                  alt="Codex Network Logo"
                  className="h-8 w-8 md:h-12 md:w-12"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    rotate: -360,
                  }}
                  transition={{
                    opacity: { duration: 0.5 },
                    rotate: {
                      duration: 30,
                      repeat: Infinity,
                      ease: "linear",
                    },
                  }}
                />
                <h1 className="text-lg md:text-xl font-bold hidden sm:block">
                  Codex Network Status
                </h1>
                <h1 className="text-lg font-bold sm:hidden">Codex</h1>
              </Link>

              {/* Desktop Navigation */}
              <motion.nav
                className="hidden md:flex space-x-6"
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

            <div className="flex items-center space-x-2">
              <div className="hidden sm:block">
                <EnvironmentSwitch />
              </div>
              <AnimatedButton
                onClick={toggleDarkMode}
                className="rounded-md p-2 hover:bg-accent cursor-pointer"
                aria-label={
                  isDarkMode ? "Switch to light mode" : "Switch to dark mode"
                }
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </AnimatedButton>

              {/* Mobile Menu Button */}
              <AnimatedButton
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden rounded-md p-2 hover:bg-accent cursor-pointer"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </AnimatedButton>
            </div>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                className="md:hidden border-t bg-background"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <nav className="py-4 space-y-2">
                  <div className="sm:hidden mb-4">
                    <EnvironmentSwitch />
                  </div>
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={cn(
                          "flex items-center space-x-3 px-2 py-3 text-base font-medium transition-colors hover:text-primary hover:bg-accent rounded-md",
                          location.pathname === link.to
                            ? "text-primary bg-accent"
                            : "text-muted-foreground",
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>
      <motion.main
        className="container mx-auto px-4 py-4 md:py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {children}
      </motion.main>
    </div>
  );
}
