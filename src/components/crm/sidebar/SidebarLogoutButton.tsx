import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function SidebarLogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/crm/login");
  };

  return (
    <div className="p-2 border-t">
      <Button
        variant="ghost"
        className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
        onClick={handleLogout}
      >
        <LogOut className="h-5 w-5" />
        Sair
      </Button>
    </div>
  );
}