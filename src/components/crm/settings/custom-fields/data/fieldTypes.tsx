import { 
  Type, AlignLeft, FileText, Paperclip, CheckSquare, 
  User, Calendar, Clock, Tag, Mail, Phone, List, 
  Radio, Timer, Hash, DollarSign, File, Fingerprint,
  Search, CreditCard, Link, MapPin, Building2
} from "lucide-react";
import { FieldTypeInfo } from "../types";

export const fieldTypes: FieldTypeInfo[] = [
  {
    id: "short_text",
    name: "Texto curto",
    description: "Para textos breves como títulos e nomes",
    icon: <Type className="w-4 h-4" />,
    category: "basic",
    validation: (value) => typeof value === "string" && value.length <= 255
  },
  {
    id: "long_text",
    name: "Texto longo",
    description: "Para descrições e notas detalhadas",
    icon: <AlignLeft className="w-4 h-4" />,
    category: "basic"
  },
  // Contato
  {
    id: "email",
    name: "Email",
    description: "Campo formatado para emails",
    icon: <Mail className="w-4 h-4" />,
    category: "contact",
    validation: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  },
  {
    id: "celular",
    name: "Celular",
    description: "Campo formatado para celular",
    icon: <Phone className="w-4 h-4" />,
    category: "contact",
    validation: (value) => {
      // Aceita formatos (99) 99999-9999 ou (99) 9999-9999
      const celularRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
      return celularRegex.test(value);
    },
    mask: (value) => {
      if (!value) return "";
      // Remove todos os caracteres não numéricos
      const numbers = value.replace(/\D/g, "");
      
      // Se tiver 11 dígitos (com 9 na frente)
      if (numbers.length === 11) {
        return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
      }
      
      // Se tiver 10 dígitos (formato antigo)
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
  },
  {
    id: "document",
    name: "Documento",
    description: "Campo formatado para CPF ou CNPJ",
    icon: <CreditCard className="w-4 h-4" />,
    category: "document",
    validation: (value) => {
      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
      const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
      return cpfRegex.test(value) || cnpjRegex.test(value);
    },
    mask: (value) => {
      if (!value) return "";
      // Remove todos os caracteres não numéricos
      const numbers = value.replace(/\D/g, "");
      
      // Aplica máscara de CPF se tiver 11 dígitos
      if (numbers.length <= 11) {
        return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      }
      
      // Aplica máscara de CNPJ se tiver mais de 11 dígitos
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
  },
  // Financeiro
  {
    id: "currency",
    name: "Moeda",
    description: "Valores monetários",
    icon: <DollarSign className="w-4 h-4" />,
    category: "financial",
    validation: (value) => !isNaN(parseFloat(value))
  },
  {
    id: "numeric",
    name: "Numérico",
    description: "Apenas números",
    icon: <Hash className="w-4 h-4" />,
    category: "financial",
    validation: (value) => /^\d+$/.test(value)
  },

  // Relacionamentos
  {
    id: "entity",
    name: "Entidade Relacionada",
    description: "Campo para relacionar com outra entidade",
    icon: <Link className="w-4 h-4" />,
    category: "relationship",
    validation: (value) => !!value
  },

  {
    id: "documents",
    name: "Documentos",
    description: "Gerenciamento de documentos",
    icon: <File className="w-4 h-4" />,
    category: "document"
  },
  {
    id: "attachment",
    name: "Anexo",
    description: "Para upload de arquivos",
    icon: <Paperclip className="w-4 h-4" />,
    category: "document"
  },
  // Datas
  {
    id: "date",
    name: "Data",
    description: "Selecionar uma data",
    icon: <Calendar className="w-4 h-4" />,
    category: "date"
  },
  {
    id: "datetime",
    name: "Data e hora",
    description: "Selecionar data e hora",
    icon: <Clock className="w-4 h-4" />,
    category: "date"
  },
  {
    id: "time",
    name: "Hora",
    description: "Selecionar horário",
    icon: <Timer className="w-4 h-4" />,
    category: "date"
  },
  // Outros
  {
    id: "checkbox",
    name: "Checkbox",
    description: "Para opções sim/não",
    icon: <CheckSquare className="w-4 h-4" />,
    category: "other"
  },
  {
    id: "list",
    name: "Lista",
    description: "Lista de opções múltiplas",
    icon: <List className="w-4 h-4" />,
    category: "other"
  },
  {
    id: "single_select",
    name: "Seleção Única",
    description: "Selecionar uma única opção",
    icon: <Radio className="w-4 h-4" />,
    category: "other"
  },
  {
    id: "user",
    name: "Usuário",
    description: "Selecionar um usuário do sistema",
    icon: <User className="w-4 h-4" />,
    category: "other"
  },
  // Campos de Endereço
  {
    id: "state_select",
    name: "Estado",
    description: "Campo de seleção de estado",
    icon: <MapPin className="w-4 h-4" />,
    category: "contact",
    validation: (value) => typeof value === "string" && value.length > 0
  },
  {
    id: "city_select",
    name: "Cidade",
    description: "Campo de seleção de cidade (requer campo de Estado)",
    icon: <Building2 className="w-4 h-4" />,
    category: "contact",
    validation: (value) => typeof value === "string" && value.length > 0,
    dependsOn: "state_select"
  },
  {
    id: "street",
    name: "Rua/Avenida",
    description: "Nome da rua ou avenida",
    icon: <MapPin className="w-4 h-4" />,
    category: "contact",
    validation: (value) => typeof value === "string" && value.length > 0
  },
  {
    id: "neighborhood",
    name: "Bairro",
    description: "Nome do bairro",
    icon: <MapPin className="w-4 h-4" />,
    category: "contact",
    validation: (value) => typeof value === "string" && value.length > 0
  },
  {
    id: "complement",
    name: "Complemento",
    description: "Complemento do endereço (opcional)",
    icon: <MapPin className="w-4 h-4" />,
    category: "contact"
  },
  {
    id: "number",
    name: "Número",
    description: "Número do endereço",
    icon: <MapPin className="w-4 h-4" />,
    category: "contact",
    validation: (value) => typeof value === "string" && value.length > 0
  },
  {
    id: "zip_code",
    name: "CEP",
    description: "Código postal",
    icon: <MapPin className="w-4 h-4" />,
    category: "contact",
    validation: (value) => /^\d{5}-?\d{3}$/.test(value.replace(/\D/g, '')),
    mask: (value) => value.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2')
  }
];

export const categoryNames: Record<string, string> = {
  basic: "Dados Básicos",
  contact: "Contato",
  financial: "Financeiro",
  document: "Documentos",
  date: "Datas",
  relationship: "Relacionamentos",
  other: "Outros"
};
