import { CustomField } from "../types";
import { StageDropZone } from "./StageDropZone";

interface StageTabContentProps {
  stageId: string;
  fields: CustomField[];
  isFirstStage: boolean;
}

export function StageTabContent({ stageId, fields, isFirstStage }: StageTabContentProps) {
  return (
    <div className="h-[calc(100vh-400px)]">
      <StageDropZone
        stageId={stageId}
        fields={fields}
        isDraggingOver={false}
      />
    </div>
  );
}