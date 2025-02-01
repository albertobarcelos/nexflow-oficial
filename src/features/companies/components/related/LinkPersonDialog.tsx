import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePeople } from "@/hooks/usePeople";
import { Person } from "@/types/database/person";
import { Search, Plus } from "lucide-react";
import { AddPersonDialog } from "@/components/crm/people/AddPersonDialog";
import { toast } from "sonner";
import { useCompanyRelationships } from "@/features/companies/hooks/useCompanyRelationships";

interface LinkPersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onLink: (person: Person) => void;
}

export function LinkPersonDialog({ open, onOpenChange, companyId, onLink }: LinkPersonDialogProps) {
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { people } = usePeople();
  const { companyPeople } = useCompanyRelationships(companyId);

  // Ids das pessoas já vinculadas
  const linkedPeopleIds = companyPeople?.map((cp) => cp.person.id) || [];

  // Filtrar pessoas que não estão vinculadas à empresa atual
  const filteredPeople = people?.filter((person) => {
    const matchesSearch =
      person.name?.toLowerCase().includes(search.toLowerCase()) ||
      person.email?.toLowerCase().includes(search.toLowerCase()) ||
      person.whatsapp?.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  const handleLinkPerson = async (person: Person) => {
    onLink(person);
    onOpenChange(false);
    toast.success("Pessoa adicionada com sucesso!");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl" aria-describedby="dialog-description">
          <DialogHeader>
            <DialogTitle>Vincular Pessoa</DialogTitle>
            <p id="dialog-description" className="text-sm text-muted-foreground">
              Selecione uma pessoa para vincular a esta empresa ou crie uma nova.
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Barra de pesquisa */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar pessoas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button
                onClick={() => {
                  setIsAddDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Pessoa
              </Button>
            </div>

            {/* Lista de pessoas */}
            <div className="border rounded-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="py-3 px-4 text-left font-medium">Nome</th>
                      <th className="py-3 px-4 text-left font-medium">Email</th>
                      <th className="py-3 px-4 text-left font-medium">WhatsApp</th>
                      <th className="py-3 px-4 text-right font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPeople?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-3 px-4 text-center text-muted-foreground">
                          Nenhuma pessoa encontrada
                        </td>
                      </tr>
                    ) : (
                      filteredPeople?.map((person) => (
                        <tr key={person.id} className="border-b">
                          <td className="py-3 px-4">{person.name}</td>
                          <td className="py-3 px-4">{person.email || "-"}</td>
                          <td className="py-3 px-4">{person.whatsapp || "-"}</td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLinkPerson(person)}
                            >
                              Vincular
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar nova pessoa */}
      <AddPersonDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            onOpenChange(true); // Reabrir o dialog de vincular pessoa
          }
        }}
      />
    </>
  );
}
