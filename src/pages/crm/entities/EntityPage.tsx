import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEntity, useEntityRecords, useEntityFields } from '@/hooks/useEntities';
import {
  Database,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowLeft,
  Settings,
  Download,
  Upload,
  Info
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog as FilterDialog, DialogContent as FilterDialogContent, DialogHeader as FilterDialogHeader, DialogTitle as FilterDialogTitle, DialogFooter as FilterDialogFooter } from '@/components/ui/dialog';
import { format, isWithinInterval, parseISO } from 'date-fns';

const EntityPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateRecord, setShowCreateRecord] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<{ start: string; end: string } | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  // Buscar dados da entidade
  const { data: entity, isLoading: entityLoading, error: entityError } = useEntity(id);
  const { fields, isLoading: fieldsLoading, error: fieldsError } = useEntityFields(id);
  const {
    records,
    isLoading: recordsLoading,
    createRecord,
    updateRecord,
    deleteRecord,
    isCreating,
    isDeleting
  } = useEntityRecords(id);

  if (entityLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Database className="w-8 h-8 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-500">Carregando base de dados...</p>
        </div>
      </div>
    );
  }

  if (entityError || !entity) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Database className="w-8 h-8 mx-auto mb-4 text-red-400" />
          <p className="text-red-500">Erro ao carregar base de dados</p>
          <Button
            variant="outline"
            onClick={() => navigate('/crm')}
            className="mt-4"
          >
            Voltar ao CRM
          </Button>
        </div>
      </div>
    );
  }

  // Descobrir campos do tipo select (single_select ou multi_select)
  const typeFields = fields?.filter((f: any) => f.field_type === 'single_select' || f.field_type === 'multi_select') || [];

  // Filtrar registros baseado na busca
  const filteredRecords = records.filter(record => {
    let match = true;
    if (filterDate) {
      const created = record.created_at ? format(new Date(record.created_at), 'yyyy-MM-dd') : '';
      match = match && created === filterDate;
    }
    if (filterPeriod) {
      const created = record.created_at ? parseISO(record.created_at) : null;
      if (created) {
        match = match && isWithinInterval(created, {
          start: parseISO(filterPeriod.start),
          end: parseISO(filterPeriod.end)
        });
      }
    }
    if (filterType && typeFields.length > 0) {
      // Considera o primeiro campo select encontrado
      const typeField = typeFields[0];
      match = match && record.data[typeField.slug]?.toLowerCase().includes(filterType.toLowerCase());
    } else if (filterType) {
      // Se não houver campo select, busca em todos os campos string
      match = match && Object.values(record.data).some(val =>
        typeof val === 'string' && val.toLowerCase().includes(filterType.toLowerCase())
      );
    }
    // Filtro de busca já existente
    match = match && (
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(record.data).toLowerCase().includes(searchTerm.toLowerCase())
    );
    return match;
  });

  const handleCreateRecord = async (recordData: any) => {
    try {
      await createRecord({
        entity_id: entity.id,
        title: recordData.title,
        data: recordData.data,
        tags: recordData.tags || []
      });

      toast.success("Registro criado com sucesso!");
      setShowCreateRecord(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar registro");
    }
  };

  const handleDeleteRecord = async () => {
    if (!selectedRecord) return;

    try {
      await deleteRecord(selectedRecord.id);
      toast.success("Registro excluído com sucesso!");
      setShowDeleteConfirm(false);
      setSelectedRecord(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir registro");
    }
  };

  // Ícone da entidade
  const getEntityIcon = (iconName: string) => {
    const iconMap: Record<string, string> = {
      'database': '🗃️',
      'building2': '🏢',
      'users': '👥',
      'package': '📦',
      'home': '🏠',
      'car': '🚗',
      'graduation-cap': '🎓',
      'briefcase': '💼',
      'heart': '❤️',
      'shopping-cart': '🛒'
    };
    return iconMap[iconName] || '🗃️';
  };

  // Renderizar valor do campo baseado no tipo
  const renderFieldValue = (field: any, value: any) => {
    if (!value && value !== 0) return '-';

    switch (field.field_type) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value);

      case 'date':
        return new Date(value).toLocaleDateString('pt-BR');

      case 'datetime':
        return new Date(value).toLocaleString('pt-BR');

      case 'checkbox':
        return value ? '✅' : '❌';

      case 'email':
        return <a href={`mailto:${value}`} className="text-blue-600 hover:underline">{value}</a>;

      case 'phone':
        return <a href={`tel:${value}`} className="text-blue-600 hover:underline">{value}</a>;

      case 'url':
        return <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          {value}
        </a>;

      default:
        return String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faff] ">
      <div className="mx-auto">
        {/* Header - Novo Layout */}
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/60 px-3 py-1.5 md:px-4 md:py-2 flex-shrink-0 shadow-sm relative mb-4">
          <div className="flex items-center gap-2">
            {/* Título + ícone + engrenagem */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xl p-2"
                style={{ backgroundColor: `${entity.color}20` }}
              >
                {getEntityIcon(entity.icon)}
              </div>
              <h1 className="text-base md:text-lg font-bold text-slate-800 truncate" style={{ color: entity.color }}>
                {entity.name}
              </h1>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 hover:bg-slate-100"
                onClick={() => navigate(`/crm/entity/${entity.id}/settings`)}
              >
                <Settings className="h-4 w-4 text-slate-600" />
              </Button>
            </div>
            {/* Filtros + busca + novo registro */}
            <div className="flex items-center gap-2">
              {/* Botão de filtro */}
              <Button
                variant={filterDate || filterPeriod || filterType ? 'default' : 'outline'}
                size="sm"
                className={`h-6 px-1.5 text-xs ${filterDate || filterPeriod || filterType ? 'bg-blue-600' : 'bg-white/60 border-slate-200'}`}
                onClick={() => setShowFilterModal(true)}
              >
                <Filter className="h-3 w-3 mr-1" />
                Filtros
              </Button>
              {(filterDate || filterPeriod || filterType) && (
                <Badge
                  variant="secondary"
                  className="h-6 px-1.5 text-xs bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200"
                  onClick={() => setShowFilterModal(true)}
                >
                  Filtro ativo
                </Badge>
              )}
              {/* Busca */}
              <div className="relative w-32 md:w-48">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                <Input
                  type="search"
                  placeholder="Buscar..."
                  className="h-6 text-xs pl-6 bg-white/60 border-slate-200 focus:bg-white transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {/* Novo registro */}
              <Button
                size="sm"
                className="h-6 px-2 text-xs bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-sm"
                onClick={() => setShowCreateRecord(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Novo
              </Button>
            </div>
          </div>
        </header>
        {/* Descrição da entidade - bloco informativo abaixo do header */}
        {entity.description && (
          <div className="flex items-center gap-2 bg-blue-50 mx-6 border border-blue-100 rounded-md px-4 py-2 mb-4 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-400" />
            <span>{entity.description}</span>
          </div>
        )}


        {/* Tabela de Registros */}
        <div className='px-6'>
          <div className="bg-white rounded-xl shadow-sm mb-6 pt-2">
            <div className=" pb-6">
              {recordsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse">Carregando registros...</div>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum registro encontrado
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? 'Tente ajustar sua busca' : 'Comece criando seu primeiro registro'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setShowCreateRecord(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro Registro
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        {fields?.slice(0, 4).map((field) => (
                          <TableHead key={field.id}>{field.name}</TableHead>
                        ))}
                        <TableHead>Criado em</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {record.title}
                          </TableCell>
                          {fields?.slice(0, 4).map((field) => (
                            <TableCell key={field.id}>
                              {renderFieldValue(field, record.data[field.slug])}
                            </TableCell>
                          ))}
                          <TableCell>
                            {new Date(record.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    setSelectedRecord(record);
                                    setShowDeleteConfirm(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

        </div>
        {/* Modal de Criação de Registro */}
        <CreateRecordModal
          open={showCreateRecord}
          onOpenChange={setShowCreateRecord}
          entity={entity}
          fields={fields}
          onSave={handleCreateRecord}
          isLoading={isCreating}
        />

        {/* Modal de Confirmação de Exclusão */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Registro</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Tem certeza que deseja excluir o registro "{selectedRecord?.title}"?</p>
              <p className="text-sm text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteRecord}
                disabled={isDeleting}
              >
                {isDeleting ? "Excluindo..." : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Filtros */}
        <FilterDialog open={showFilterModal} onOpenChange={setShowFilterModal}>
          <FilterDialogContent>
            <FilterDialogHeader>
              <FilterDialogTitle>Filtros Avançados</FilterDialogTitle>
            </FilterDialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium">Data específica</label>
                <Input type="date" value={filterDate || ''} onChange={e => setFilterDate(e.target.value || null)} />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-sm font-medium">Período - Início</label>
                  <Input type="date" value={filterPeriod?.start || ''} onChange={e => setFilterPeriod(p => ({ start: e.target.value, end: p?.end || '' }))} />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">Período - Fim</label>
                  <Input type="date" value={filterPeriod?.end || ''} onChange={e => setFilterPeriod(p => ({ start: p?.start || '', end: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Tipo</label>
                {typeFields.length > 0 ? (
                  <select
                    className="w-full border rounded-md p-2 mt-1"
                    value={filterType || ''}
                    onChange={e => setFilterType(e.target.value || null)}
                  >
                    <option value="">Todos</option>
                    {/* Considera o primeiro campo select encontrado */}
                    {typeFields[0].options?.map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    placeholder="Digite o tipo..."
                    value={filterType || ''}
                    onChange={e => setFilterType(e.target.value)}
                  />
                )}
              </div>
            </div>
            <FilterDialogFooter>
              <Button variant="ghost" onClick={() => {
                setFilterDate(null); setFilterPeriod(null); setFilterType(null); setShowFilterModal(false);
              }}>Limpar</Button>
              <Button onClick={() => setShowFilterModal(false)}>Aplicar</Button>
            </FilterDialogFooter>
          </FilterDialogContent>
        </FilterDialog>
      </div>
    </div>
  );
};

// Componente do Modal de Criação de Registro
interface CreateRecordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: any;
  fields: any[];
  onSave: (data: any) => void;
  isLoading: boolean;
}

const CreateRecordModal: React.FC<CreateRecordModalProps> = ({
  open,
  onOpenChange,
  entity,
  fields,
  onSave,
  isLoading
}) => {
  const [formData, setFormData] = useState<any>({
    title: '',
    data: {}
  });

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    // Validar campos obrigatórios
    const missingFields = fields?.filter((field: any) =>
      field.is_required && !formData.data[field.slug]
    ) || [];

    if (missingFields.length > 0) {
      toast.error(`Campos obrigatórios: ${missingFields.map((f: any) => f.name).join(', ')}`);
      return;
    }

    onSave(formData);
  };

  const updateFieldValue = (fieldSlug: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      data: {
        ...prev.data,
        [fieldSlug]: value
      }
    }));
  };

  if (!fields || fields.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Carregando campos...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Registro - {entity.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Título *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Digite o título do registro..."
            />
          </div>

          {fields.map((field: any) => (
            <div key={field.id}>
              <label className="text-sm font-medium">
                {field.name}
                {field.is_required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.field_type === 'long_text' ? (
                <textarea
                  className="w-full mt-1 p-2 border rounded-md"
                  rows={3}
                  value={formData.data[field.slug] || ''}
                  onChange={(e) => updateFieldValue(field.slug, e.target.value)}
                  placeholder={field.description}
                />
              ) : field.field_type === 'checkbox' ? (
                <div className="flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={formData.data[field.slug] || false}
                    onChange={(e) => updateFieldValue(field.slug, e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">{field.description}</span>
                </div>
              ) : (
                <Input
                  type={field.field_type === 'number' ? 'number' :
                    field.field_type === 'date' ? 'date' :
                      field.field_type === 'datetime' ? 'datetime-local' :
                        field.field_type === 'email' ? 'email' :
                          field.field_type === 'url' ? 'url' : 'text'}
                  value={formData.data[field.slug] || ''}
                  onChange={(e) => updateFieldValue(field.slug, e.target.value)}
                  placeholder={field.description}
                  className="mt-1"
                />
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Criando..." : "Criar Registro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EntityPage; 