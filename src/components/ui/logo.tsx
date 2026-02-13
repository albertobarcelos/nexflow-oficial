import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <img
      src="/nexflow-logo.png"
      alt="NEXFLOW"
      className={cn(" mt-4 h-20 w-auto object-contain", className)}
    />
  );
}
