import React, { createContext, useContext, useState, ReactNode } from 'react';
import { EntityField, FieldType } from '@/types/entities';

// Tipagem do campo em construção
interface FieldBuilder {
  name: string;
  slug: string;
  field_type: FieldType;
  description: string;
  is_required: boolean;
  is_unique: boolean;
  options: string[];
  validation_rules: Record<string, any>;
  default_value: any;
  layout_config: {
    width: 'quarter' | 'half' | 'three_quarters' | 'full';
    column: number;
  };
}

// Tipagem do estado e das ações do contexto
interface EntityBuilderState {
  name: string;
  setName: (name: string) => void;
  slug: string;
  setSlug: (slug: string) => void;
  description: string;
  setDescription: (description: string) => void;
  icon: string;
  setIcon: (icon: string) => void;
  color: string;
  setColor: (color: string) => void;
  fields: FieldBuilder[];
  setFields: (fields: FieldBuilder[]) => void;
  addField: (field: FieldBuilder) => void;
  updateField: (index: number, field: FieldBuilder) => void;
  removeField: (index: number) => void;
  resetEntity: () => void;
}

// Criar o contexto com um valor padrão undefined para checagem
const EntityBuilderContext = createContext<EntityBuilderState | undefined>(undefined);

// Função para gerar slug automaticamente
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '_') // Substitui espaços por underscore
    .replace(/_+/g, '_') // Remove underscores duplicados
    .replace(/^_|_$/g, ''); // Remove underscores do início e fim
};

// Campos padrão para novas entidades
const getDefaultFields = (): FieldBuilder[] => [
  {
    name: 'Nome',
    slug: 'name',
    field_type: 'short_text',
    description: 'Nome principal do registro',
    is_required: true,
    is_unique: false,
    options: [],
    validation_rules: { max: 255 },
    default_value: null,
    layout_config: { width: 'full', column: 1 }
  },
  {
    name: 'Descrição',
    slug: 'description',
    field_type: 'long_text',
    description: 'Descrição detalhada do registro',
    is_required: false,
    is_unique: false,
    options: [],
    validation_rules: { max: 1000 },
    default_value: null,
    layout_config: { width: 'full', column: 1 }
  }
];

// Provedor do contexto
export const EntityBuilderProvider = ({ children }: { children: ReactNode }) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('database');
  const [color, setColor] = useState('#6366f1');
  const [fields, setFields] = useState<FieldBuilder[]>(getDefaultFields());

  // Atualizar slug automaticamente quando o nome muda
  const handleSetName = (newName: string) => {
    setName(newName);
    if (newName.trim()) {
      setSlug(generateSlug(newName));
    } else {
      setSlug('');
    }
  };

  const addField = (field: FieldBuilder) => {
    setFields(prev => [...prev, field]);
  };

  const updateField = (index: number, field: FieldBuilder) => {
    setFields(prev => prev.map((f, i) => i === index ? field : f));
  };

  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
  };

  const resetEntity = () => {
    setName('');
    setSlug('');
    setDescription('');
    setIcon('database');
    setColor('#6366f1');
    setFields(getDefaultFields());
  };

  return (
    <EntityBuilderContext.Provider value={{
      name,
      setName: handleSetName,
      slug,
      setSlug,
      description,
      setDescription,
      icon,
      setIcon,
      color,
      setColor,
      fields,
      setFields,
      addField,
      updateField,
      removeField,
      resetEntity
    }}>
      {children}
    </EntityBuilderContext.Provider>
  );
};

// Hook customizado para usar o contexto
export const useEntityBuilder = () => {
  const context = useContext(EntityBuilderContext);
  if (context === undefined) {
    throw new Error('useEntityBuilder must be used within an EntityBuilderProvider');
  }
  return context;
};

// Tipos exportados
export type { FieldBuilder }; 