// AIDEV-NOTE: Componente de navegação por abas para o popup da empresa

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Company } from "./types";
import OverviewTab from "./tabs/OverviewTab";
import PeopleTab from "./tabs/PeopleTab";
import NotesTab from "./tabs/NotesTab";
import AttachmentsTab from "./tabs/AttachmentsTab";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CompanyTabsProps {
  company: Company | null;
}

/**
 * Componente que gerencia as abas do popup da empresa
 */
const CompanyTabs = ({ company }: CompanyTabsProps) => {
  // Configuração da animação para as abas
  const tabAnimation = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.2 }
  };

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className={cn(
        "grid grid-cols-4 mb-4",
        "transition-all duration-300 ease-in-out"
      )}>
        <TabsTrigger value="overview" className="transition-all duration-200">Visão Geral</TabsTrigger>
        <TabsTrigger value="people" className="transition-all duration-200">Pessoas</TabsTrigger>
        <TabsTrigger value="notes" className="transition-all duration-200">Notas</TabsTrigger>
        <TabsTrigger value="attachments" className="transition-all duration-200">Anexos</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-4">
        <motion.div {...tabAnimation}>
          <OverviewTab company={company} />
        </motion.div>
      </TabsContent>
      
      <TabsContent value="people" className="space-y-4">
        <motion.div {...tabAnimation}>
          <PeopleTab company={company} />
        </motion.div>
      </TabsContent>
      
      <TabsContent value="notes" className="space-y-4">
        <motion.div {...tabAnimation}>
          <NotesTab company={company} />
        </motion.div>
      </TabsContent>
      
      <TabsContent value="attachments" className="space-y-4">
        <motion.div {...tabAnimation}>
          <AttachmentsTab company={company} />
        </motion.div>
      </TabsContent>
    </Tabs>
  );
};

export default CompanyTabs;