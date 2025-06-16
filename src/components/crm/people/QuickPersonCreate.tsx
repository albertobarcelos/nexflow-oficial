import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

// Função para formatar o número de WhatsApp
const formatWhatsApp = (value: string) => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara
  if (numbers.length <= 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').slice(0, 15);
};

const quickPersonSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  whatsapp: z.string().optional(),
  cargo: z.string().optional(),
});

type QuickPersonFormValues = z.infer<typeof quickPersonSchema>;

interface QuickPersonCreateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledName?: string;
  onSuccess: (person: any) => void;
}

export function QuickPersonCreate({ 
  open, 
  onOpenChange, 
  prefilledName,
  onSuccess 
}: QuickPersonCreateProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Buscar o client_id do usuário logado
  const { data: collaborator } = useQuery({
    queryKey: ['collaborator', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar colaborador:', error);
        return null;
      }

      console.log('Dados do colaborador encontrados:', data);
      return data;
    },
    enabled: !!user?.id,
  });

  const form = useForm<QuickPersonFormValues>({
    resolver: zodResolver(quickPersonSchema),
    defaultValues: {
      name: prefilledName || '',
      whatsapp: '',
      cargo: '',
    },
  });

  const onSubmit = async (data: QuickPersonFormValues) => {
    try {
      setIsSubmitting(true);
      console.log('Iniciando criação de pessoa:', { data, user, collaborator });

      if (!user?.id) {
        toast.error('Usuário não está logado');
        return;
      }

      if (!collaborator?.client_id) {
        toast.error('Usuário não está vinculado a um cliente');
        return;
      }

      const { data: person, error } = await supabase
        .from('people')
        .insert({
          ...data,
          responsavel_id: user.id,
          client_id: collaborator.client_id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao inserir pessoa:', error);
        throw error;
      }

      console.log('Pessoa criada com sucesso:', person);
      toast.success('Pessoa criada com sucesso!');
      onSuccess(person);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar pessoa:', error);
      toast.error('Erro ao criar pessoa');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Nova Pessoa</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      autoComplete="off"
                      onChange={(e) => {
                        const formatted = formatWhatsApp(e.target.value);
                        e.target.value = formatted;
                        field.onChange(formatted);
                      }}
                      maxLength={15}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cargo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                onClick={form.handleSubmit(onSubmit)}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Pessoa
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
