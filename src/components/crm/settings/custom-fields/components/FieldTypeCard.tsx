import { TooltipProvider, TooltipContent, TooltipTrigger, Tooltip } from "@/components/ui/tooltip";
import { FieldTypeInfo } from "../types";

interface FieldTypeCardProps {
  fieldType: FieldTypeInfo;
  dragHandleProps: any;
  isDragging: boolean;
}

export function FieldTypeCard({ fieldType, dragHandleProps, isDragging }: FieldTypeCardProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            {...dragHandleProps}
            className={`p-3 rounded-lg hover:bg-muted cursor-grab transition-colors ${
              isDragging ? "bg-muted" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground">
                {fieldType.icon}
              </div>
              <div>
                <h3 className="font-medium text-sm">{fieldType.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {fieldType.description}
                </p>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{fieldType.description}</p>
          {fieldType.validation && (
            <p className="text-xs text-muted-foreground mt-1">
              Este campo possui validação específica
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}