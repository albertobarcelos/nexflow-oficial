import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WebCompany } from '@/lib/supabase';
import { 
  Mail, 
  Phone, 
  MapPin, 
  AtSign,
  Users,
  Building2,
  Hash,
  Globe,
  Info,
  Building,
  Tag,
  History
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { formatCNPJ, formatPhone } from '@/lib/format';

interface CompanyPopupProps {
  company: WebCompany | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CompanyPopup({ company, isOpen, onClose }: CompanyPopupProps) {
  // Buscar pessoas vinculadas
  const { data: people = [] } = useQuery({
    queryKey: ['company_people', company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_people')
        .select(`
          person:people (
            id,
            name,
            email,
            whatsapp,
            celular,
            role
          )
        `)
        .eq('company_id', company?.id);

      if (error) {
        console.error('Erro ao buscar pessoas:', error);
        return [];
      }

      return data.map(item => item.person);
    },
  });

  // Buscar estado e cidade
  const { data: location } = useQuery({
    queryKey: ['company_location', company?.id],
    queryFn: async () => {
      const { data: states } = await supabase
        .from('states')
        .select('name, uf')
        .eq('id', company?.state_id)
        .single();

      const { data: cities } = await supabase
        .from('cities')
        .select('name')
        .eq('id', company?.city_id)
        .single();

      return {
        state: states?.name,
        uf: states?.uf,
        city: cities?.name
      };
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Empresa</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Informações detalhadas sobre a empresa
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Principais */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{company?.name}</h3>
                    <p className="text-sm text-muted-foreground">{company?.razao_social}</p>
                  </div>
                  {company?.categoria && (
                    <div className="px-2.5 py-1.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                      {company.categoria}
                    </div>
                  )}
                </div>

                {company?.cnpj && (
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{formatCNPJ(company.cnpj)}</span>
                  </div>
                )}

                {company?.description && (
                  <div className="flex items-start gap-2 text-sm">
                    <Info className="h-4 w-4 text-muted-foreground mt-1" />
                    <span className="text-muted-foreground">{company.description}</span>
                  </div>
                )}

                {company?.origem && (
                  <div className="flex items-center gap-2 text-sm">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Origem: {company.origem}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contato
                </h4>
                <div className="grid gap-3">
                  {company?.email && (
                    <div className="flex items-center gap-2 text-sm group">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`mailto:${company.email}`} 
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {company.email}
                      </a>
                    </div>
                  )}
                  {company?.telefone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{formatPhone(company.telefone)}</span>
                    </div>
                  )}
                  {company?.celular && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{formatPhone(company.celular)}</span>
                    </div>
                  )}
                  {company?.whatsapp && (
                    <div className="flex items-center gap-2 text-sm group">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`https://wa.me/${company.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {formatPhone(company.whatsapp)}
                      </a>
                    </div>
                  )}
                  {company?.website && (
                    <div className="flex items-center gap-2 text-sm group">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {company.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          {(company?.cep || company?.rua || location?.city || location?.state) && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Localização
                  </h4>
                  <div className="grid gap-2 text-sm">
                    {company?.cep && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">CEP: {company.cep}</span>
                      </div>
                    )}
                    {(company?.rua || company?.numero || company?.complemento) && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {company.rua}
                          {company.numero && `, ${company.numero}`}
                          {company.complemento && ` - ${company.complemento}`}
                        </span>
                      </div>
                    )}
                    {(company.bairro || location?.city || location?.state) && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {company.bairro && `${company.bairro}, `}
                          {location?.city}
                          {location?.uf && ` - ${location.uf}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pessoas */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Pessoas
                  </h4>
                  <span className="text-xs text-muted-foreground px-2.5 py-1.5 bg-secondary rounded-full">
                    {people.length} pessoa(s)
                  </span>
                </div>
                
                {people.length > 0 ? (
                  <div className="grid gap-2">
                    {people.map((person: any) => (
                      <div 
                        key={person.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium">{person.name}</span>
                          {person.role && (
                            <span className="text-xs text-muted-foreground">
                              {person.role}
                            </span>
                          )}
                          {person.email && (
                            <a 
                              href={`mailto:${person.email}`}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {person.email}
                            </a>
                          )}
                          {(person.whatsapp || person.celular) && (
                            <div className="flex items-center gap-2">
                              {person.whatsapp && (
                                <a
                                  href={`https://wa.me/${person.whatsapp.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  WhatsApp: {formatPhone(person.whatsapp)}
                                </a>
                              )}
                              {person.celular && (
                                <span className="text-xs text-muted-foreground">
                                  Celular: {formatPhone(person.celular)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-muted-foreground bg-muted/50 rounded-lg">
                    Nenhuma pessoa vinculada
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
