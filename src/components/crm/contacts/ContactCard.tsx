import { motion } from "framer-motion";
import { Phone, Building2, User, Calendar, Plus, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { UnifiedContact } from "@/hooks/useContactsWithIndications";
import { UserAvatar } from "@/components/ui/user-avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ContactCardProps {
  contact: UnifiedContact;
  onClick?: () => void;
  onCreateCard?: () => void;
  index?: number;
}

const typeLabels: Record<"cliente" | "parceiro" | "outro", string> = {
  cliente: "Cliente",
  parceiro: "Parceiro",
  outro: "Outro",
};

const typeColors: Record<"cliente" | "parceiro" | "outro", string> = {
  cliente: "bg-blue-100 text-blue-800 border-blue-200  ",
  parceiro: "bg-purple-100 text-purple-800 border-purple-200  ",
  outro: "bg-gray-100 text-gray-800 border-gray-200  ",
};

/**
 * Card flutuante para exibir um contato
 */
export function ContactCard({ contact, onClick, onCreateCard, index = 0 }: ContactCardProps) {
  const formattedDate = contact.created_at
    ? format(new Date(contact.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })
    : "";

  const handleCreateCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateCard?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: "easeOut",
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      className={cn(
        "group relative cursor-pointer rounded-xl border border-neutral-200 ",
        "bg-white  p-5 shadow-sm transition-all",
        "hover:shadow-md hover:border-neutral-300 :border-neutral-600"
      )}
      onClick={onClick}
    >
      {/* Header com avatar e nome */}
      <div className="flex items-start gap-3 mb-4">
        <UserAvatar
          user={{
            avatar_type: contact.avatar_type || "toy_face",
            avatar_seed: contact.avatar_seed || "1|1",
            name: contact.client_name,
          }}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-neutral-900  truncate">
              {contact.client_name}
            </h3>
            {/* Badge de Indicação */}
            {contact.isIndication && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200   text-xs whitespace-nowrap">
                <Tag className="h-3 w-3 mr-1" />
                Indicação
              </Badge>
            )}
          </div>
          {contact.main_contact && (
            <div className="flex items-center gap-1.5 mt-1 text-sm text-neutral-600 ">
              <User className="h-3.5 w-3.5" />
              <span className="truncate">{contact.main_contact}</span>
            </div>
          )}
          {/* Tags de tipo de contato */}
          {contact.contact_type && (
            <div className="flex flex-wrap gap-1 mt-2">
              {(() => {
                // Suporta tanto string quanto array para compatibilidade
                const types = Array.isArray(contact.contact_type) 
                  ? contact.contact_type 
                  : [contact.contact_type];
                
                return types.map((type) => {
                  if (!type || !typeLabels[type as keyof typeof typeLabels]) return null;
                  return (
                    <Badge
                      key={type}
                      variant="outline"
                      className={cn(
                        "text-xs",
                        typeColors[type as keyof typeof typeColors]
                      )}
                    >
                      {typeLabels[type as keyof typeof typeLabels]}
                    </Badge>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Informações principais */}
      <div className="space-y-3">
        {/* Empresas */}
        {contact.company_names && contact.company_names.length > 0 && (
          <div className="flex items-start gap-2">
            <Building2 className="h-4 w-4 text-neutral-400  mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-500  mb-1">Empresas</p>
              <div className="flex flex-wrap gap-1">
                {contact.company_names.slice(0, 2).map((company, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50  text-blue-700 "
                  >
                    {company}
                  </span>
                ))}
                {contact.company_names.length > 2 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-neutral-100  text-neutral-600 ">
                    +{contact.company_names.length - 2}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Telefones */}
        {contact.phone_numbers && contact.phone_numbers.length > 0 && (
          <div className="flex items-start gap-2">
            <Phone className="h-4 w-4 text-neutral-400  mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-500  mb-1">Telefones</p>
              <div className="flex flex-wrap gap-1">
                {contact.phone_numbers.slice(0, 2).map((phone, idx) => (
                  <span
                    key={idx}
                    className="text-sm text-neutral-700  font-mono"
                  >
                    {phone}
                  </span>
                ))}
                {contact.phone_numbers.length > 2 && (
                  <span className="text-sm text-neutral-500 ">
                    +{contact.phone_numbers.length - 2}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Data de criação */}
        {formattedDate && (
          <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 ">
            <Calendar className="h-3.5 w-3.5 text-neutral-400 " />
            <span className="text-xs text-neutral-500 ">
              Criado em {formattedDate}
            </span>
          </div>
        )}
      </div>

      {/* Botão de ação flutuante */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCreateCard}
          className="h-8 px-3 text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Criar Card
        </Button>
      </div>

      {/* Efeito de hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-50/0 via-blue-50/0 to-blue-50/0 group-hover:from-blue-50/50 group-hover:via-blue-50/30 group-hover:to-blue-50/0    :from-blue-950/30 :via-blue-950/20 :to-blue-950/0 pointer-events-none transition-all duration-300" />
    </motion.div>
  );
}
