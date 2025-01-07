import { TooltipProvider, TooltipContent, TooltipTrigger, Tooltip } from "@/components/ui/tooltip";
import { GripVertical, Info } from "lucide-react";
import { FieldTypeInfo } from "../types";
import { motion } from "framer-motion";

interface FieldTypeCardProps {
  fieldType: FieldTypeInfo;
  isDragging: boolean;
}

export function FieldTypeCard({ fieldType, isDragging }: FieldTypeCardProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={`
              p-2 rounded-lg hover:bg-muted/80 cursor-grab 
              transition-all duration-200 ease-in-out
              border border-primary/10 hover:border-primary/20
              ${isDragging ? "bg-muted shadow-lg scale-105" : "bg-card hover:scale-[1.02]"}
              group w-[180px]
            `}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-2">
              <div className="text-muted-foreground group-hover:text-primary transition-colors">
                <GripVertical className="h-4 w-4 opacity-50 group-hover:opacity-100" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                    {fieldType.name}
                  </h3>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground hover:text-primary transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px]">
                      <p>{fieldType.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="text-muted-foreground group-hover:text-primary transition-colors">
                {fieldType.icon}
              </div>
            </div>
          </motion.div>
        </TooltipTrigger>
      </Tooltip>
    </TooltipProvider>
  );
}