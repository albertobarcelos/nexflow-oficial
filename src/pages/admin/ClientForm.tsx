import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface ClientFormData {
  name: string;
  email: string;
  company_name: string;
  contact_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  notes?: string;
}

export default function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, handleSubmit, reset } = useForm<ClientFormData>();

  const { data: client } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
    onSuccess: (data) => {
      if (data) {
        reset(data);
      }
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    try {
      if (id) {
        await supabase
          .from('clients')
          .update(data)
          .eq('id', id);

        toast({
          title: "Cliente atualizado",
          description: "Os dados do cliente foram atualizados com sucesso.",
        });
      } else {
        await supabase
          .from('clients')
          .insert([data]);

        toast({
          title: "Cliente criado",
          description: "O cliente foi criado com sucesso.",
        });
      }

      navigate('/admin/clients');
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar os dados do cliente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {id ? 'Editar Cliente' : 'Novo Cliente'}
        </h1>
        <p className="text-muted-foreground">
          {id ? 'Atualize os dados do cliente' : 'Cadastre um novo cliente'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="name">Nome</label>
            <Input id="name" {...register('name')} required />
          </div>
          <div className="space-y-2">
            <label htmlFor="email">Email</label>
            <Input id="email" type="email" {...register('email')} required />
          </div>
          <div className="space-y-2">
            <label htmlFor="company_name">Nome da Empresa</label>
            <Input id="company_name" {...register('company_name')} required />
          </div>
          <div className="space-y-2">
            <label htmlFor="contact_name">Nome do Contato</label>
            <Input id="contact_name" {...register('contact_name')} />
          </div>
          <div className="space-y-2">
            <label htmlFor="phone">Telefone</label>
            <Input id="phone" {...register('phone')} />
          </div>
          <div className="space-y-2">
            <label htmlFor="address">Endereço</label>
            <Input id="address" {...register('address')} />
          </div>
          <div className="space-y-2">
            <label htmlFor="city">Cidade</label>
            <Input id="city" {...register('city')} />
          </div>
          <div className="space-y-2">
            <label htmlFor="state">Estado</label>
            <Input id="state" {...register('state')} />
          </div>
          <div className="space-y-2">
            <label htmlFor="postal_code">CEP</label>
            <Input id="postal_code" {...register('postal_code')} />
          </div>
          <div className="space-y-2">
            <label htmlFor="country">País</label>
            <Input id="country" {...register('country')} defaultValue="Brasil" />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="notes">Observações</label>
          <Input id="notes" {...register('notes')} />
        </div>

        <div className="flex gap-2">
          <Button type="submit">
            {id ? 'Atualizar' : 'Cadastrar'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/clients')}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}