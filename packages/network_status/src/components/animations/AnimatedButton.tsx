import { motion } from "motion/react";
import { ReactNode } from "react";

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  hoverScale?: number;
  tapScale?: number;
}

export function AnimatedButton({
  children,
  onClick,
  className = "",
  disabled = false,
  hoverScale = 1.05,
  tapScale = 0.95,
}: AnimatedButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={className}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: hoverScale }}
      whileTap={disabled ? {} : { scale: tapScale }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      {children}
    </motion.button>
  );
}
