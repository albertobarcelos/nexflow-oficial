import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Check, ChevronsUpDown, Plus, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { PartnerAvatar } from "./PartnerAvatar";
import { toast } from "sonner";

interface Partner {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar_type?: string;
  avatar_seed?: string;
  custom_avatar_url?: string;
}

interface PartnerSelectProps {
  value?: string;
  onChange: (value: string | null) => void;
}

export function PartnerSelect({ value, onChange }: PartnerSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newPartner, setNewPartner] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const queryClient = useQueryClient();

  const { data: partners = [] } = useQuery<Partner[]>({
    queryKey: ["partners", search],
    queryFn: async () => {
      const query = supabase
        .from("partners")
        .select("*")
        .order("name");

      if (search) {
        query.ilike("name", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const createPartner = useMutation({
    mutationFn: async (partner: Omit<Partner, "id">) => {
      // Primeiro buscar o client_id do negócio
      const { data: deal, error: dealError } = await supabase
        .from("deals")
        .select("client_id")
        .eq("id", value)
        .single();

      if (dealError) throw dealError;

      const { data, error } = await supabase
        .from("partners")
        .insert([{ 
          ...partner,
          client_id: deal.client_id,
          avatar_type: "personas",
          avatar_seed: partner.name.toLowerCase().replace(/[^a-z0-9]/g, "")
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["partners"]);
      onChange(data.id);
      setIsCreating(false);
      toast.success("Parceiro criado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao criar parceiro");
    }
  });

  const selectedPartner = partners.find(p => p.id === value);

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartner.name.trim()) return;
    await createPartner.mutateAsync(newPartner);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-white hover:bg-gray-50"
          >
            {selectedPartner ? (
              <div className="flex items-center gap-2">
                <PartnerAvatar partner={selectedPartner} size="sm" />
                <span>{selectedPartner.name}</span>
              </div>
            ) : (
              "Selecionar parceiro..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command className="bg-white">
            <CommandInput 
              placeholder="Buscar parceiro..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandEmpty className="py-4 text-center">
              <p className="text-sm text-gray-500 mb-2">Nenhum parceiro encontrado</p>
              <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Novo Parceiro
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Parceiro</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreatePartner} className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium">Nome</label>
                      <Input
                        value={newPartner.name}
                        onChange={(e) => setNewPartner(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nome do parceiro"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        type="email"
                        value={newPartner.email}
                        onChange={(e) => setNewPartner(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@exemplo.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Telefone</label>
                      <Input
                        value={newPartner.phone}
                        onChange={(e) => setNewPartner(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(00) 00000-0000"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        Criar Parceiro
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CommandEmpty>
            <CommandGroup>
              {partners.map((partner) => (
                <CommandItem
                  key={partner.id}
                  value={partner.id}
                  onSelect={() => {
                    onChange(partner.id);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <PartnerAvatar partner={partner} size="sm" />
                    <div>
                      <span className="font-medium">{partner.name}</span>
                      {(partner.email || partner.phone) && (
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-0.5">
                          {partner.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {partner.email}
                            </div>
                          )}
                          {partner.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {partner.phone}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === partner.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <div className="p-2">
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Novo Parceiro
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
} 
