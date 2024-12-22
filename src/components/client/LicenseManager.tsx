import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { License } from "@/types/database";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, Users } from "lucide-react";

interface LicenseManagerProps {
  clientId: string;
  currentPlan: "free" | "premium";
}

export function LicenseManager({ clientId, currentPlan }: LicenseManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState("");
  const [newCollaboratorName, setNewCollaboratorName] = useState("");
  const [newCollaboratorRole, setNewCollaboratorRole] = useState<string>("closer");
  const { toast } = useToast();

  const { data: license, refetch: refetchLicense } = useQuery({
    queryKey: ['license', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: collaborators, refetch: refetchCollaborators } = useQuery({
    queryKey: ['collaborators', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collaborators')
        .select('*')
        .eq('client_id', clientId);

      if (error) throw error;
      return data;
    },
  });

  const createLicense = async () => {
    setIsCreating(true);
    try {
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);

      const { error } = await supabase
        .from('licenses')
        .insert({
          client_id: clientId,
          type: currentPlan,
          expiration_date: expirationDate.toISOString(),
          status: 'active',
        } as License);

      if (error) throw error;

      toast({
        title: "Licença criada",
        description: "A licença foi criada com sucesso.",
      });
      
      refetchLicense();
    } catch (error) {
      console.error('Error creating license:', error);
      toast({
        title: "Erro ao criar licença",
        description: "Ocorreu um erro ao criar a licença.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const addCollaborator = async () => {
    if (!newCollaboratorEmail || !newCollaboratorName || !newCollaboratorRole) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para adicionar um colaborador.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('collaborators')
        .insert({
          client_id: clientId,
          name: newCollaboratorName,
          email: newCollaboratorEmail,
          role: newCollaboratorRole,
          permissions: []
        });

      if (error) throw error;

      toast({
        title: "Colaborador adicionado",
        description: "O colaborador foi adicionado com sucesso.",
      });

      setNewCollaboratorEmail("");
      setNewCollaboratorName("");
      setNewCollaboratorRole("closer");
      setIsAddingCollaborator(false);
      refetchCollaborators();
    } catch (error) {
      console.error('Error adding collaborator:', error);
      toast({
        title: "Erro ao adicionar colaborador",
        description: "Ocorreu um erro ao adicionar o colaborador.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Gerenciamento de Licença</h3>
        {!license && (
          <Button
            onClick={createLicense}
            disabled={isCreating}
          >
            {isCreating ? "Criando..." : "Criar Nova Licença"}
          </Button>
        )}
      </div>

      {license && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Status: {license.status}</p>
              <p className="text-sm text-muted-foreground">
                Expira em: {new Date(license.expiration_date).toLocaleDateString()}
              </p>
            </div>
            <Dialog open={isAddingCollaborator} onOpenChange={setIsAddingCollaborator}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Colaborador
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Colaborador</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={newCollaboratorName}
                      onChange={(e) => setNewCollaboratorName(e.target.value)}
                      placeholder="Nome do colaborador"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newCollaboratorEmail}
                      onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Função</Label>
                    <Select
                      value={newCollaboratorRole}
                      onValueChange={setNewCollaboratorRole}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="closer">Closer</SelectItem>
                        <SelectItem value="partnership_director">Diretor de Parcerias</SelectItem>
                        <SelectItem value="partner">Parceiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={addCollaborator}>
                    Adicionar Colaborador
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-md border">
            <div className="flex items-center p-4 border-b">
              <Users className="mr-2 h-4 w-4" />
              <h4 className="font-medium">Colaboradores</h4>
            </div>
            <div className="divide-y">
              {collaborators?.map((collaborator) => (
                <div key={collaborator.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{collaborator.name}</p>
                    <p className="text-sm text-muted-foreground">{collaborator.email}</p>
                  </div>
                  <span className="text-sm bg-muted px-2 py-1 rounded-full">
                    {collaborator.role === 'closer' && 'Closer'}
                    {collaborator.role === 'partnership_director' && 'Diretor de Parcerias'}
                    {collaborator.role === 'partner' && 'Parceiro'}
                  </span>
                </div>
              ))}
              {(!collaborators || collaborators.length === 0) && (
                <p className="p-4 text-sm text-muted-foreground">
                  Nenhum colaborador cadastrado
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}