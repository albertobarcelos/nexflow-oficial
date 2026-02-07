import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("logo-font text-2xl font-bold flex items-center", className)}>
      <span className="text-[#212A34] ">N</span>
      <svg 
        className="w-6 h-8 text-[#6366F1]  _0_8px_rgba(99,102,241,0.6)] -mx-1" 
        fill="currentColor" 
        viewBox="0 0 24 24"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
      </svg>
      <span className="text-[#212A34] ">X</span>
      <span className="text-[#748496]  font-normal ml-1">FLOW</span>
    </div>
  );
}
