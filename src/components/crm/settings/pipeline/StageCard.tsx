import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical } from "lucide-react";

type StageCardProps = {
  stage: {
    id: string;
    name: string;
    description: string | null;
    color: string;
  };
};

export function StageCard({ stage }: StageCardProps) {
  return (
    <Card key={stage.id} className={`w-64 shrink-0 border-2 border-${stage.color}-200`}>
      <CardHeader className="flex flex-row items-center gap-2">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
        <CardTitle className="text-sm">{stage.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {stage.description}
        </p>
      </CardContent>
    </Card>
  );
}