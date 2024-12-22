import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";

export function EntityNamingSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [singularName, setSingularName] = useState("");
  const [pluralName, setPluralName] = useState("");

  const { data: collaborator } = useQuery({
    queryKey: ['current-collaborator'],
    queryFn: async () => {
      const { data } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      return data;
    }
  });

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['entity-naming-preferences', collaborator?.client_id],
    enabled: !!collaborator?.client_id,
    queryFn: async () => {
      const { data } = await supabase
        .from('entity_naming_preferences')
        .select('*')
        .eq('client_id', collaborator.client_id)
        .eq('entity_type', 'lead')
        .single();
      return data;
    }
  });

  useEffect(() => {
    if (preferences) {
      setSingularName(preferences.singular_name);
      setPluralName(preferences.plural_name);
    } else {
      setSingularName("Lead");
      setPluralName("Leads");
    }
  }, [preferences]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!collaborator?.client_id) return;

      const { data: existing } = await supabase
        .from('entity_naming_preferences')
        .select('id')
        .eq('client_id', collaborator.client_id)
        .eq('entity_type', 'lead')
        .single();

      if (existing) {
        await supabase
          .from('entity_naming_preferences')
          .update({
            singular_name: singularName,
            plural_name: pluralName
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('entity_naming_preferences')
          .insert({
            client_id: collaborator.client_id,
            entity_type: 'lead',
            singular_name: singularName,
            plural_name: pluralName
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-naming-preferences'] });
      toast({
        title: "Configurações salvas",
        description: "As preferências de nomenclatura foram atualizadas com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as preferências de nomenclatura.",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nomenclatura de Entidades</CardTitle>
        <CardDescription>
          Personalize como você quer chamar suas entidades no sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Nome no Singular</label>
          <Input
            value={singularName}
            onChange={(e) => setSingularName(e.target.value)}
            placeholder="Ex: Lead"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Nome no Plural</label>
          <Input
            value={pluralName}
            onChange={(e) => setPluralName(e.target.value)}
            placeholder="Ex: Leads"
          />
        </div>
        <Button onClick={() => mutation.mutate()}>
          Salvar Alterações
        </Button>
      </CardContent>
    </Card>
  );
}