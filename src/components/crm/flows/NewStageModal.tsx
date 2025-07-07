import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
}

export function NewStageModal({ 
  open, 
  onOpenChange, 
  onCreateStage, 
  isCreating = false 
}: NewStageModalProps) {
  const [stageName, setStageName] = useState('');
  const [isFinalStage, setIsFinalStage] = useState(false);
  const [allowCreateCards, setAllowCreateCards] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stageName.trim()) return;

    onCreateStage({
      name: stageName.trim(),
      isFinalStage,
      allowCreateCards,
    });

    // Reset form
    setStageName('');
    setIsFinalStage(false);
    setAllowCreateCards(false);
  };

  const handleCancel = () => {
    // Reset form
    setStageName('');
    setIsFinalStage(false);
    setAllowCreateCards(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-lg font-semibold">Nova fase</DialogTitle>
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
                  Criando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 