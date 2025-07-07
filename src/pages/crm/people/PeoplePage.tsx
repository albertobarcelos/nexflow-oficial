import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Download, Import, User, Wand2, Plus, UserPlus, Pencil, Trash } from "lucide-react";
import { usePeople } from "@/hooks/usePeople";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Person } from "@/types/person";
import { PersonPopup } from "@/components/crm/people/PersonPopup";
import { toast } from "sonner";
import { AddPersonDialog } from "@/components/crm/people/AddPersonDialog";
// import { PeopleMockData } from "./PeopleMockData";

export function PeoplePage() {
  const navigate = useNavigate();
  const { people, isLoading, deletePerson } = usePeople();
  const [search, setSearch] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>("todos");

  // Tipos de pessoa para os filtros
  const filterOptions = [
    { label: "Todos", value: "todos" },
    { label: "Parceiro", value: "parceiro" },
    { label: "Contato", value: "contato" },
    { label: "Consultor", value: "consultor" },
    { label: "Contato Principal", value: "contato_principal" },
    { label: "Contato Secundário", value: "contato_secundario" },
  ];

  const filteredPeople = people?.filter((person) => {
    const matchesSearch =
      person.name.toLowerCase().includes(search.toLowerCase()) ||
      person.cpf?.toLowerCase().includes(search.toLowerCase()) ||
      person.email?.toLowerCase().includes(search.toLowerCase()) ||
      person.description?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "todos" ||
      (person.person_type && person.person_type.toLowerCase() === filter);
    return matchesSearch && matchesFilter;
  });

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
    <div className="space-y-4 p-8">
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
            <UserPlus className="w-4 h-4 mr-2" />
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
          className="w-full rounded-full"
        />
      </div>

      {/* Barra de filtros (choice chips) */}
      <div className="flex flex-wrap gap-2 mt-2 mb-2 justify-center">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition
              ${filter === opt.value
                ? "bg-primary text-white border-primary shadow"
                : "bg-muted text-muted-foreground border-transparent hover:bg-primary/10"}
            `}
            onClick={() => setFilter(opt.value)}
            type="button"
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/100 rounded-t-md text-white">
                <th className="py-1 px-3 text-left font-medium text-xs text-muted-foreground tracking-wide w-2/5 md:w-1/3 lg:w-1/4 rounded-tl-md">Nome</th>
                <th className="py-1 px-3 text-center font-medium text-xs text-muted-foreground tracking-wide w-1/5 hidden sm:table-cell">Contato</th>
                <th className="py-1 px-3 text-center font-medium text-xs text-muted-foreground tracking-wide w-1/6 hidden sm:table-cell">Tipo</th>
                <th className="py-1 px-3 text-center font-medium text-xs text-muted-foreground tracking-wide w-1/6 hidden sm:table-cell">Status</th>
                <th className="py-1 px-3 text-center font-medium text-xs text-muted-foreground tracking-wide w-1/6 hidden md:table-cell">CPF</th>
                <th className="py-1 px-3 text-right font-medium text-xs text-muted-foreground tracking-wide w-12 rounded-tr-md">Ações</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-3 px-4 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : filteredPeople?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-3 px-4 text-center text-muted-foreground">
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
                    {/* Nome + avatar + email */}
                    <td className="py-3 px-4 w-2/5 md:w-1/3 lg:w-1/4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                          {/* Placeholder avatar */}
                          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="12" fill="#e5e7eb" />
                            <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.314 0-6 1.343-6 3v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1c0-1.657-2.686-3-6-3Z" fill="#9ca3af" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-foreground">{person.name}</div>
                          <div className="text-xs text-muted-foreground">{person.email || <span className="italic text-muted-foreground">Email</span>}</div>
                        </div>
                      </div>
                    </td>
                    {/* Contato */}
                    <td className="py-3 px-4 text-center w-1/5 hidden sm:table-cell">
                      {person.whatsapp || person.email || <span className="italic text-muted-foreground">Whatsapp</span>}
                    </td>
                    {/* Tipo */}
                    <td className="py-3 px-4 text-center w-1/6 hidden sm:table-cell">
                      {person.person_type ? (
                        <span className="capitalize">{person.person_type.replace("_", " ")}</span>
                      ) : (
                        <span className="italic text-muted-foreground">Tipo</span>
                      )}
                    </td>
                    {/* Status */}
                    <td className="py-3 px-4 text-center w-1/6 hidden sm:table-cell">
                      <span className="inline-block px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">Ativo</span>
                    </td>
                    {/* CPF */}
                    <td className="py-3 px-4 text-center w-1/6 hidden md:table-cell">{person.cpf || <span className="italic text-muted-foreground">CPF</span>}</td>
                    {/* Ações */}
                    <td className="py-2 px-2 text-right w-12">
                      <div className="flex justify-end gap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleEdit(e, person)}
                          aria-label="Editar"
                          className=" text-gray-400 hover:text-blue-600"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-destructive"
                          onClick={(e) => handleDelete(e, person)}
                          aria-label="Excluir"
                        >
                          <Trash className="w-4 h-4" />
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
