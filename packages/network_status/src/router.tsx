import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Home, Search, ArrowLeft } from "lucide-react";
import { AnimatedButton } from "@/components/animations/AnimatedButton";

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        className="text-center max-w-md mx-auto px-4"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          className="mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="relative">
            <motion.div
              className="text-8xl font-bold text-muted-foreground/20 select-none"
              animate={{ rotate: [0, 1, -1, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              404
            </motion.div>
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Search className="h-12 w-12 text-muted-foreground" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className="space-y-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Page Not Found
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            The page you're looking for doesn't exist or may have been moved.
            Let's get you back to exploring the Codex Network.
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <AnimatedButton className="w-full sm:w-auto">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors font-medium"
            >
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </AnimatedButton>

          <AnimatedButton className="w-full sm:w-auto">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          </AnimatedButton>
        </motion.div>
      </motion.div>
    </div>
  );
}

export function createRouter() {
  return createTanStackRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
    defaultNotFoundComponent: NotFound,
  });
}

export function getRouter() {
  return createRouter();
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
