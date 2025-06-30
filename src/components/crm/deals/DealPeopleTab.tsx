import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  X, 
  Phone, 
  Mail, 
  MessageSquare,
  Building2,
  UserCircle2,
  AlertCircle
} from "lucide-react";
import { usePeopleAndPartners } from "@/hooks/usePeopleAndPartners";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DealPeopleTabProps {
  deal: Deal;
}

export function DealPeopleTab({ deal }: DealPeopleTabProps) {
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [newPerson, setNewPerson] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    type: "contact" // contact, decision_maker, influencer
  });

  const {
    people,
    isLoadingPeople,
    addPerson,
    removePerson
  } = usePeopleAndPartners(deal.id);

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPerson.name.trim()) {
      toast.error("O nome é obrigatório");
      return;
    }

    try {
      await addPerson.mutateAsync({
        name: newPerson.name,
        email: newPerson.email,
        telefone: newPerson.phone,
        cargo: newPerson.role
      });
      setNewPerson({
        name: "",
        email: "",
        phone: "",
        role: "",
        type: "contact"
      });
      setIsAddingPerson(false);
      toast.success("Pessoa adicionada com sucesso!");
    } catch (error) {
      toast.error("Erro ao adicionar pessoa");
    }
  };

  const handleRemovePerson = async (personId: string, personName: string) => {
    if (!window.confirm(`Tem certeza que deseja remover ${personName}?`)) return;

    try {
      await removePerson.mutateAsync(personId);
      toast.success("Pessoa removida com sucesso!");
    } catch (error) {
      toast.error("Erro ao remover pessoa");
    }
  };

  const handleWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone.replace(/\D/g, '')}`, '_blank');
  };

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  if (isLoadingPeople) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-800">Pessoas</h3>
          <p className="text-sm text-gray-500">
            Gerencie os contatos envolvidos nesta oportunidade
          </p>
        </div>
        <Dialog open={isAddingPerson} onOpenChange={setIsAddingPerson}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Pessoa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Pessoa</DialogTitle>
              <DialogDescription>
                Preencha os dados da pessoa que você deseja adicionar a esta oportunidade.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddPerson} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  placeholder="Nome completo"
                  value={newPerson.name}
                  onChange={(e) => setNewPerson(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newPerson.email}
                  onChange={(e) => setNewPerson(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  value={newPerson.phone}
                  onChange={(e) => setNewPerson(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Cargo</Label>
                <Input
                  id="role"
                  placeholder="Ex: Diretor Comercial"
                  value={newPerson.role}
                  onChange={(e) => setNewPerson(prev => ({ ...prev, role: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Contato</Label>
                <Select
                  value={newPerson.type}
                  onValueChange={(value) => setNewPerson(prev => ({ ...prev, type: value }))}
                >
                  <option value="contact">Contato</option>
                  <option value="decision_maker">Decisor</option>
                  <option value="influencer">Influenciador</option>
                </Select>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddingPerson(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Adicionar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Pessoas */}
      <ScrollArea className="h-[calc(100vh-15rem)]">
        <div className="space-y-4">
          {people?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserCircle2 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Nenhuma pessoa adicionada ainda</p>
              <Button
                variant="link"
                onClick={() => setIsAddingPerson(true)}
                className="mt-2"
              >
                Clique aqui para adicionar
              </Button>
            </div>
          ) : (
            people?.map((person: any) => (
              <div
                key={person.id}
                className={cn(
                  "group p-4 rounded-lg border transition-all",
                  person.type === "decision_maker" 
                    ? "border-primary/20 bg-primary/5"
                    : person.type === "influencer"
                    ? "border-orange-200 bg-orange-50"
                    : "border-gray-100 hover:border-gray-200"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-800">{person.name}</h4>
                      {person.type === "decision_maker" && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Decisor
                        </span>
                      )}
                      {person.type === "influencer" && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                          Influenciador
                        </span>
                      )}
                    </div>
                    
                    {person.role && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {person.role}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      {person.email && (
                        <button
                          onClick={() => handleEmail(person.email)}
                          className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
                        >
                          <Mail className="h-4 w-4" />
                          {person.email}
                        </button>
                      )}
                      {person.phone && (
                        <button
                          onClick={() => handleCall(person.phone)}
                          className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
                        >
                          <Phone className="h-4 w-4" />
                          {person.phone}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {person.phone && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
                          onClick={() => handleWhatsApp(person.phone)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => handleCall(person.phone)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {person.email && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-gray-100"
                        onClick={() => handleEmail(person.email)}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleRemovePerson(person.id, person.name)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
