import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Person } from '@/types/database/person';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { QuickPersonCreate } from "@/components/crm/people/QuickPersonCreate";

interface LinkPersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onLink: (person: Person) => void;
  currentLinkedPeople: Person[]; 
}

export function LinkPersonDialog({ 
  open, 
  onOpenChange, 
  companyId, 
  onLink,
  currentLinkedPeople 
}: LinkPersonDialogProps) {
  const [search, setSearch] = useState('');
  const [isQuickPersonCreateOpen, setIsQuickPersonCreateOpen] = useState(false);

  // Buscar informações da empresa para obter o client_id
  const { data: company } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('client_id')
        .eq('id', companyId)
        .single();

      if (error) {
        console.error('Erro ao buscar empresa:', error);
        return null;
      }

      return data;
    },
  });

  // Buscar pessoas pelo nome
  const { data: people = [], isLoading } = useQuery({
    queryKey: ['people', search],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .ilike('name', `%${search}%`)
        .limit(10);

      if (error) {
        console.error('Erro ao buscar pessoas:', error);
        return [];
      }

      return data;
    },
    enabled: open,
  });

  const handleLink = async (person: Person) => {
    try {
      if (!company?.client_id) {
        toast.error('Não foi possível identificar o cliente da empresa');
        return;
      }

      // Verificar se já está vinculada usando o estado atual
      if (currentLinkedPeople.some(p => p.id === person.id)) {
        return;
      }

      // Se a pessoa já foi vinculada antes (está apenas temporariamente desvinculada),
      // apenas atualizamos o estado sem tentar inserir no banco
      const alreadyExistsInDb = await supabase
        .from('company_people')
        .select('id')
        .eq('company_id', companyId)
        .eq('person_id', person.id)
        .single();

      if (alreadyExistsInDb.data) {
        onLink(person);
        toast.success('Pessoa vinculada com sucesso!');
        return;
      }

      // Se não existe no banco, cria um novo vínculo
      const { error } = await supabase
        .from('company_people')
        .insert({
          company_id: companyId,
          person_id: person.id,
          client_id: company.client_id
        });

      if (error) throw error;

      onLink(person);
      toast.success('Pessoa vinculada com sucesso!');
    } catch (error) {
      console.error('Erro ao vincular pessoa:', error);
      toast.error('Erro ao vincular pessoa');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Pessoa</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar pessoa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsQuickPersonCreateOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Pessoa
              </Button>
            </div>

            <div className="space-y-2">
              {people.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between p-2 rounded-lg border"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{person.name}</span>
                    {person.email && (
                      <span className="text-sm text-muted-foreground">
                        {person.email}
                      </span>
                    )}
                  </div>
                  <Button
                    variant={currentLinkedPeople.some(p => p.id === person.id) ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => handleLink(person)}
                    disabled={currentLinkedPeople.some(p => p.id === person.id)}
                  >
                    {currentLinkedPeople.some(p => p.id === person.id) ? "Vinculado" : "Vincular"}
                  </Button>
                </div>
              ))}

              {!isLoading && people.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  Nenhuma pessoa encontrada
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isQuickPersonCreateOpen && (
        <QuickPersonCreate
          open={isQuickPersonCreateOpen}
          onOpenChange={setIsQuickPersonCreateOpen}
          onSuccess={(person) => {
            onLink(person);
            setIsQuickPersonCreateOpen(false);
            onOpenChange(false);
          }}
        />
      )}
    </>
  );
}
