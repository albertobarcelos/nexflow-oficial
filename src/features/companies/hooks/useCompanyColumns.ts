import { useState, useEffect } from 'react';

// AIDEV-NOTE: Hook para gerenciar configurações de colunas da tabela de empresas
// Permite mostrar/ocultar colunas e reordená-las com persistência no localStorage

export interface CompanyColumn {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  width?: string;
  align?: 'left' | 'center' | 'right';
  type?: 'text' | 'email' | 'phone' | 'url' | 'date' | 'status' | 'address';
}

// Alias para compatibilidade
export type ColumnConfig = CompanyColumn;

// Definição de todas as colunas disponíveis baseadas no schema do banco
export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'name', label: 'Nome', visible: true, order: 1, width: '200px', align: 'left', type: 'text' },
  { id: 'cnpj', label: 'CNPJ', visible: true, order: 2, width: '150px', align: 'center', type: 'text' },
  { id: 'razao_social', label: 'Razão Social', visible: false, order: 3, width: '200px', align: 'left', type: 'text' },
  { id: 'email', label: 'Email', visible: true, order: 4, width: '180px', align: 'center', type: 'email' },
  { id: 'phone', label: 'Telefone', visible: false, order: 5, width: '130px', align: 'center', type: 'phone' },
  { id: 'whatsapp', label: 'WhatsApp', visible: false, order: 6, width: '130px', align: 'center', type: 'phone' },
  { id: 'telefone', label: 'Telefone Fixo', visible: false, order: 7, width: '130px', align: 'center', type: 'phone' },
  { id: 'celular', label: 'Celular', visible: false, order: 8, width: '130px', align: 'center', type: 'phone' },
  { id: 'website', label: 'Website', visible: false, order: 9, width: '150px', align: 'center', type: 'url' },
  { id: 'company_type', label: 'Tipo', visible: false, order: 10, width: '120px', align: 'center', type: 'text' },
  { id: 'segment', label: 'Segmento', visible: false, order: 11, width: '150px', align: 'left', type: 'text' },
  { id: 'size', label: 'Porte', visible: false, order: 12, width: '100px', align: 'center', type: 'text' },
  { id: 'categoria', label: 'Categoria', visible: false, order: 13, width: '130px', align: 'left', type: 'text' },
  { id: 'origem', label: 'Origem', visible: false, order: 14, width: '120px', align: 'left', type: 'text' },
  { id: 'setor', label: 'Setor', visible: false, order: 15, width: '130px', align: 'left', type: 'text' },
  { id: 'description', label: 'Descrição', visible: false, order: 16, width: '200px', align: 'left', type: 'text' },
  { id: 'address', label: 'Endereço', visible: true, order: 17, width: '250px', align: 'left', type: 'address' },
  { id: 'cep', label: 'CEP', visible: false, order: 18, width: '100px', align: 'center', type: 'text' },
  { id: 'rua', label: 'Rua', visible: false, order: 19, width: '180px', align: 'left', type: 'text' },
  { id: 'numero', label: 'Número', visible: false, order: 20, width: '80px', align: 'center', type: 'text' },
  { id: 'bairro', label: 'Bairro', visible: false, order: 21, width: '130px', align: 'left', type: 'text' },
  { id: 'complemento', label: 'Complemento', visible: false, order: 22, width: '150px', align: 'left', type: 'text' },
  { id: 'cidade', label: 'Cidade', visible: true, order: 23, width: '130px', align: 'left', type: 'text' },
  { id: 'estado', label: 'Estado', visible: true, order: 24, width: '100px', align: 'left', type: 'text' },
  { id: 'pais', label: 'País', visible: false, order: 25, width: '100px', align: 'left', type: 'text' },
  { id: 'facebook', label: 'Facebook', visible: false, order: 26, width: '120px', align: 'center', type: 'url' },
  { id: 'twitter', label: 'Twitter', visible: false, order: 27, width: '120px', align: 'center', type: 'url' },
  { id: 'linkedin', label: 'LinkedIn', visible: false, order: 28, width: '120px', align: 'center', type: 'url' },
  { id: 'instagram', label: 'Instagram', visible: false, order: 29, width: '120px', align: 'center', type: 'url' },
  { id: 'skype', label: 'Skype', visible: false, order: 30, width: '120px', align: 'center', type: 'text' },
  { id: 'created_at', label: 'Data Criação', visible: false, order: 31, width: '130px', align: 'center', type: 'date' },
  { id: 'updated_at', label: 'Última Atualização', visible: false, order: 32, width: '150px', align: 'center', type: 'date' },
];

const STORAGE_KEY = 'nexflow-company-columns-config';

export function useCompanyColumns() {
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);

  // Carregar configurações do localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const savedColumns = JSON.parse(saved);
        // Mesclar com colunas padrão para garantir que novas colunas sejam incluídas
        const mergedColumns = DEFAULT_COLUMNS.map(defaultCol => {
          const savedCol = savedColumns.find((col: ColumnConfig) => col.id === defaultCol.id);
          return savedCol ? { ...defaultCol, ...savedCol } : defaultCol;
        });
        setColumns(mergedColumns);
      } catch (error) {
        console.error('Erro ao carregar configurações de colunas:', error);
      }
    }
  }, []);

  // Salvar configurações no localStorage
  const saveColumns = (newColumns: ColumnConfig[]) => {
    setColumns(newColumns);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newColumns));
  };

  // Atualizar uma coluna específica (para redimensionamento)
  const updateColumn = (columnId: string, updates: Partial<ColumnConfig>) => {
    const newColumns = columns.map(col =>
      col.id === columnId ? { ...col, ...updates } : col
    );
    saveColumns(newColumns);
  };

  // Alternar visibilidade de uma coluna
  const toggleColumnVisibility = (id: string) => {
    const newColumns = columns.map(col =>
      col.id === id ? { ...col, visible: !col.visible } : col
    );
    saveColumns(newColumns);
  };

  // Reordenar colunas
  const reorderColumns = (newOrder: ColumnConfig[]) => {
    const reorderedColumns = newOrder.map((col, index) => ({
      ...col,
      order: index + 1
    }));
    saveColumns(reorderedColumns);
  };

  // Resetar para configuração padrão
  const resetToDefault = () => {
    saveColumns(DEFAULT_COLUMNS);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Obter colunas visíveis ordenadas
  const visibleColumns = columns
    .filter(col => col.visible)
    .sort((a, b) => a.order - b.order);

  // Obter todas as colunas ordenadas
  const allColumns = columns.sort((a, b) => a.order - b.order);

  return {
    columns: allColumns,
    visibleColumns,
    toggleColumnVisibility,
    reorderColumns,
    resetToDefault,
    saveColumns,
    updateColumn
  };
}