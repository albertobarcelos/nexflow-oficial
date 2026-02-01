import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ContactDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: contact, isLoading, error } = useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          assigned_to_collaborator:collaborators!opportunities_assigned_to_fkey (
            name
          ),
          lead:leads!opportunities_lead_id_fkey (
            name,
            email,
            company
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erro ao carregar contato: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!contact) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Alert>
          <AlertDescription>
            Contato não encontrado
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">{contact.title}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Status:</span>
              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${contact.status === 'won' ? 'bg-green-100 text-green-800' :
                contact.status === 'lost' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'}`}>
                {contact.status === 'won' ? 'Ganho' :
                 contact.status === 'lost' ? 'Perdido' : 'Em Aberto'}
              </span>
            </div>
            <div>
              <span className="font-medium">Valor:</span>
              <span className="ml-2">
                {contact.value
                  ? `R$ ${contact.value.toLocaleString('pt-BR')}`
                  : 'Não definido'}
              </span>
            </div>
            <div>
              <span className="font-medium">Previsão de Fechamento:</span>
              <span className="ml-2">
                {contact.expected_close_date
                  ? new Date(contact.expected_close_date).toLocaleDateString('pt-BR')
                  : 'Não definida'}
              </span>
            </div>
            <div>
              <span className="font-medium">Responsável:</span>
              <span className="ml-2">
                {contact.assigned_to_collaborator?.name || 'Não atribuído'}
              </span>
            </div>
          </CardContent>
        </Card>

        {contact.lead && (
          <Card>
            <CardHeader>
              <CardTitle>Informações do Lead</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-medium">Nome:</span>
                <span className="ml-2">{contact.lead.name}</span>
              </div>
              {contact.lead.email && (
                <div>
                  <span className="font-medium">Email:</span>
                  <span className="ml-2">{contact.lead.email}</span>
                </div>
              )}
              {contact.lead.company && (
                <div>
                  <span className="font-medium">Empresa:</span>
                  <span className="ml-2">{contact.lead.company}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {contact.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{contact.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
