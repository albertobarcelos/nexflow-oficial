import { CustomField } from "../types";
import { StageDropZone } from "./StageDropZone";

interface StageTabContentProps {
  stageId: string;
  fields: CustomField[];
  isFirstStage: boolean;
}

export function StageTabContent({ stageId, fields }: StageTabContentProps) {
  return (
    <div className="h-[500px] overflow-hidden">
      <StageDropZone
        stageId={stageId}
        fields={fields}
      />
    </div>
  );
}