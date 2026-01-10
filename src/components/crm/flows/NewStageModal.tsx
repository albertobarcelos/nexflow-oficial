import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Loader2 } from 'lucide-react';
import { CreateStageData } from '@/hooks/useFlowStages';

interface NewStageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateStage: (data: CreateStageData) => void;
  isCreating?: boolean;
  initialData?: {
    id?: string;
    name: string;
    is_final_stage?: boolean;
    allow_create_cards?: boolean;
  };
}

export function NewStageModal({ 
  open, 
  onOpenChange, 
  onCreateStage, 
  isCreating = false,
  initialData 
}: NewStageModalProps) {
  const [stageName, setStageName] = useState('');
  const [isFinalStage, setIsFinalStage] = useState(false);
  const [allowCreateCards, setAllowCreateCards] = useState(false);

  // AIDEV-NOTE: Preencher campos quando initialData estiver presente (modo edição)
  useEffect(() => {
    if (initialData && open) {
      setStageName(initialData.name || '');
      setIsFinalStage(initialData.is_final_stage || false);
      setAllowCreateCards(initialData.allow_create_cards || false);
    } else if (!initialData && open) {
      // Reset form para modo criação
      setStageName('');
      setIsFinalStage(false);
      setAllowCreateCards(false);
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stageName.trim()) return;

    onCreateStage({
      name: stageName.trim(),
      isFinalStage,
      allowCreateCards,
    });

    // Reset form apenas se não estiver editando
    if (!initialData) {
      setStageName('');
      setIsFinalStage(false);
      setAllowCreateCards(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setStageName('');
    setIsFinalStage(false);
    setAllowCreateCards(false);
    onOpenChange(false);
  };

  const isEditMode = !!initialData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex-1">
            <DialogTitle className="text-lg font-semibold">
              {isEditMode ? 'Editar fase' : 'Nova fase'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {isEditMode ? 'Edite as informações da fase' : 'Configure uma nova fase para o processo'}
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome da fase */}
          <div className="space-y-2">
            <Label htmlFor="stage-name" className="text-sm font-medium">
              Nome da fase
            </Label>
            <Input
              id="stage-name"
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              placeholder="Digite o nome da fase"
              className="w-full"
              autoFocus
            />
          </div>

          {/* Opções */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="final-stage"
                checked={isFinalStage}
                onCheckedChange={(checked) => setIsFinalStage(checked as boolean)}
              />
              <Label
                htmlFor="final-stage"
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Definir como fase final de processo
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="allow-create-cards"
                checked={allowCreateCards}
                onCheckedChange={(checked) => setAllowCreateCards(checked as boolean)}
              />
              <Label
                htmlFor="allow-create-cards"
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Permitir criar cards nesta fase
              </Label>
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!stageName.trim() || isCreating}
              className="min-w-[80px]"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditMode ? 'Salvando...' : 'Criando...'}
                </>
              ) : (
                isEditMode ? 'Salvar alterações' : 'Criar fase'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}