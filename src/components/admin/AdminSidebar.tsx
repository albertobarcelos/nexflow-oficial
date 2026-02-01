import {
  LayoutDashboard,
  LogOut,
  Building2,
  Settings,
  Briefcase,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    url: "/admin/dashboard",
  },
 
  {
    title: "Gestão",
    icon: Briefcase,
    url: "/admin/management",
  },
  {
    title: "Configurações",
    icon: Settings,
    url: "/admin/settings",
  },
];

export function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logout realizado com sucesso");
      navigate("/admin/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Erro ao fazer logout");
    }
  };

  return (
    <aside className="w-64 bg-nex-dark-blue text-white flex flex-col fixed h-full">
      {/* Logo */}
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-wider">
          <span className="text-nex-orange">N</span> NEXPANEL
        </h1>
      </div>

      {/* Navigation Links */}
      <nav className="mt-4 flex-1">
        <ul>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <li key={item.title}>
                <Link
                  to={item.url}
                  className={cn(
                    "flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200",
                    isActive && "text-white bg-nex-orange"
                  )}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.title}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              onClick={handleLogout}
              className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200 w-full text-left"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sair
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
