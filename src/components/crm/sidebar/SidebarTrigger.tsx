import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/hooks/useSidebar";

export function SidebarTrigger() {
  const { toggle } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="fixed left-4 top-4 z-50"
      onClick={toggle}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
} 
