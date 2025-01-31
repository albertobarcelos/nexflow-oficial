import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewStageDialog } from "./NewStageDialog";
import { StageCard } from "./StageCard";
import { GripVertical, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PipelinePermissionsDialog } from "./PipelinePermissionsDialog";
import { useState } from "react";
import type { CollaboratorRole } from "@/lib/validations/collaborator";

type PipelineCardProps = {
  pipeline: {
    id: string;
    name: string;
    description: string | null;
    allowed_roles?: CollaboratorRole[];
    pipeline_stages?: Array<{
      id: string;
      name: string;
      description: string | null;
      color: string;
    }>;
  };
};

export function PipelineCard({ pipeline }: PipelineCardProps) {
  const [showPermissions, setShowPermissions] = useState(false);

  return (
    <Card key={pipeline.id}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{pipeline.name}</CardTitle>
          {pipeline.description && (
            <p className="text-sm text-muted-foreground">{pipeline.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPermissions(true)}
          >
            <Users className="h-4 w-4 mr-2" />
            Permissões
          </Button>
          <NewStageDialog 
            pipelineId={pipeline.id} 
            currentStagesCount={pipeline.pipeline_stages?.length || 0}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 overflow-x-auto p-4">
          {pipeline.pipeline_stages?.map((stage) => (
            <StageCard key={stage.id} stage={stage} />
          ))}
        </div>
      </CardContent>
      {showPermissions && (
        <PipelinePermissionsDialog
          pipeline={pipeline}
          open={showPermissions}
          onOpenChange={setShowPermissions}
        />
      )}
    </Card>
  );
}
