import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search, Building2, Mail, Phone, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Client {
  id: string;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  license: {
    name: string;
  };
}

export function ResellerClients() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Buscar dados do revendedor
        const { data: reseller } = await supabase
          .from('core_reseller_users')
          .select('reseller_id')
          .eq('id', session.user.id)
          .single();

        if (reseller?.reseller_id) {
          // Buscar clientes do revendedor
          const { data: clientsData, error } = await supabase
            .from('core_clients')
            .select(`
              id,
              name,
              company_name,
              email,
              phone,
              status,
              created_at,
              license:core_client_license!client_id (
                license:core_licenses!license_id (
                  name
                )
              )
            `)
            .eq('reseller_id', reseller.reseller_id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          // Transformar dados para o formato esperado
          const transformedClients = clientsData?.map(client => ({
            ...client,
            license: client.license?.[0]?.license || { name: 'Sem licença' }
          })) || [];

          setClients(transformedClients);
          setFilteredClients(transformedClients);
        }
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Ativo', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inativo', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' },
      suspended: { label: 'Suspenso', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Carregando clientes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus Clientes</h1>
          <p className="text-gray-600 mt-1">
            Gerencie todos os seus clientes em um só lugar
          </p>
        </div>
        <Button
          onClick={() => navigate('/reseller/clients/new')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, empresa ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      {filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Building2 className="w-4 h-4" />
                      {client.company_name}
                    </CardDescription>
                  </div>
                  {getStatusBadge(client.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    {client.email}
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {client.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    Cliente desde {formatDate(client.created_at)}
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Plano: {client.license.name}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/reseller/clients/${client.id}`)}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece adicionando seu primeiro cliente'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={() => navigate('/reseller/clients/new')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Cliente
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      {clients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
                <div className="text-sm text-gray-600">Total de Clientes</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {clients.filter(c => c.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600">Clientes Ativos</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {clients.filter(c => c.status === 'inactive').length}
                </div>
                <div className="text-sm text-gray-600">Clientes Inativos</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 