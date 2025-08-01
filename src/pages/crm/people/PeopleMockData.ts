import { Person } from "@/types/person";

export const PeopleMockData: Person[] = [
  {
    id: "1",
    name: "João Silva",
    email: "joao@email.com",
    cpf: "123.456.789-00",
    whatsapp: "(11) 99999-1111",
    description: "Responsável comercial",
    person_type: "contato",
    cargo: "Gerente",
    company_name: "Empresa Alpha",
  },
  {
    id: "2",
    name: "Maria Oliveira",
    email: "maria@email.com",
    cpf: "987.654.321-00",
    whatsapp: "(21) 98888-2222",
    description: "Parceira estratégica",
    person_type: "parceiro",
    cargo: "Diretora",
    company_name: "Beta Solutions",
  },
  {
    id: "3",
    name: "Carlos Souza",
    email: "carlos@email.com",
    cpf: "111.222.333-44",
    whatsapp: "(31) 97777-3333",
    description: "Consultor externo",
    person_type: "consultor",
    cargo: "Consultor",
    company_name: "Consultoria XYZ",
  },
  {
    id: "4",
    name: "Ana Paula Lima",
    email: "ana@email.com",
    cpf: "555.666.777-88",
    whatsapp: "(41) 96666-4444",
    description: "Contato principal",
    person_type: "contato_principal",
    cargo: "Analista",
    company_name: "Empresa Gamma",
  },
  {
    id: "5",
    name: "Bruno Costa",
    email: "bruno@email.com",
    cpf: "999.888.777-66",
    whatsapp: "(51) 95555-5555",
    description: "Contato secundário",
    person_type: "contato_secundario",
    cargo: "Assistente",
    company_name: "Delta Corp",
  },
];
