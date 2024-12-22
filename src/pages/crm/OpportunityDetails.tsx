import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OpportunityDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: opportunity, isLoading } = useQuery({
    queryKey: ['opportunity', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('opportunities')
        .select(`
          *,
          assigned_to (
            name
          ),
          lead (
            name,
            email,
            company
          )
        `)
        .eq('id', id)
        .single();

      return data;
    }
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!opportunity) {
    return <div>Oportunidade não encontrada</div>;
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
        <h1 className="text-2xl font-bold">{opportunity.title}</h1>
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
                ${opportunity.status === 'won' ? 'bg-green-100 text-green-800' :
                opportunity.status === 'lost' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'}`}>
                {opportunity.status === 'won' ? 'Ganho' :
                 opportunity.status === 'lost' ? 'Perdido' : 'Em Aberto'}
              </span>
            </div>
            <div>
              <span className="font-medium">Valor:</span>
              <span className="ml-2">
                {opportunity.value
                  ? `R$ ${opportunity.value.toLocaleString('pt-BR')}`
                  : 'Não definido'}
              </span>
            </div>
            <div>
              <span className="font-medium">Previsão de Fechamento:</span>
              <span className="ml-2">
                {opportunity.expected_close_date
                  ? new Date(opportunity.expected_close_date).toLocaleDateString('pt-BR')
                  : 'Não definida'}
              </span>
            </div>
            <div>
              <span className="font-medium">Responsável:</span>
              <span className="ml-2">
                {opportunity.assigned_to?.name || 'Não atribuído'}
              </span>
            </div>
          </CardContent>
        </Card>

        {opportunity.lead && (
          <Card>
            <CardHeader>
              <CardTitle>Informações do Lead</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-medium">Nome:</span>
                <span className="ml-2">{opportunity.lead.name}</span>
              </div>
              {opportunity.lead.email && (
                <div>
                  <span className="font-medium">Email:</span>
                  <span className="ml-2">{opportunity.lead.email}</span>
                </div>
              )}
              {opportunity.lead.company && (
                <div>
                  <span className="font-medium">Empresa:</span>
                  <span className="ml-2">{opportunity.lead.company}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {opportunity.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{opportunity.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}