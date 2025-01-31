import { useNavigate, useLocation } from "react-router-dom";
import { Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFunnels } from "@/hooks/useFunnels";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function FunnelSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: funnels, isLoading } = useFunnels();

  const isActive = (path: string) => location.pathname.includes(path);

  return (
    <div className="w-[60px] h-full bg-white border-r border-r-slate-100 flex flex-col py-2">
      {/* Lista de Funis */}
      <div className="space-y-1">
        {funnels?.map((funnel) => (
          <Tooltip key={funnel.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "w-full h-10 rounded-none flex items-center justify-center relative group transition-all",
                  "hover:bg-slate-50",
                  "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-[2px]",
                  "before:bg-primary before:transition-all",
                  isActive(`/crm/funnels/${funnel.id}`)
                    ? "bg-slate-50 before:opacity-100"
                    : "before:opacity-0 hover:before:opacity-50"
                )}
                onClick={() => navigate(`/crm/funnels/${funnel.id}`)}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center font-medium text-sm transition-all",
                  isActive(`/crm/funnels/${funnel.id}`)
                    ? "bg-primary text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                )}>
                  {funnel.name.charAt(0).toUpperCase()}
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={16} className="select-none">
              <p>{funnel.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Botão de Configurações */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "w-full h-11 rounded-none flex items-center justify-center relative group transition-all",
                "hover:bg-slate-50",
                "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-[2px]",
                "before:bg-primary before:transition-all",
                isActive("/crm/settings/pipeline")
                  ? "bg-slate-50 before:opacity-100"
                  : "before:opacity-0 hover:before:opacity-50"
              )}
              onClick={() => navigate("/crm/settings/pipeline")}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                isActive("/crm/settings/pipeline")
                  ? "bg-primary text-white shadow-sm"
                  : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
              )}>
                <Settings className="h-4 w-4" />
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={16} className="select-none">
            <p>Personalizar funis</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
} 