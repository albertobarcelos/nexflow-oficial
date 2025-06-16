import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Search, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { QuickPersonCreate } from '../people/QuickPersonCreate';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const quickCompanySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  cnpj: z.string().min(1, 'CNPJ é obrigatório'),
  company_type: z.string().min(1, 'Tipo de empresa é obrigatório'),
});

type QuickCompanyFormValues = z.infer<typeof quickCompanySchema>;

interface QuickCompanyCreateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledName?: string;
  onSuccess: (company: any) => void;
}

export function QuickCompanyCreate({ 
  open, 
  onOpenChange, 
  prefilledName,
  onSuccess 
}: QuickCompanyCreateProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPersonDialogOpen, setIsPersonDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeople, setSelectedPeople] = useState<any[]>([]);
  const { user } = useAuth();

  // Buscar o client_id do usuário logado
  const { data: collaborator } = useQuery({
    queryKey: ['collaborator', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('collaborators')
        .select('id, client_id')
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

  // Buscar pessoas
  const { data: people = [] } = useQuery({
    queryKey: ['people', searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];

      const { data, error } = await supabase
        .from('people')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .limit(5);

      if (error) {
        console.error('Erro ao buscar pessoas:', error);
        return [];
      }

      return data;
    },
    enabled: !!searchTerm,
  });

  const form = useForm<QuickCompanyFormValues>({
    resolver: zodResolver(quickCompanySchema),
    defaultValues: {
      name: prefilledName || '',
      cnpj: '',
      company_type: '',
    },
  });

  const handlePersonCreated = (person: any) => {
    setSelectedPeople([...selectedPeople, person]);
    setIsPersonDialogOpen(false);
  };

  const removePerson = (personToRemove: any) => {
    setSelectedPeople(selectedPeople.filter(person => person.id !== personToRemove.id));
  };

  const onSubmit = async (data: QuickCompanyFormValues) => {
    try {
      setIsSubmitting(true);
      console.log('Iniciando criação de empresa:', { data, user, collaborator, selectedPeople });

      if (!user?.id) {
        toast.error('Usuário não está logado');
        return;
      }

      if (!collaborator?.client_id) {
        toast.error('Usuário não está vinculado a um cliente');
        return;
      }

      // 1. Criar a empresa
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          ...data,
          responsavel_id: collaborator.id,
          client_id: collaborator.client_id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (companyError) {
        console.error('Erro ao criar empresa:', companyError);
        throw companyError;
      }

      console.log('Empresa criada com sucesso:', company);

      // 2. Criar vínculos com pessoas selecionadas
      if (selectedPeople.length > 0) {
        const { error: linkError } = await supabase
          .from('company_people')
          .insert(
            selectedPeople.map(person => ({
              company_id: company.id,
              person_id: person.id,
              client_id: collaborator.client_id,
              responsavel_id: collaborator.id,
              created_at: new Date().toISOString(),
            }))
          );

        if (linkError) {
          console.error('Erro ao vincular pessoas:', linkError);
          // Não vamos lançar erro aqui para não impedir a criação da empresa
          toast.error('Erro ao vincular algumas pessoas à empresa');
        }
      }

      toast.success('Empresa criada com sucesso!');
      onSuccess(company);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      toast.error('Erro ao criar empresa');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Nova Empresa</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Empresa</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="off" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="off" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Empresa</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Possível Cliente (Lead)">Possível Cliente (Lead)</SelectItem>
                        <SelectItem value="Cliente Ativo">Cliente Ativo</SelectItem>
                        <SelectItem value="Empresa Parceira">Empresa Parceira</SelectItem>
                        <SelectItem value="Cliente Inativo">Cliente Inativo</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <FormLabel>Pessoas</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPersonDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Nova Pessoa
                  </Button>
                </div>

                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar pessoa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  {selectedPeople.map(person => (
                    <div
                      key={person.id}
                      className="flex items-center justify-between p-2 rounded-lg border"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            {person.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{person.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePerson(person)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {searchTerm && people.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-background rounded-md border shadow-md">
                    {people
                      .filter(person => !selectedPeople.find(p => p.id === person.id))
                      .map((person) => (
                        <div
                          key={person.id}
                          className={cn(
                            "flex items-center gap-2 p-2 cursor-pointer hover:bg-accent",
                            "transition-colors"
                          )}
                          onClick={() => {
                            setSelectedPeople(prev => [...prev, person]);
                            setSearchTerm('');
                          }}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>
                              {person.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{person.name}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

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
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Empresa
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <QuickPersonCreate
        open={isPersonDialogOpen}
        onOpenChange={setIsPersonDialogOpen}
        onSuccess={handlePersonCreated}
      />
    </>
  );
}
