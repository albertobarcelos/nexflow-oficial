import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, Search, User, Handshake } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { createHistory } from "@/lib/history";
import { toast } from "sonner";

interface AddDealDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (data: { title: string; company_id?: string; person_id?: string; partner_id?: string; value?: number }) => Promise<string>;
  allowedEntities: string[];
}

type EntityType = "companies" | "people" | "partners";

const ENTITY_CONFIG = {
  companies: {
    label: "Empresa",
    icon: Building2,
    searchPlaceholder: "Buscar empresa...",
    table: "companies",
  },
  people: {
    label: "Pessoa",
    icon: User,
    searchPlaceholder: "Buscar pessoa...",
    table: "people",
  },
  partners: {
    label: "Parceiro",
    icon: Handshake,
    searchPlaceholder: "Buscar parceiro...",
    table: "partners",
  },
} as const;

export function AddDealDialog({ open, onClose, onAdd, allowedEntities }: AddDealDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<EntityType>(
    allowedEntities[0] as EntityType || "companies"
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar entidades
  const { data: entities = [] } = useQuery({
    queryKey: [selectedType, searchTerm],
    queryFn: async () => {
      const { data } = await supabase
        .from(selectedType)
        .select("id, name")
        .ilike("name", `%${searchTerm}%`)
        .limit(5);
      return data || [];
    },
  });

  const handleSubmit = async () => {
    if (!title || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const data: any = {
        title,
        value: value ? parseFloat(value) : undefined,
      };

      // Adicionar o ID da entidade selecionada com a chave correta
      if (selectedType === "companies") data.company_id = selectedId;
      if (selectedType === "people") data.person_id = selectedId;
      if (selectedType === "partners") data.partner_id = selectedId;

      // Criar o negócio e obter o ID
      const dealId = await onAdd(data);

      // Buscar nome da entidade
      let entityName = "";
      if (selectedId) {
        const { data: entityData } = await supabase
          .from(selectedType)
          .select("name")
          .eq("id", selectedId)
          .single();
        entityName = entityData?.name || "";
      }

      // Registrar no histórico
      await createHistory({
        dealId,
        type: "created",
        description: `Negócio "${title}" criado${entityName ? ` com ${ENTITY_CONFIG[selectedType].label} ${entityName}` : ""}`,
        details: {
          title,
          value: data.value,
          company_id: data.company_id,
          person_id: data.person_id,
          partner_id: data.partner_id,
          entity_type: selectedType,
          entity_id: selectedId,
          entity_name: entityName
        }
      });

      // Limpar formulário
      setSearchTerm("");
      setSelectedId(null);
      setTitle("");
      setValue("");
      onClose();
    } catch (error) {
      console.error("Erro ao criar negócio ou registrar histórico:", error);
      toast.error("Erro ao criar negócio. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Se houver apenas uma entidade permitida, não mostrar os botões de seleção
  const showEntitySelector = allowedEntities.length > 1;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Com quem você irá negociar?</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Seletor de Tipo - Só mostra se houver mais de uma opção */}
          {showEntitySelector && (
            <div className="flex gap-2">
              {allowedEntities.map((entityType) => {
                const config = ENTITY_CONFIG[entityType as EntityType];
                const Icon = config.icon;
                return (
                  <Button
                    key={entityType}
                    variant={selectedType === entityType ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => {
                      setSelectedType(entityType as EntityType);
                      setSelectedId(null);
                      setSearchTerm("");
                    }}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {config.label}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Campo de Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder={ENTITY_CONFIG[selectedType].searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Lista de Resultados */}
          <div className="space-y-2">
            {entities.map((entity) => (
              <div
                key={entity.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100",
                  selectedId === entity.id && "bg-primary/10"
                )}
                onClick={() => setSelectedId(entity.id)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10">
                    {entity.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{entity.name}</span>
              </div>
            ))}
          </div>

          {/* Campos do Negócio */}
          {selectedId && (
            <div className="space-y-4 pt-4">
              <div>
                <Input
                  placeholder="Nome do negócio"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Valor (opcional)"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              disabled={!selectedId || !title || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Criando..." : "Adicionar negócio"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
