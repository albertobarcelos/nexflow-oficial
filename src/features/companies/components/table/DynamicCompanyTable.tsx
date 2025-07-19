import React, { useState, useRef, useCallback } from 'react';
import { CompanyWithRelations } from '@/features/companies/hooks/useCompanies';
import { CompanyColumn } from '@/features/companies/hooks/useCompanyColumns';
import { CompanyTableCell } from './CompanyTableCell';
import { Button } from '@/components/ui/button';
import { Pencil, Trash } from 'lucide-react';

// AIDEV-NOTE: Tabela dinâmica de empresas com colunas configuráveis
// Exibe todas as colunas do banco conforme configuração do usuário
// Inclui scroll horizontal e redimensionamento de colunas

interface DynamicCompanyTableProps {
  companies: CompanyWithRelations[];
  isLoading: boolean;
  visibleColumns: CompanyColumn[];
  onEdit: (e: React.MouseEvent, company: CompanyWithRelations) => void;
  onDelete: (e: React.MouseEvent, company: CompanyWithRelations) => void;
  onRowClick: (company: CompanyWithRelations) => void;
  onUpdateColumn: (columnId: string, updates: Partial<CompanyColumn>) => void;
}

export function DynamicCompanyTable({ 
  companies, 
  isLoading, 
  visibleColumns,
  onEdit, 
  onDelete, 
  onRowClick,
  onUpdateColumn
}: DynamicCompanyTableProps) {
  const [resizing, setResizing] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  // Função para redimensionar colunas
  const handleMouseDown = useCallback((columnId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(columnId);
    
    const startX = e.clientX;
    const startWidth = e.currentTarget.parentElement?.offsetWidth || 150;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(80, startWidth + (e.clientX - startX));
      
      // Aplicar largura imediatamente via CSS
      const table = tableRef.current;
      if (table) {
        const headerCells = table.querySelectorAll(`th[data-column="${columnId}"]`);
        const bodyCells = table.querySelectorAll(`td[data-column="${columnId}"]`);
        
        [...headerCells, ...bodyCells].forEach(cell => {
          (cell as HTMLElement).style.width = `${newWidth}px`;
          (cell as HTMLElement).style.minWidth = `${newWidth}px`;
          (cell as HTMLElement).style.maxWidth = `${newWidth}px`;
        });
      }
    };

    const handleMouseUp = () => {
      setResizing(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Salvar a nova configuração
      const newWidth = tableRef.current?.querySelector(`th[data-column="${columnId}"]`)?.getBoundingClientRect().width;
      if (newWidth) {
        onUpdateColumn(columnId, { width: `${Math.round(newWidth)}px` });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [onUpdateColumn]);

  if (isLoading) {
    return (
      <div className="border rounded-lg bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b bg-muted/100">
                <td colSpan={visibleColumns.length + 1} className="py-8 text-center text-muted-foreground">
                  Carregando empresas...
                </td>
              </tr>
            </thead>
          </table>
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="border rounded-lg bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b bg-muted/100">
                <td colSpan={visibleColumns.length + 1} className="py-8 text-center text-muted-foreground">
                  Nenhuma empresa encontrada
                </td>
              </tr>
            </thead>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-white">
      {/* Container com scroll horizontal */}
      <div className="overflow-x-auto overflow-y-hidden">
        <table ref={tableRef} className="w-full min-w-max table-fixed">
          <thead>
            <tr className="border-b bg-muted/100">
              {visibleColumns.map((column, index) => (
                <th 
                  key={column.id}
                  data-column={column.id}
                  className={`
                    relative py-3 px-4 font-medium text-xs text-muted-foreground tracking-wide
                    border-r border-gray-200 last:border-r-0
                    ${column.align === 'center' ? 'text-center' : 
                      column.align === 'right' ? 'text-right' : 'text-left'}
                    ${index === 0 ? 'rounded-tl-md' : ''}
                    ${resizing === column.id ? 'bg-blue-50' : ''}
                  `}
                  style={{ 
                    width: column.width || '150px',
                    minWidth: column.width || '150px',
                    maxWidth: column.width || '150px'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{column.label}</span>
                    
                    {/* Handle de redimensionamento */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors"
                      onMouseDown={(e) => handleMouseDown(column.id, e)}
                      title="Arrastar para redimensionar"
                    />
                  </div>
                </th>
              ))}
              <th className="py-3 px-4 text-right font-medium text-xs text-muted-foreground tracking-wide w-20 rounded-tr-md">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {companies.map((company) => (
              <tr
                key={company.id}
                className="border-b cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onRowClick(company)}
              >
                {visibleColumns.map((column) => (
                  <td 
                    key={column.id}
                    data-column={column.id}
                    className={`
                      py-3 px-4 border-r border-gray-100 last:border-r-0
                      ${column.align === 'center' ? 'text-center' : 
                        column.align === 'right' ? 'text-right' : 'text-left'}
                    `}
                    style={{ 
                      width: column.width || '150px',
                      minWidth: column.width || '150px',
                      maxWidth: column.width || '150px'
                    }}
                  >
                    <div className="truncate">
                      <CompanyTableCell company={company} column={column} />
                    </div>
                  </td>
                ))}
                
                {/* Coluna de Ações */}
                <td className="py-2 px-2 text-right w-20">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => onEdit(e, company)}
                      aria-label="Editar"
                      className="text-gray-400 hover:text-blue-600 h-8 w-8 p-0"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-destructive h-8 w-8 p-0"
                      onClick={(e) => onDelete(e, company)}
                      aria-label="Excluir"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Indicador de scroll */}
      <div className="text-xs text-muted-foreground p-2 bg-gray-50 border-t">
        💡 Dica: Use o scroll horizontal para ver mais colunas • Arraste as bordas das colunas para redimensionar
      </div>
    </div>
  );
}