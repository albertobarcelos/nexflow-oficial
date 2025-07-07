import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Plus, Loader2 } from 'lucide-react';
import { FlowStage } from '@/hooks/useFlowStages';
import { NewStageModal } from './NewStageModal';
import { CreateStageData } from '@/hooks/useFlowStages';

interface StageSelectorProps {
  stages: FlowStage[];
  selectedStageId: string | null;
  onStageSelect: (stageId: string) => void;
  onCreateStage: (data: CreateStageData) => void;
  isLoading?: boolean;
  isCreating?: boolean;
}

export function StageSelector({
  stages,
  selectedStageId,
  onStageSelect,
  onCreateStage,
  isLoading = false,
  isCreating = false,
}: StageSelectorProps) {
  const [isNewStageModalOpen, setIsNewStageModalOpen] = useState(false);

  const selectedStage = stages.find(stage => stage.id === selectedStageId);

  const handleCreateStage = (data: CreateStageData) => {
    onCreateStage(data);
    setIsNewStageModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        <span className="text-sm text-gray-500">Carregando fases...</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 font-medium">Fase atual</span>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors ${
                selectedStage 
                  ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
              }`}
            >
              {selectedStage && (
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              )}
              <span className="font-medium">
                {selectedStage ? selectedStage.name : 'Selecionar fase'}
              </span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="start" className="w-64">
            {stages.length === 0 ? (
              <div className="p-3 text-center text-sm text-gray-500">
                Nenhuma fase encontrada
              </div>
            ) : (
              <>
                {stages.map((stage) => (
                  <DropdownMenuItem
                    key={stage.id}
                    onClick={() => onStageSelect(stage.id)}
                    className={`flex items-center gap-3 p-3 cursor-pointer ${
                      selectedStageId === stage.id 
                        ? 'bg-green-50 text-green-800' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      selectedStageId === stage.id ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <div className="flex-1">
                      <div className="font-medium">{stage.name}</div>
                      <div className="text-xs text-gray-500">
                        Ordem {stage.order_index}
                      </div>
                    </div>
                    {selectedStageId === stage.id && (
                      <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                        Atual
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
                
                <DropdownMenuSeparator />
              </>
            )}
            
            <DropdownMenuItem
              onClick={() => setIsNewStageModalOpen(true)}
              className="flex items-center gap-3 p-3 cursor-pointer text-blue-600 hover:bg-blue-50"
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span className="font-medium">
                {isCreating ? 'Criando fase...' : 'Criar uma nova fase'}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Modal para criar nova fase */}
      <NewStageModal
        open={isNewStageModalOpen}
        onOpenChange={setIsNewStageModalOpen}
        onCreateStage={handleCreateStage}
        isCreating={isCreating}
      />
    </>
  );
} 