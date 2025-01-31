import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useParams } from "react-router-dom";
import { CustomField } from "../settings/custom-fields/types";
import { CustomFieldRenderer } from "./CustomFieldRenderer";
import { OpportunityFormData } from "./types";

export function NewOpportunityForm({ onSuccess }: { onSuccess?: () => void }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { pipelineId } = useParams();
  const { register, handleSubmit, reset, setValue, watch } = useForm<OpportunityFormData>();
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

        if (fields) {
          setCustomFields(fields as CustomField[]);
        }
      } catch (error) {
        console.error('Error loading custom fields:', error);
      }
    }

    loadCustomFields();
  }, [pipelineId]);

  const onSubmit = async (data: OpportunityFormData) => {
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
      onSuccess?.();
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
        <CustomFieldRenderer
          key={field.id}
          field={field}
          register={register}
          setValue={setValue}
          watch={watch}
        />
      ))}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Criando..." : "Criar Oportunidade"}
      </Button>
    </form>
  );
}
