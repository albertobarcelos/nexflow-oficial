// AIDEV-NOTE: Componente principal da aba Pessoas com ilustração para estado vazio

import { useCompanyPeople } from "../../hooks/index";
import { TabProps } from "../../types";
import PersonCard from "./PersonCard";
import EmptyPeopleIllustration from "../../components/EmptyPeopleIllustration";

/**
 * Componente que exibe a aba de Pessoas vinculadas à empresa
 */
const PeopleTab = ({ company }: TabProps) => {
  const { data: people = [], isLoading } = useCompanyPeople(company?.id);

  if (!company) return null;

  const handleAddPerson = () => {
    // TODO: Implementar modal/formulário para adicionar pessoa
    console.log('Adicionar pessoa para empresa:', company.id);
  };
  
  return (
    <div className="py-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">Carregando pessoas...</p>
        </div>
      ) : people.length > 0 ? (
        <div className="space-y-4">
          {people.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      ) : (
        <EmptyPeopleIllustration onAddPerson={handleAddPerson} />
      )}
    </div>
  );
};

export default PeopleTab;