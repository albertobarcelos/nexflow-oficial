import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEntityBuilder } from "@/contexts/EntityBuilderContext";
import { FieldType } from "@/types/entities";
import { 
  Database, 
  Building2, 
  Users, 
  Car, 
  Home, 
  Package, 
  ShoppingCart,
  Briefcase,
  GraduationCap,
  Heart
} from "lucide-react";

interface EntityTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  fields: Array<{
    name: string;
    type: FieldType;
    required: boolean;
  }>;
}

interface EntityTemplatesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const templates: EntityTemplate[] = [
  {
    id: "products",
    title: "Produtos",
    description: "Gerencie seu catálogo de produtos e serviços",
    icon: "package",
    color: "#10b981",
    category: "Vendas",
    fields: [
      { name: "Nome", type: "short_text", required: true },
      { name: "Código", type: "short_text", required: true },
      { name: "Preço", type: "currency", required: true },
      { name: "Categoria", type: "single_select", required: false },
      { name: "Descrição", type: "long_text", required: false }
    ]
  },
  {
    id: "properties",
    title: "Imóveis",
    description: "Controle seu portfólio de imóveis para venda ou locação",
    icon: "home",
    color: "#3b82f6",
    category: "Imobiliário",
    fields: [
      { name: "Endereço", type: "short_text", required: true },
      { name: "Tipo", type: "single_select", required: true },
      { name: "Valor", type: "currency", required: true },
      { name: "Área", type: "number", required: false },
      { name: "Quartos", type: "number", required: false }
    ]
  },
  {
    id: "vehicles",
    title: "Veículos",
    description: "Administre estoque de veículos para venda",
    icon: "car",
    color: "#f59e0b",
    category: "Automotivo",
    fields: [
      { name: "Modelo", type: "short_text", required: true },
      { name: "Marca", type: "single_select", required: true },
      { name: "Ano", type: "number", required: true },
      { name: "Preço", type: "currency", required: true },
      { name: "KM", type: "number", required: false }
    ]
  },
  {
    id: "courses",
    title: "Cursos",
    description: "Gerencie cursos e programas educacionais",
    icon: "graduation-cap",
    color: "#8b5cf6",
    category: "Educação",
    fields: [
      { name: "Nome do Curso", type: "short_text", required: true },
      { name: "Duração", type: "short_text", required: true },
      { name: "Valor", type: "currency", required: true },
      { name: "Modalidade", type: "single_select", required: false },
      { name: "Descrição", type: "long_text", required: false }
    ]
  },
  {
    id: "services",
    title: "Serviços",
    description: "Organize seus serviços e consultorias",
    icon: "briefcase",
    color: "#ef4444",
    category: "Serviços",
    fields: [
      { name: "Nome do Serviço", type: "short_text", required: true },
      { name: "Categoria", type: "single_select", required: false },
      { name: "Valor", type: "currency", required: true },
      { name: "Duração", type: "short_text", required: false },
      { name: "Descrição", type: "long_text", required: false }
    ]
  },
  {
    id: "patients",
    title: "Pacientes",
    description: "Gerencie informações de pacientes (área da saúde)",
    icon: "heart",
    color: "#ec4899",
    category: "Saúde",
    fields: [
      { name: "Nome", type: "short_text", required: true },
      { name: "CPF", type: "short_text", required: true },
      { name: "Data de Nascimento", type: "date", required: true },
      { name: "Telefone", type: "phone", required: true },
      { name: "Convênio", type: "single_select", required: false }
    ]
  }
];

const iconMap = {
  "package": Package,
  "home": Home,
  "car": Car,
  "graduation-cap": GraduationCap,
  "briefcase": Briefcase,
  "heart": Heart,
  "database": Database,
  "building2": Building2,
  "users": Users,
  "shopping-cart": ShoppingCart
};

export function EntityTemplates({ open, onOpenChange }: EntityTemplatesProps) {
  const [showCreateEntity, setShowCreateEntity] = useState(false);
  const [entityName, setEntityName] = useState("");
  const [entityDescription, setEntityDescription] = useState("");
  const navigate = useNavigate();
  const { 
    setName, 
    setDescription, 
    setIcon, 
    setColor, 
    setFields, 
    resetEntity 
  } = useEntityBuilder();

  const handleCreateEntity = () => {
    if (entityName.trim()) {
      resetEntity();
      setName(entityName.trim());
      setDescription(entityDescription.trim());
      setEntityName("");
      setEntityDescription("");
      setShowCreateEntity(false);
      onOpenChange(false);
      navigate("/crm/entity/new/settings");
    }
  };

  const handleSelectTemplate = (template: EntityTemplate) => {
    try {
      console.log('Template selecionado:', template);
      console.log('Contexto disponível:', { setName, setDescription, setIcon, setColor, setFields, resetEntity });
      
      // Reset primeiro
      resetEntity();
      
      // Aplicar dados do template
      setName(template.title);
      setDescription(template.description);
      setIcon(template.icon);
      setColor(template.color);
      
      // Converter campos do template para o formato do EntityBuilder
      const templateFields = template.fields.map((field, index) => ({
        name: field.name,
        slug: field.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, ''),
        field_type: field.type,
        description: `Campo ${field.name}`,
        is_required: field.required,
        is_unique: false,
        options: [],
        validation_rules: {},
        default_value: null,
        layout_config: { width: 'full' as const, column: 1 }
      }));
      
      console.log('Campos convertidos:', templateFields);
      setFields(templateFields);
      
      console.log('Fechando modal e navegando...');
      
      // Fechar modal e navegar
      onOpenChange(false);
      
      // Aguardar um pouco antes de navegar
      setTimeout(() => {
        navigate("/crm/entity/new/settings");
      }, 100);
      
    } catch (error) {
      console.error('Erro ao selecionar template:', error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Templates de Bases de Dados</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Templates por categoria */}
            {["Vendas", "Imobiliário", "Automotivo", "Educação", "Serviços", "Saúde"].map(category => {
              const categoryTemplates = templates.filter(t => t.category === category);
              if (categoryTemplates.length === 0) return null;
              
              return (
                <div key={category}>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">{category}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categoryTemplates.map((template) => {
                      const IconComponent = iconMap[template.icon as keyof typeof iconMap] || Database;
                      
                      return (
                        <div
                          key={template.id}
                          onClick={() => {
                            console.log('Clique detectado no template:', template.id);
                            handleSelectTemplate(template);
                          }}
                          className="group relative overflow-hidden rounded-lg border bg-white hover:border-orange-500 cursor-pointer transition-all hover:shadow-md p-4"
                        >
                          <div className="flex items-start space-x-3">
                            <div 
                              className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${template.color}15` }}
                            >
                              <IconComponent 
                                className="w-5 h-5" 
                                style={{ color: template.color }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-gray-900 group-hover:text-orange-600">
                                {template.title}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {template.description}
                              </p>
                              <div className="mt-2">
                                <span className="text-xs text-gray-400">
                                  {template.fields.length} campos
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-orange-500 text-white hover:bg-blue-950 hover:text-white"
              variant="ghost"
              onClick={() => {
                setShowCreateEntity(true);
                onOpenChange(false);
              }}
            >
              Criar do Zero
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateEntity} onOpenChange={setShowCreateEntity}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Criar Nova Base de Dados</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Base</Label>
              <Input
                id="name"
                placeholder="Ex: Produtos, Imóveis, Clientes..."
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Descreva o que será armazenado nesta base..."
                value={entityDescription}
                onChange={(e) => setEntityDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateEntity(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateEntity}
              disabled={!entityName.trim()}
            >
              Criar Base
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 