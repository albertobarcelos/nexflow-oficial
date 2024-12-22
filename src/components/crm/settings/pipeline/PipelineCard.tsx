import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewStageDialog } from "./NewStageDialog";
import { StageCard } from "./StageCard";
import { GripVertical } from "lucide-react";

type PipelineCardProps = {
  pipeline: {
    id: string;
    name: string;
    description: string | null;
    pipeline_stages?: Array<{
      id: string;
      name: string;
      description: string | null;
      color: string;
    }>;
  };
};

export function PipelineCard({ pipeline }: PipelineCardProps) {
  return (
    <Card key={pipeline.id}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{pipeline.name}</CardTitle>
          {pipeline.description && (
            <p className="text-sm text-muted-foreground">{pipeline.description}</p>
          )}
        </div>
        <NewStageDialog 
          pipelineId={pipeline.id} 
          currentStagesCount={pipeline.pipeline_stages?.length || 0}
        />
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 overflow-x-auto p-4">
          {pipeline.pipeline_stages?.map((stage) => (
            <StageCard key={stage.id} stage={stage} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}