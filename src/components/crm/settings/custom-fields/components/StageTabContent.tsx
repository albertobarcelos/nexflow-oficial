import { CustomField } from "../types";
import { StageDropZone } from "./StageDropZone";

interface StageTabContentProps {
  stageId: string;
  fields: CustomField[];
  isFirstStage: boolean;
  onEditField: (field: CustomField) => void;
}

export function StageTabContent({ stageId, fields, isFirstStage, onEditField }: StageTabContentProps) {
  return (
    <div className="h-[500px] overflow-hidden">
      <StageDropZone
        stageId={stageId}
        fields={fields}
        onEditField={onEditField}
      />
    </div>
  );
}