import { cn } from "@/lib/utils";

interface PageDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageDescription({ children, className }: PageDescriptionProps) {
  return (
    <p
      className={cn(
        "text-muted-foreground text-sm md:text-base mb-6",
        className,
      )}
    >
      {children}
    </p>
  );
}
