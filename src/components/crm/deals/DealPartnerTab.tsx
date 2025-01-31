import { Check, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePartners } from "@/hooks/usePartners";
import { PartnerAvatar } from "@/components/partners/PartnerAvatar";
import { Partner } from "@/types/partner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DealPartnerTabProps {
  selectedPartner: Partner | null;
  onSelectPartner: (partner: Partner | null) => void;
}

export function DealPartnerTab({ selectedPartner, onSelectPartner }: DealPartnerTabProps) {
  const navigate = useNavigate();
  const { partners = [], isLoading } = usePartners();

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-medium text-gray-800">Parceiro</h2>

      {selectedPartner ? (
        <div className="p-4 bg-gray-50/50 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <PartnerAvatar partner={selectedPartner} size="lg" showStatus />
            <div>
              <h3 className="text-base font-medium text-gray-800">{selectedPartner.name}</h3>
              <p className="text-sm text-gray-600">{selectedPartner.email}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => onSelectPartner(null)}>
            Remover parceiro
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Select
            value={selectedPartner?.id}
            onValueChange={(value) => {
              const partner = partners.find(p => p.id === value);
              if (partner) {
                onSelectPartner(partner);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecionar parceiro" />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <div className="py-6 text-center text-sm text-gray-500">
                  Carregando parceiros...
                </div>
              ) : partners.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500">
                  Nenhum parceiro encontrado
                </div>
              ) : (
                partners.map((partner) => (
                  <SelectItem
                    key={partner.id}
                    value={partner.id}
                    className="flex items-center gap-2 p-2"
                  >
                    <div className="flex items-center gap-2">
                      <PartnerAvatar partner={partner} size="sm" />
                      <div className="flex-1">
                        <p className="font-medium">{partner.name}</p>
                        {partner.email && (
                          <p className="text-sm text-gray-500">{partner.email}</p>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <div className="flex justify-center">
            <Button
              variant="outline"
              className="max-w-[200px] flex items-center justify-center"
              onClick={() => navigate("/crm/partners/add")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo parceiro
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 
