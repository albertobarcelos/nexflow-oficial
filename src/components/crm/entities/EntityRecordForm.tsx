import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { EntityFormHeader } from "./form/EntityFormHeader";
import { EntityFormField } from "./form/EntityFormField";
import { EntityFormFooter } from "./form/EntityFormFooter";
import { Label } from "@/components/ui/label";

interface EntityRecordFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityName: string;
  fields: any[];
  onSuccess?: (recordId: string) => void;
}

export function EntityRecordForm({ 
  open, 
  onOpenChange, 
  entityId, 
  entityName, 
  fields = [],
  onSuccess
}: EntityRecordFormProps) {
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

      if (onSuccess) {
        onSuccess(recordId);
      }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <EntityFormHeader entityName={entityName} />
        
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
                  <EntityFormField
                    field={field}
                    value={formData[field.id]}
                    onChange={(value) => setFormData(prev => ({
                      ...prev,
                      [field.id]: value
                    }))}
                    isSubmitting={isSubmitting}
                  />
                </motion.div>
              ))}
            </div>
          </ScrollArea>

          <EntityFormFooter 
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}