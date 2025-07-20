// AIDEV-NOTE: Componente principal do popup de empresa refatorado

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useCompany } from "@/features/companies/hooks/useCompany";
import { useCompanyPeople } from "./hooks/index";
import { CompanyPopupProps } from "./types";
import CompanyHeader from "./CompanyHeader";
import CompanyTabs from "./CompanyTabs";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

/**
 * Componente principal do popup de detalhes da empresa
 * Renderiza um Dialog em telas maiores e um Drawer em telas menores
 * AIDEV-NOTE: Usa useCompany para carregar dados completos da empresa com relacionamentos
 */
const CompanyPopup = ({
  company: initialCompany,
  open,
  onOpenChange,
}: CompanyPopupProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  // AIDEV-NOTE: Carregar dados completos da empresa com relacionamentos
  const { company: fullCompany, isLoading: isLoadingCompany } = useCompany(initialCompany?.id || "");
  const { data: people = [] } = useCompanyPeople(initialCompany?.id);

  // AIDEV-NOTE: Usar dados completos se disponíveis, senão usar dados iniciais
  const company = fullCompany || initialCompany;

  // Conteúdo comum para Dialog e Drawer com animação
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-3xl mx-auto p-4 md:p-6"
    >
      <CompanyHeader company={company} peopleCount={people.length} />
      <div className="py-4">
        <CompanyTabs company={company} />
      </div>
    </motion.div>
  );

  // Renderiza Dialog em telas maiores ou Drawer em telas menores
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn(
          "max-w-4xl w-[800px] max-h-[90vh] overflow-y-auto",
          "transition-all duration-300 ease-in-out"
        )}>
          <VisuallyHidden>
            <DialogTitle>
              {company ? `Detalhes da empresa ${company.name}` : 'Detalhes da empresa'}
            </DialogTitle>
            <DialogDescription>
              Visualize e edite as informações da empresa, incluindo dados básicos, contatos, endereço, pessoas vinculadas e notas.
            </DialogDescription>
          </VisuallyHidden>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={cn(
        "max-h-[90vh] overflow-y-auto",
        "transition-all duration-300 ease-in-out"
      )}>
        <VisuallyHidden>
          <DrawerTitle>
            {company?.name ? `Detalhes da empresa ${company.name}` : "Detalhes da empresa"}
          </DrawerTitle>
          <DrawerDescription>
            Modal responsivo para visualização e edição dos detalhes da empresa. 
            Inclui informações de contato, localização, pessoas vinculadas, notas e anexos. 
            Use as abas para navegar entre as diferentes seções de informações.
          </DrawerDescription>
        </VisuallyHidden>
        {content}
      </DrawerContent>
    </Drawer>
  );
};

export default CompanyPopup;