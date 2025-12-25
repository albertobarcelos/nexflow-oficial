import { motion } from "framer-motion";
import { Phone, Building2, User, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Opportunity } from "@/hooks/useOpportunities";
import { UserAvatar } from "@/components/ui/user-avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onClick?: () => void;
  index?: number;
}

/**
 * Card flutuante para exibir uma oportunidade
 */
export function OpportunityCard({ opportunity, onClick, index = 0 }: OpportunityCardProps) {
  const formattedDate = opportunity.created_at
    ? format(new Date(opportunity.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })
    : "";

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
        "group relative cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700",
        "bg-white dark:bg-slate-800 p-5 shadow-sm transition-all",
        "hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600"
      )}
      onClick={onClick}
    >
      {/* Header com avatar e nome */}
      <div className="flex items-start gap-3 mb-4">
        <UserAvatar
          user={{
            avatar_type: opportunity.avatar_type || "toy_face",
            avatar_seed: opportunity.avatar_seed || "1|1",
            name: opportunity.client_name,
          }}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {opportunity.client_name}
          </h3>
          {opportunity.main_contact && (
            <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-600 dark:text-slate-400">
              <User className="h-3.5 w-3.5" />
              <span className="truncate">{opportunity.main_contact}</span>
            </div>
          )}
        </div>
      </div>

      {/* Informações principais */}
      <div className="space-y-3">
        {/* Empresas */}
        {opportunity.company_names && opportunity.company_names.length > 0 && (
          <div className="flex items-start gap-2">
            <Building2 className="h-4 w-4 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Empresas</p>
              <div className="flex flex-wrap gap-1">
                {opportunity.company_names.slice(0, 2).map((company, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  >
                    {company}
                  </span>
                ))}
                {opportunity.company_names.length > 2 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                    +{opportunity.company_names.length - 2}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Telefones */}
        {opportunity.phone_numbers && opportunity.phone_numbers.length > 0 && (
          <div className="flex items-start gap-2">
            <Phone className="h-4 w-4 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Telefones</p>
              <div className="flex flex-wrap gap-1">
                {opportunity.phone_numbers.slice(0, 2).map((phone, idx) => (
                  <span
                    key={idx}
                    className="text-sm text-slate-700 dark:text-slate-300 font-mono"
                  >
                    {phone}
                  </span>
                ))}
                {opportunity.phone_numbers.length > 2 && (
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    +{opportunity.phone_numbers.length - 2}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Data de criação */}
        {formattedDate && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Criado em {formattedDate}
            </span>
          </div>
        )}
      </div>

      {/* Efeito de hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-50/0 via-blue-50/0 to-blue-50/0 group-hover:from-blue-50/50 group-hover:via-blue-50/30 group-hover:to-blue-50/0 dark:from-blue-950/0 dark:via-blue-950/0 dark:to-blue-950/0 dark:group-hover:from-blue-950/30 dark:group-hover:via-blue-950/20 dark:group-hover:to-blue-950/0 pointer-events-none transition-all duration-300" />
    </motion.div>
  );
}
