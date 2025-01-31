import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Person } from "@/types/person";
import { Mail, Phone, User, MoreHorizontal, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePeople } from "@/hooks/usePeople";
import { useLocation } from "@/hooks/useLocation";
import { useEffect, useState } from "react";
import { useCompanies } from "@/features/companies/hooks/useCompanies";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface PersonPopupProps {
  person: Person;
  open: boolean;
  onClose: () => void;
}

export function PersonPopup({ person, open, onClose }: PersonPopupProps) {
  const navigate = useNavigate();
  const { getStateName, getCityName } = useLocation();
  const { deletePerson } = usePeople();
  const { companies } = useCompanies();
  const [stateName, setStateName] = useState("-");
  const [cityName, setCityName] = useState("-");

  useEffect(() => {
    // Carregar nome do estado
    if (person?.estado) {
      setStateName(getStateName(person.estado));
    }

    // Carregar nome da cidade
    if (person?.cidade) {
      getCityName(person.cidade).then(name => setCityName(name));
    }
  }, [person?.estado, person?.cidade]);

  const handleEdit = () => {
    onClose();
    navigate(`/crm/people/${person.id}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja remover esta pessoa?")) return;

    try {
      await deletePerson(person.id);
      toast.success("Pessoa removida com sucesso!");
      onClose();
    } catch (error) {
      console.error("Erro ao remover pessoa:", error);
      toast.error("Erro ao remover pessoa");
    }
  };

  // Encontrar a empresa vinculada
  const company = companies?.find(c => c.id === person.company_id);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[600px]">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-2xl">{person.name}</SheetTitle>
                <SheetDescription>{person.cargo || "Sem cargo definido"}</SheetDescription>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  Remover
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Informações Básicas</h3>
            <div className="grid gap-2 text-sm">
              <div>
                <span className="font-medium">CPF:</span> {person.cpf || "-"}
              </div>
              <div>
                <span className="font-medium">Cargo:</span> {person.cargo || "-"}
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{company?.name || "-"}</span>
              </div>
              <div>
                <span className="font-medium">Descrição:</span> {person.description || "-"}
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Contato</h3>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {person.email || "-"}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {person.whatsapp || "-"}
              </div>
              <div>
                <span className="font-medium">Celular:</span> {person.celular || "-"}
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Endereço</h3>
            <div className="grid gap-2 text-sm">
              <div>
                {person.rua && person.numero ? (
                  <>
                    {person.rua}, {person.numero}
                    {person.complemento && ` - ${person.complemento}`}
                  </>
                ) : "-"}
              </div>
              <div>
                {person.bairro ? (
                  <>
                    {person.bairro} - {cityName}, {stateName}
                  </>
                ) : "-"}
              </div>
              <div>
                <span className="font-medium">CEP:</span> {person.cep || "-"}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 