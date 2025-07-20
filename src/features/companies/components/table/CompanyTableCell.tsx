import React from 'react';
import { CompanyWithRelations } from '@/features/companies/hooks/useCompanies';
import { CompanyColumn } from '@/features/companies/hooks/useCompanyColumns';
import { Building2, ExternalLink, Phone, Mail, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// AIDEV-NOTE: Componente para renderizar células da tabela de empresas
// Suporta diferentes tipos de dados com formatação apropriada

interface CompanyTableCellProps {
  company: CompanyWithRelations;
  column: CompanyColumn;
}

export function CompanyTableCell({ company, column }: CompanyTableCellProps) {
  const getValue = (key: string): any => {
    // Tratamento especial para campos compostos
    switch (key) {
      case 'address':
        const addressParts = [
          company.rua,
          company.numero,
          company.bairro,
          company.cidade,
          company.estado
        ].filter(Boolean);
        return addressParts.length > 0 ? addressParts.join(', ') : null;
      
      case 'cidade':
        return company.cidade;
      
      case 'estado':
        return company.estado;
      
      default:
        return (company as any)[key];
    }
  };

  const value = getValue(column.id);

  // Se o valor está vazio, mostrar "-"
  if (!value || value === '') {
    return (
      <span className="italic text-muted-foreground text-xs truncate">
        -
      </span>
    );
  }

  // Renderização baseada no tipo da coluna
  switch (column.type) {
    case 'email':
      return (
        <div className="flex items-center gap-1 min-w-0">
          <Mail className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <a 
            href={`mailto:${value}`}
            className="text-blue-600 hover:underline text-xs truncate"
            onClick={(e) => e.stopPropagation()}
            title={value}
          >
            {value}
          </a>
        </div>
      );

    case 'phone':
      const cleanPhone = value.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/55${cleanPhone}`;
      return (
        <div className="flex items-center gap-1 min-w-0">
          <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:underline text-xs truncate"
            onClick={(e) => e.stopPropagation()}
            title={value}
          >
            {value}
          </a>
        </div>
      );

    case 'url':
      const url = value.startsWith('http') ? value : `https://${value}`;
      return (
        <div className="flex items-center gap-1 min-w-0">
          <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <a 
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-xs truncate"
            onClick={(e) => e.stopPropagation()}
            title={value}
          >
            {value}
          </a>
        </div>
      );

    case 'date':
      try {
        const date = new Date(value);
        return (
          <span className="text-xs truncate" title={value}>
            {format(date, 'dd/MM/yyyy', { locale: ptBR })}
          </span>
        );
      } catch {
        return <span className="text-xs truncate" title={value}>{value}</span>;
      }

    case 'status':
      return (
        <Badge 
          variant={value === 'ATIVO' ? 'default' : 'secondary'}
          className="text-xs truncate"
          title={value}
        >
          {value}
        </Badge>
      );

    case 'address':
      return (
        <div className="flex items-start gap-1 min-w-0">
          <MapPin className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
          <span className="text-xs leading-tight truncate" title={value}>{value}</span>
        </div>
      );

    default:
      // Tratamento especial para o campo nome (primeira coluna)
      if (column.id === 'name') {
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm text-foreground truncate" title={value}>
                {value}
              </div>
              {company.cnpj && (
                <div className="text-xs text-muted-foreground truncate" title={company.cnpj}>
                  {company.cnpj}
                </div>
              )}
            </div>
          </div>
        );
      }

      // Texto padrão com truncamento
      return (
        <span className="text-xs truncate block" title={value}>
          {value}
        </span>
      );
  }
}