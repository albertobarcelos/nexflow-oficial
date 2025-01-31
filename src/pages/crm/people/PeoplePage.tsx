import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Download, Import, Star, User, Wand2, Plus } from "lucide-react";
import { usePeople } from "@/hooks/usePeople";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Person } from "@/types/person";
import { PersonPopup } from "@/components/crm/people/PersonPopup";
import { toast } from "sonner";
import { AddPersonDialog } from "@/components/crm/people/AddPersonDialog";

export function PeoplePage() {
  const navigate = useNavigate();
  const { people, isLoading, deletePerson } = usePeople();
  const [search, setSearch] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredPeople = people?.filter((person) =>
    person.name.toLowerCase().includes(search.toLowerCase()) ||
    person.cpf?.toLowerCase().includes(search.toLowerCase()) ||
    person.email?.toLowerCase().includes(search.toLowerCase()) ||
    person.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (e: React.MouseEvent, person: Person) => {
    e.stopPropagation();
    navigate(`/crm/people/${person.id}/edit`);
  };

  const handleDelete = async (e: React.MouseEvent, person: Person) => {
    e.stopPropagation();
    
    if (!confirm("Tem certeza que deseja remover esta pessoa?")) return;

    try {
      await deletePerson(person.id);
      toast.success("Pessoa removida com sucesso!");
    } catch (error) {
      console.error("Erro ao remover pessoa:", error);
      toast.error("Erro ao remover pessoa");
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pessoas</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Import className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Wand2 className="w-4 h-4 mr-2" />
            Gerar leads
          </Button>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            variant="default"
            className="bg-[#0f172a] hover:bg-[#0f172a]/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Pessoa
          </Button>
        </div>
      </div>

      {/* Barra de pesquisa */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar pessoas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nome
                  </div>
                </th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Categoria</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Cargo</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Empresa
                  </div>
                </th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Contato</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">CPF</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-3 px-4 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : filteredPeople?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-3 px-4 text-center text-muted-foreground">
                    Nenhuma pessoa encontrada
                  </td>
                </tr>
              ) : (
                filteredPeople?.map((person) => (
                  <tr
                    key={person.id}
                    className="border-b cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedPerson(person)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {person.name}
                      </div>
                    </td>
                    <td className="py-3 px-4">{person.person_type}</td>
                    <td className="py-3 px-4">{person.cargo || "-"}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {person.company_name || "Indefinido"}
                      </div>
                    </td>
                    <td className="py-3 px-4">{person.whatsapp || person.email || "-"}</td>
                    <td className="py-3 px-4">{person.cpf || "-"}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => handleEdit(e, person)}
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => handleDelete(e, person)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="text-sm text-muted-foreground">
        Exibindo {filteredPeople?.length} de {people?.length} pessoas
      </div>

      {/* Popups */}
      {selectedPerson && (
        <PersonPopup
          person={selectedPerson}
          open={!!selectedPerson}
          onClose={() => setSelectedPerson(null)}
        />
      )}

      <AddPersonDialog 
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
}
