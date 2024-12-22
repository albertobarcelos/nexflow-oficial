import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface SidebarHeaderProps {
  onClose: () => void;
}

export function SidebarHeader({ onClose }: SidebarHeaderProps) {
  return (
    <div className="flex h-14 items-center justify-between px-4 border-b">
      <span className="text-lg font-semibold">Portal CRM</span>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onClose}
      >
        <Menu className="h-6 w-6" />
      </Button>
    </div>
  );
}