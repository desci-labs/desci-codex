import { Link, useLocation } from "@tanstack/react-router";
import { useUIStore } from "@/store/uiStore";
import { Activity, Network, Moon, Sun, Database, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { EnvironmentSwitch } from "@/components/EnvironmentSwitch";
import blackLogo from "@/static/DeSci_Protocol_A_Black_v01.svg";
import whiteLogo from "@/static/DeSci_Protocol_A_White_v01.svg";

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
      <header className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <img
                  src={isDarkMode ? whiteLogo : blackLogo}
                  alt="Codex Network Logo"
                  className="h-12 w-12"
                />
                <h1 className="text-xl font-bold">Codex Network Status</h1>
              </div>
              <nav className="flex space-x-6">
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
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              <EnvironmentSwitch />
              <button
                onClick={toggleDarkMode}
                className="rounded-md p-2 hover:bg-accent"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
