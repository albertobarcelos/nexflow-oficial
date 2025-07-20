import React, { useState, useRef, useCallback } from 'react';
import { CompanyWithRelations } from '@/features/companies/hooks/useCompanies';
import { CompanyColumn } from '@/features/companies/hooks/useCompanyColumns';
import { CompanyTableCell } from './CompanyTableCell';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';

// AIDEV-NOTE: Tabela dinâmica de empresas com colunas configuráveis
// Exibe todas as colunas do banco conforme configuração do usuário
// Inclui scroll horizontal e redimensionamento de colunas

interface DynamicCompanyTableProps {
  companies: CompanyWithRelations[];
  isLoading: boolean;
  visibleColumns: CompanyColumn[];
  onDelete: (e: React.MouseEvent, company: CompanyWithRelations) => void;
  onRowClick: (company: CompanyWithRelations) => void;
  onUpdateColumn: (columnId: string, updates: Partial<CompanyColumn>) => void;
}

export function DynamicCompanyTable({ 
  companies, 
  isLoading, 
  visibleColumns,
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
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 border-b bg-gray-50 p-4">
          <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex-1 p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma empresa encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comece criando uma nova empresa ou ajuste os filtros de busca.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Container da tabela com scroll horizontal unificado */}
      <div className="flex-1 overflow-auto">
        <table ref={tableRef} className="min-w-full divide-y divide-gray-200">
          {/* Header da tabela */}
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {visibleColumns.map((column) => (
                <th
                  key={column.id}
                  data-column={column.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r last:border-r-0 relative group"
                  style={{ 
                    width: column.width || 150,
                    minWidth: column.width || 150,
                    maxWidth: column.width || 150
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span>{column.label}</span>
                    {/* Redimensionador */}
                    <div
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseDown={(e) => handleMouseDown(column.id, e)}
                    />
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 w-24 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>

          {/* Body da tabela */}
          <tbody className="bg-white divide-y divide-gray-200">
            {companies.map((company, index) => (
              <tr
                key={company.id}
                className={`cursor-pointer hover:bg-gray-50 transition-colors h-16 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
                onClick={() => onRowClick(company)}
              >
                {visibleColumns.map((column) => (
                  <td
                    key={column.id}
                    data-column={column.id}
                    className="px-6 py-3 text-sm text-gray-900 border-r last:border-r-0 h-16 align-middle overflow-hidden"
                    style={{ 
                      width: column.width || 150,
                      minWidth: column.width || 150,
                      maxWidth: column.width || 150
                    }}
                  >
                    <div className="h-full flex items-center overflow-hidden">
                      <CompanyTableCell company={company} column={column} />
                    </div>
                  </td>
                ))}
                <td className="px-6 py-3 w-24 text-center h-16 align-middle">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => onDelete(e, company)}
                      className="h-8 w-8 p-0 hover:bg-red-100"
                    >
                      <Trash className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Indicador de scroll horizontal */}
      <div className="flex-shrink-0 text-center py-2 text-xs text-gray-500 bg-gray-50 border-t">
        ← Role horizontalmente para ver mais colunas →
      </div>
    </div>
  );
}