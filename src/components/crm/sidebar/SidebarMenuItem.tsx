import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SidebarMenuItemProps {
  title: string;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
}

export function SidebarMenuItem({ title, href, icon: Icon, isActive, onClick }: SidebarMenuItemProps) {
  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className="w-full justify-start gap-2"
      onClick={onClick}
    >
      <Icon className="h-5 w-5" />
      {title}
    </Button>
  );
}
