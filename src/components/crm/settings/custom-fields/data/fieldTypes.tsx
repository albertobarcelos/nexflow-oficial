import { 
  Type, AlignLeft, FileText, Paperclip, CheckSquare, 
  User, Calendar, Clock, Tag, Mail, Phone, List, 
  Radio, Timer, Hash, DollarSign, File, Fingerprint,
  Search, CreditCard
} from "lucide-react";
import { FieldTypeInfo } from "../types";

export const fieldTypes: FieldTypeInfo[] = [
  // Dados Básicos
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
    validation: (value) => /^\(\d{2}\)\s\d{5}-\d{4}$/.test(value),
    mask: "(99) 99999-9999"
  },
  {
    id: "cpf",
    name: "CPF",
    description: "Campo formatado para CPF",
    icon: <CreditCard className="w-4 h-4" />,
    category: "document",
    validation: (value) => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value),
    mask: "999.999.999-99"
  },
  {
    id: "cnpj",
    name: "CNPJ",
    description: "Campo formatado para CNPJ",
    icon: <CreditCard className="w-4 h-4" />,
    category: "document",
    validation: (value) => /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(value),
    mask: "99.999.999/9999-99"
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
  // Documentos
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
  }
];

export const categoryNames: Record<string, string> = {
  basic: "Dados Básicos",
  contact: "Contato",
  financial: "Financeiro",
  document: "Documentos",
  date: "Datas",
  other: "Outros"
};