import { motion } from "motion/react";
import { ReactNode } from "react";

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  hoverScale?: number;
  tapScale?: number;
  disabled?: boolean;
}

export function AnimatedButton({
  children,
  onClick,
  className = "",
  hoverScale = 1.05,
  tapScale = 0.95,
  disabled = false,
}: AnimatedButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={className}
      whileHover={disabled ? {} : { scale: hoverScale }}
      whileTap={disabled ? {} : { scale: tapScale }}
      transition={{ type: "spring", stiffness: 400 }}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
}
