import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { CustomField } from "../settings/custom-fields/types";

type FormData = {
  title: string;
  value: string;
  customFields: Record<string, any>;
};

export function NewOpportunityForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { pipelineId } = useParams();
  const { register, handleSubmit, reset, setValue } = useForm<FormData>();
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  useEffect(() => {
    async function loadCustomFields() {
      if (!pipelineId) return;

      try {
        // Buscar o primeiro estágio do pipeline
        const { data: firstStage } = await supabase
          .from('pipeline_stages')
          .select('id')
          .eq('pipeline_id', pipelineId)
          .order('order_index')
          .limit(1)
          .single();

        if (!firstStage) return;

        // Buscar campos personalizados do primeiro estágio
        const { data: fields } = await supabase
          .from('custom_fields')
          .select('*')
          .eq('pipeline_id', pipelineId)
          .eq('stage_id', firstStage.id)
          .order('order_index');

        setCustomFields(fields || []);
      } catch (error) {
        console.error('Error loading custom fields:', error);
      }
    }

    loadCustomFields();
  }, [pipelineId]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      // Get the first stage of the pipeline
      const { data: firstStage } = await supabase
        .from('pipeline_stages')
        .select('id')
        .eq('pipeline_id', pipelineId)
        .order('order_index')
        .limit(1)
        .single();

      if (!firstStage) throw new Error('No stages found for this pipeline');

      const { error } = await supabase
        .from('opportunities')
        .insert({
          client_id: collaborator.client_id,
          title: data.title,
          value: data.value ? parseFloat(data.value) : null,
          pipeline_id: pipelineId,
          stage_id: firstStage.id,
          metadata: { customFields: data.customFields }
        });

      if (error) throw error;

      toast({
        title: "Oportunidade criada",
        description: "A oportunidade foi criada com sucesso.",
      });

      reset();
    } catch (error) {
      console.error('Error creating opportunity:', error);
      toast({
        title: "Erro ao criar oportunidade",
        description: "Não foi possível criar a oportunidade. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCustomField = (field: CustomField) => {
    switch (field.field_type) {
      case 'short_text':
        return (
          <Input
            id={field.id}
            {...register(`customFields.${field.id}`)}
            placeholder={`Digite ${field.name.toLowerCase()}`}
          />
        );
      
      case 'long_text':
        return (
          <Textarea
            id={field.id}
            {...register(`customFields.${field.id}`)}
            placeholder={`Digite ${field.name.toLowerCase()}`}
          />
        );

      case 'checkbox':
        return (
          <Checkbox
            id={field.id}
            onCheckedChange={(checked) => {
              setValue(`customFields.${field.id}`, checked);
            }}
          />
        );

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !register(`customFields.${field.id}`).value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {register(`customFields.${field.id}`).value ? (
                  format(register(`customFields.${field.id}`).value, "PPP")
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={register(`customFields.${field.id}`).value}
                onSelect={(date) => setValue(`customFields.${field.id}`, date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      // Adicione mais casos conforme necessário para outros tipos de campo
      
      default:
        return <Input id={field.id} {...register(`customFields.${field.id}`)} />;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          {...register("title", { required: true })}
          placeholder="Digite o título da oportunidade"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="value">Valor</Label>
        <Input
          id="value"
          type="number"
          step="0.01"
          {...register("value")}
          placeholder="Digite o valor da oportunidade"
        />
      </div>

      {customFields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id}>
            {field.name}
            {field.is_required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {renderCustomField(field)}
          {field.description && (
            <p className="text-sm text-muted-foreground">{field.description}</p>
          )}
        </div>
      ))}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Criando..." : "Criar Oportunidade"}
      </Button>
    </form>
  );
}