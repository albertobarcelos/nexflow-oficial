import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useOpportunities } from '@/hooks/useOpportunities';
import { Button } from '@/components/ui/button';
import { Plus, Kanban, Grid, List, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ContactsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  const {
    contacts,
    isLoading,
    isError,
    permissions,
  } = useOpportunities({ enabled: hasAccess });

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/crm/login");
          return;
        }

        const userId = session.user.id;

        const { data: clientUser, error: userError } = await supabase
          .from('core_client_users')
          .select('role, client_id')
          .eq('id', userId)
          .single();

        if (userError || !clientUser) {
          console.error('Erro ao buscar usuário:', userError);
          toast({
            title: "Erro de acesso",
            description: "Não foi possível verificar suas permissões.",
            variant: "destructive",
          });
          navigate("/crm/dashboard");
          return;
        }

        let hasRoleAccess = clientUser.role === 'administrator';

        if (!hasRoleAccess) {
          const { data: teamMembers, error: teamError } = await supabase
            .from('core_team_members')
            .select('role')
            .eq('user_profile_id', userId)
            .eq('role', 'leader');

          if (!teamError && teamMembers && teamMembers.length > 0) {
            hasRoleAccess = true;
          }
        }

        if (!hasRoleAccess) {
          toast({
            title: "Acesso negado",
            description: "Apenas administrators e leaders de time podem acessar esta página.",
            variant: "destructive",
          });
          navigate("/crm/dashboard");
          return;
        }

        setHasAccess(true);
      } catch (error) {
        console.error('Erro ao verificar acesso:', error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao verificar seu acesso.",
          variant: "destructive",
        });
        navigate("/crm/dashboard");
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkAccess();
  }, [navigate, toast]);

  if (isCheckingAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Contatos</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Visualize e gerencie os contatos em formato de lista
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/crm/contacts')}
          >
            <Grid className="h-4 w-4 mr-2" />
            Visualizar Cards
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Contato
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <p className="text-sm text-destructive">
              Erro ao carregar contatos. Tente novamente.
            </p>
          </div>
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Nenhum contato encontrado.
            </p>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contato Principal</TableHead>
                <TableHead>Telefones</TableHead>
                <TableHead>Empresas</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Data de Criação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                >
                  <TableCell className="font-medium">
                    {contact.client_name || '-'}
                  </TableCell>
                  <TableCell>{contact.main_contact || '-'}</TableCell>
                  <TableCell>
                    {contact.phone_numbers && contact.phone_numbers.length > 0
                      ? contact.phone_numbers.join(', ')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {contact.company_names && contact.company_names.length > 0
                      ? contact.company_names.join(', ')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {contact.assigned_team_id ? (
                      <Badge variant="outline">Time ID: {contact.assigned_team_id.slice(0, 8)}...</Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.created_at
                      ? new Date(contact.created_at).toLocaleDateString('pt-BR')
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
