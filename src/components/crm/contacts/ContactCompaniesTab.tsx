import { useState } from "react";
import { useContactCompanies } from "@/hooks/useContactCompanies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Building2, Loader2 } from "lucide-react";
import { CompanySelect } from "@/components/ui/company-select";
import { toast } from "sonner";
import { nexflowClient, getCurrentClientId } from "@/lib/supabase";

interface ContactCompaniesTabProps {
  contactId: string | null;
}

export function ContactCompaniesTab({ contactId }: ContactCompaniesTabProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [newCompanyName, setNewCompanyName] = useState<string>("");

  const {
    companyNames,
    isLoading,
    addCompany,
    removeCompany,
    isLinking,
    isUnlinking,
  } = useContactCompanies(contactId);

  const handleAddCompany = async () => {
    if (selectedCompanyId) {
      // Se selecionou uma empresa do select, buscar o nome
      try {
        const clientId = await getCurrentClientId();
        if (!clientId) {
          toast.error("Não foi possível identificar o tenant atual.");
          return;
        }

        const { data, error } = await nexflowClient()
          .from("web_companies" as any)
          .select("name")
          .eq("id", selectedCompanyId)
          .eq("client_id", clientId)
          .single();

        if (error || !data) {
          toast.error("Erro ao buscar empresa selecionada");
          return;
        }

        const companyData = (data as any) || null;
        const companyName = (companyData as any)?.name || "";
        if (!companyName) {
          toast.error("Nome da empresa não encontrado");
          return;
        }

        await addCompany(companyName);
        setIsAddDialogOpen(false);
        setSelectedCompanyId("");
      } catch (error) {
        console.error("Erro ao adicionar empresa:", error);
      }
    } else if (newCompanyName.trim()) {
      // Se digitou um nome manualmente
      try {
        await addCompany(newCompanyName.trim());
        setIsAddDialogOpen(false);
        setNewCompanyName("");
      } catch (error) {
        console.error("Erro ao adicionar empresa:", error);
      }
    } else {
      toast.error("Selecione uma empresa ou digite um nome");
    }
  };

  const handleRemoveCompany = async (companyName: string) => {
    if (!confirm(`Tem certeza que deseja remover a empresa "${companyName}"?`)) {
      return;
    }

    try {
      await removeCompany(companyName);
    } catch (error) {
      console.error("Erro ao remover empresa:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Empresas</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as empresas associadas a este contato
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Empresa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Empresa</DialogTitle>
              <DialogDescription>
                Selecione uma empresa cadastrada ou digite um nome manualmente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="company">Empresa Cadastrada (opcional)</Label>
                <CompanySelect
                  value={selectedCompanyId}
                  onChange={(value) => {
                    setSelectedCompanyId(value);
                    setNewCompanyName(""); // Limpar campo manual quando selecionar
                  }}
                />
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Ou</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-name">Nome da Empresa</Label>
                <Input
                  id="company-name"
                  value={newCompanyName}
                  onChange={(e) => {
                    setNewCompanyName(e.target.value);
                    setSelectedCompanyId(""); // Limpar select quando digitar
                  }}
                  placeholder="Digite o nome da empresa"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setSelectedCompanyId("");
                    setNewCompanyName("");
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAddCompany} 
                  disabled={isLinking || (!selectedCompanyId && !newCompanyName.trim())}
                >
                  {isLinking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    "Adicionar"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {companyNames.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            Nenhuma empresa associada a este contato
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome da Empresa</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companyNames.map((companyName, index) => (
              <TableRow key={`${companyName}-${index}`}>
                <TableCell className="font-medium">
                  {companyName}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCompany(companyName)}
                    disabled={isUnlinking}
                  >
                    {isUnlinking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

