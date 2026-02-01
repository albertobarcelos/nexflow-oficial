import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number;
  trend: number;
  icon: LucideIcon;
  iconColor: string;
  showInfo?: boolean;
}

export function MetricCard({
  title,
  value,
  trend,
  icon: Icon,
  iconColor,
  showInfo = false,
}: MetricCardProps) {
  const isPositive = trend >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
      {/* Background icon */}
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon className={cn("w-16 h-16", iconColor)} />
      </div>
      
      <div className="flex flex-col h-full justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
            {title}
            {showInfo && (
              <span className="text-xs text-gray-400 cursor-help" title={`Total ${title.toLowerCase()} neste período`}>
                ℹ️
              </span>
            )}
          </p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {value.toLocaleString('pt-BR')}
          </h3>
        </div>
        
        <div className={cn(
          "mt-4 flex items-center text-sm",
          isPositive 
            ? "text-green-600 dark:text-green-400" 
            : "text-red-500 dark:text-red-400"
        )}>
          <TrendIcon className="w-4 h-4 mr-1" />
          <span className="font-semibold">
            {isPositive ? '+' : ''}{trend.toFixed(1)}%
          </span>
          <span className="ml-2 text-gray-400 dark:text-gray-500 text-xs">
            vs. período anterior
          </span>
        </div>
      </div>
    </div>
  );
}
