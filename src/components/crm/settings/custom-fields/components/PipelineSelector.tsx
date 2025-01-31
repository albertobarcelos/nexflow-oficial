import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PipelineSelectorProps {
  pipelines: any[];
  selectedPipeline?: string;
  onPipelineChange: (value: string) => void;
}

export function PipelineSelector({ pipelines, selectedPipeline, onPipelineChange }: PipelineSelectorProps) {
  return (
    <Select value={selectedPipeline} onValueChange={onPipelineChange}>
      <SelectTrigger className="w-[300px]">
        <SelectValue placeholder="Selecione um pipeline" />
      </SelectTrigger>
      <SelectContent>
        {pipelines?.map((pipeline) => (
          <SelectItem key={pipeline.id} value={pipeline.id}>
            {pipeline.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
