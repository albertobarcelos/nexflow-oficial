import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Partner } from '@/types/database/partner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { AddPartnerDialog } from "@/components/crm/partners/AddPartnerDialog";

interface LinkPartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onLink: (partner: Partner) => void;
}

export function LinkPartnerDialog({ open, onOpenChange, companyId, onLink }: LinkPartnerDialogProps) {
  const [search, setSearch] = useState('');
  const [linkedPartners, setLinkedPartners] = useState<string[]>([]);
  const [isAddPartnerDialogOpen, setIsAddPartnerDialogOpen] = useState(false);

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

  // Buscar parceiros vinculados
  const { data: companyPartners = [] } = useQuery({
    queryKey: ['company_partners', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_partners')
        .select('partner_id')
        .eq('company_id', companyId);

      if (error) {
        console.error('Erro ao buscar vínculos:', error);
        return [];
      }

      const partnerIds = data.map(item => item.partner_id);
      setLinkedPartners(partnerIds);
      return data;
    },
  });

  // Buscar parceiros pelo nome
  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['partners', search],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .ilike('name', `%${search}%`)
        .limit(10);

      if (error) {
        console.error('Erro ao buscar parceiros:', error);
        return [];
      }

      return data;
    },
  });

  const handleLink = async (partner: Partner) => {
    try {
      if (!company?.client_id) {
        toast.error('Não foi possível identificar o cliente da empresa');
        return;
      }

      // Verificar se já existe vínculo
      if (linkedPartners.includes(partner.id)) {
        return;
      }

      const { error } = await supabase
        .from('company_partners')
        .insert({
          company_id: companyId,
          partner_id: partner.id,
          client_id: company.client_id
        });

      if (error) throw error;

      // Atualizar lista de vínculos
      setLinkedPartners(prev => [...prev, partner.id]);
      onLink(partner);
      toast.success('Parceiro vinculado com sucesso!');
    } catch (error) {
      console.error('Erro ao vincular parceiro:', error);
      toast.error('Erro ao vincular parceiro');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Parceiro</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar parceiro..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddPartnerDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Parceiro
              </Button>
            </div>

            <div className="space-y-2">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="flex items-center justify-between p-2 rounded-lg border"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{partner.name}</span>
                    {partner.email && (
                      <span className="text-sm text-muted-foreground">
                        {partner.email}
                      </span>
                    )}
                  </div>
                  <Button
                    variant={linkedPartners.includes(partner.id) ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => handleLink(partner)}
                    disabled={linkedPartners.includes(partner.id)}
                  >
                    {linkedPartners.includes(partner.id) ? "Vinculado" : "Vincular"}
                  </Button>
                </div>
              ))}

              {!isLoading && partners.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  Nenhum parceiro encontrado
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isAddPartnerDialogOpen && (
        <AddPartnerDialog
          open={isAddPartnerDialogOpen}
          onOpenChange={setIsAddPartnerDialogOpen}
          onSuccess={(partner) => {
            onLink(partner);
            setIsAddPartnerDialogOpen(false);
            onOpenChange(false);
          }}
        />
      )}
    </>
  );
}
