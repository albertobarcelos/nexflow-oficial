import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, AlertCircle } from "lucide-react";
import { EntityRelationshipField } from "./EntityRelationshipField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface EntityRecordFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityName: string;
  fields: any[];
}

export function EntityRecordForm({ open, onOpenChange, entityId, entityName, fields = [] }: EntityRecordFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const missingFields = fields
        .filter(field => field.is_required && !formData[field.id])
        .map(field => field.name);

      if (missingFields.length > 0) {
        throw new Error(`Campos obrigatórios não preenchidos: ${missingFields.join(", ")}`);
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!collaborator) throw new Error('Cliente não encontrado');

      const recordId = crypto.randomUUID();

      const fieldValues = fields.map(field => ({
        entity_id: entityId,
        field_id: field.id,
        record_id: recordId,
        value: formData[field.id] !== undefined ? JSON.stringify(formData[field.id]) : null,
        searchable_value: formData[field.id]?.toString() || null,
        modified_by: user.user.id
      }));

      const { error } = await supabase
        .from('entity_field_values')
        .insert(fieldValues);

      if (error) throw error;

      toast({
        title: "Registro criado",
        description: "O registro foi criado com sucesso.",
      });

      onOpenChange(false);
      setFormData({});
    } catch (error: any) {
      console.error('Error creating record:', error);
      setError(error.message);
      toast({
        title: "Erro ao criar registro",
        description: error.message || "Ocorreu um erro ao criar o registro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const renderField = (field: any) => {
    if (field.field_type === 'entity') {
      return (
        <EntityRelationshipField
          entityId={field.related_entity_id}
          fieldId={field.id}
          value={formData[field.id]}
          onChange={(value) => handleFieldChange(field.id, value)}
          disabled={isSubmitting}
          onCreateNew={() => {
            console.log('Criar novo registro relacionado');
          }}
        />
      );
    }

    return (
      <Input
        id={field.id}
        type={field.field_type === 'number' ? 'number' : 'text'}
        value={formData[field.id] || ''}
        onChange={(e) => handleFieldChange(field.id, e.target.value)}
        required={field.is_required}
        placeholder={`Digite ${field.name.toLowerCase()}`}
        disabled={isSubmitting}
        className={cn(
          "w-full transition-colors duration-200",
          field.is_required && !formData[field.id] && "border-red-500 focus:border-red-500"
        )}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Novo {entityName}</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para criar um novo registro.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <ScrollArea className="flex-1 px-1">
            <div className="space-y-4 pr-4">
              {fields.map((field) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2"
                >
                  <Label 
                    htmlFor={field.id} 
                    className="flex items-center text-sm font-medium transition-colors"
                  >
                    {field.name}
                    {field.is_required && (
                      <span 
                        className="text-red-500 ml-1" 
                        title="Campo obrigatório"
                      >*</span>
                    )}
                  </Label>
                  {renderField(field)}
                </motion.div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="transition-colors hover:bg-secondary"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-[120px] relative"
            >
              {isSubmitting ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center"
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </motion.div>
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}