import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
    MoreHorizontal,
    Phone,
    Mail,
    Building2,
    Calendar,
    DollarSign,
    Clock,
    CheckCircle2,
    Circle,
    Plus,
    FileText,
    Paperclip,
    MessageSquare,
    History,
    Target,
    Users,
    User,
    Video,
    Send,
    AlertCircle,
    ChevronRight,
    X,
    Thermometer,
    CalendarDays,
    PlayCircle,
    StickyNote,
    Edit2,
    Database,
    Handshake,
    GraduationCap,
    Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactToyFace from "react-toy-face";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { DynamicOverviewTab } from "./DynamicOverviewTab";
import { useFlowBases } from "@/hooks/useFlowBases";
import { useDealEntityData } from "@/hooks/useDealEntityData";
import { EntityFormModal } from "./EntityFormModal";

// Types
export interface MockDeal {
    id: string;
    title: string;
    value?: number;
    company_id?: string;
    company_name?: string;
    company_cnpj?: string;
    person_id?: string;
    stage_id: string;
    position: number;
    created_at: string;
    flow_id?: string;
    tags?: string[];
    temperature?: string;
    instagram_link?: string;
    live_link?: string;
}

interface Stage {
    id: string;
    name: string;
}

interface Task {
    id: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed';
    type: 'call' | 'email' | 'meeting' | 'custom';
    assignee?: string;
    dueDate?: string;
    createdAt: string;
}

interface DealDetailsDialogProps {
    open: boolean;
    deal: MockDeal | null;
    stages: Stage[];
    onClose: () => void;
    onStageChange: (stageId: string) => void;
}

// Mock data for tasks
const mockTasks: Task[] = [
    {
        id: '1',
        title: 'Ligar para cliente sobre proposta',
        status: 'pending',
        type: 'call',
        assignee: 'João Silva',
        dueDate: '2024-01-20',
        createdAt: '2024-01-18'
    },
    {
        id: '2',
        title: 'Enviar contrato por email',
        status: 'completed',
        type: 'email',
        assignee: 'Maria Santos',
        dueDate: '2024-01-19',
        createdAt: '2024-01-17'
    }
];

// Quick task templates
const taskTemplates = [
    { id: 'call', label: 'Ligar', icon: Phone, color: 'bg-blue-500' },
    { id: 'email', label: 'Enviar Email', icon: Mail, color: 'bg-green-500' },
    { id: 'meeting', label: 'Agendar Reunião', icon: Video, color: 'bg-purple-500' },
    { id: 'followup', label: 'Follow-up', icon: Clock, color: 'bg-orange-500' }
];

// Task status config
const taskStatusConfig = {
    pending: { label: 'Pendente', icon: Circle, color: 'text-orange-500' },
    in_progress: { label: 'Em andamento', icon: Clock, color: 'text-blue-500' },
    completed: { label: 'Concluída', icon: CheckCircle2, color: 'text-green-500' }
};

// Quick Tasks Component
function QuickTasksPanel({ dealId }: { dealId: string }) {
    const [tasks, setTasks] = useState<Task[]>(mockTasks);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const addQuickTask = (type: string, title?: string) => {
        const template = taskTemplates.find(t => t.id === type);
        const taskTitle = title || `${template?.label} - ${new Date().toLocaleDateString()}`;

        const newTask: Task = {
            id: Date.now().toString(),
            title: taskTitle,
            status: 'pending',
            type: type as Task['type'],
            assignee: 'Você',
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            createdAt: new Date().toISOString()
        };

        setTasks(prev => [newTask, ...prev]);
        setNewTaskTitle('');
    };

    const addCustomTask = () => {
        if (newTaskTitle.trim()) {
            addQuickTask('custom', newTaskTitle);
        }
    };

    const toggleTaskStatus = (taskId: string) => {
        setTasks(prev => prev.map(task =>
            task.id === taskId
                ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
                : task
        ));
    };

    return (
        <div className="space-y-5">
            {/* Input Direto para Nova Tarefa */}
            <Card className="border-slate-200/60 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                        <PlayCircle className="h-5 w-5 text-emerald-500" />
                        Nova Tarefa Rápida
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    {/* Input Principal */}
                    <div className="flex gap-2">
                        <Input
                            placeholder="Digite uma tarefa e pressione Enter..."
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            className="flex-1 h-8 text-sm"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    addCustomTask();
                                    e.preventDefault();
                                }
                            }}
                        />
                        <Button
                            onClick={addCustomTask}
                            disabled={!newTaskTitle.trim()}
                            size="sm"
                            className="h-8 px-3"
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>

                    {/* Botões Pré-configurados */}
                    <div className="grid grid-cols-3 gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 h-8 text-xs"
                            onClick={() => addQuickTask('call')}
                        >
                            <Phone className="h-3 w-3 text-blue-500" />
                            Ligar
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 h-8 text-xs"
                            onClick={() => addQuickTask('email')}
                        >
                            <Mail className="h-3 w-3 text-green-500" />
                            Email
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 h-8 text-xs"
                            onClick={() => addQuickTask('meeting')}
                        >
                            <Video className="h-3 w-3 text-purple-500" />
                            Reunião
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Tasks List */}
            <Card className="border-slate-200/60 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            Tarefas ({tasks.length})
                        </span>
                        <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600 border-0">
                            {tasks.filter(t => t.status === 'pending').length} pendentes
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        <div className="space-y-2">
                            {tasks.map((task) => {
                                const StatusIcon = taskStatusConfig[task.status].icon;
                                const getTaskTypeIcon = () => {
                                    switch (task.type) {
                                        case 'call': return { icon: Phone, color: 'text-blue-500', bg: 'bg-blue-100' };
                                        case 'email': return { icon: Mail, color: 'text-green-500', bg: 'bg-green-100' };
                                        case 'meeting': return { icon: Video, color: 'text-purple-500', bg: 'bg-purple-100' };
                                        default: return { icon: Target, color: 'text-gray-500', bg: 'bg-gray-100' };
                                    }
                                };
                                const typeConfig = getTaskTypeIcon();
                                const TypeIcon = typeConfig.icon;

                                return (
                                    <div
                                        key={task.id}
                                        className={cn(
                                            "flex items-center gap-2 p-2 rounded border transition-all hover:shadow-sm",
                                            task.status === 'completed'
                                                ? "bg-green-50/50 border-green-200/50"
                                                : "bg-white hover:bg-gray-50 border-gray-200"
                                        )}
                                    >
                                        {/* Ícone do Tipo */}
                                        <div className={`p-1.5 rounded ${typeConfig.bg}`}>
                                            <TypeIcon className={`h-3 w-3 ${typeConfig.color}`} />
                                        </div>

                                        {/* Checkbox de Status */}
                                        <button
                                            onClick={() => toggleTaskStatus(task.id)}
                                            className="flex-shrink-0 hover:scale-110 transition-transform"
                                        >
                                            <StatusIcon
                                                className={cn(
                                                    "h-4 w-4 transition-colors",
                                                    taskStatusConfig[task.status].color
                                                )}
                                            />
                                        </button>

                                        {/* Conteúdo da Tarefa */}
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                "text-xs font-medium truncate",
                                                task.status === 'completed' && "line-through text-muted-foreground"
                                            )}>
                                                {task.title}
                                            </p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {task.assignee}
                                                </span>
                                                {task.dueDate && (
                                                    <>
                                                        <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="h-2 w-2" />
                                                            {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Avatar do Responsável */}
                                        <Avatar className="h-6 w-6 border border-white shadow-sm">
                                            <AvatarFallback className="text-xs font-semibold">
                                                {task.assignee?.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                );
                            })}

                            {tasks.length === 0 && (
                                <div className="text-center py-6 text-muted-foreground">
                                    <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                    <p className="text-xs">Nenhuma tarefa criada</p>
                                    <p className="text-xs">Use as ações rápidas acima para começar</p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


// Main Component
export function DealViewDialog({ open, deal, stages, onClose, onStageChange }: DealDetailsDialogProps) {
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [form, setForm] = useState({
        services: "",
        discounts: "",
        validity: "",
        proposal: "",
    });
    const [activity, setActivity] = useState("");
    const [activities, setActivities] = useState<Array<{
        id: number;
        text: string;
        date: string;
        author: string;
    }>>([]);

    // Notes state
    const [notes, setNotes] = useState<Array<{ id: number; text: string; date: string; editing: boolean }>>([
        { id: 1, text: 'Primeira nota sobre o negócio.', date: new Date().toISOString() },
        { id: 2, text: 'Cliente pediu revisão de valores.', date: new Date(Date.now() - 86400000).toISOString() },
    ]);
    const [newNote, setNewNote] = useState("");
    const [noteToDelete, setNoteToDelete] = useState<number | null>(null);

    // Estado para controlar quais entidades estão expandidas
    const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());

    // Novos estados para o sistema de entidades
    const [entityFormModal, setEntityFormModal] = useState<{
        open: boolean;
        entityId: string;
        entityName: string;
        entitySlug: string;
        fields: any[];
        editData?: any;
    }>({
        open: false,
        entityId: '',
        entityName: '',
        entitySlug: '',
        fields: [],
    });

    // Hooks
    const flowId = deal?.flow_id;
    const { linkedBases: linkedEntities } = useFlowBases(flowId || '');
    const { 
        dealEntities, 
        isLoading: isLoadingEntities,
        getEntityFields,
        createEntityRecord,
        updateEntityRecord,
        removeEntityFromDeal,
        isCreating,
        isUpdating 
    } = useDealEntityData(deal?.id || '');

    // Função para alternar expansão de entidade
    const toggleEntityExpansion = (entityId: string) => {
        setExpandedEntities(prev => {
            const newSet = new Set(prev);
            if (newSet.has(entityId)) {
                newSet.delete(entityId);
            } else {
                newSet.add(entityId);
            }
            return newSet;
        });
    };

    // Função para salvar dados da visão geral dinâmica
    const handleSaveOverviewData = (data: Record<string, any>) => {
        console.log('Salvando dados do overview:', data);
        toast.success('Dados salvos com sucesso!');
    };

    const handleAddNote = () => {
        if (newNote.trim()) {
            const newNoteObj = {
                id: Date.now(),
                text: newNote.trim(),
                date: new Date().toISOString(),
                editing: false
            };
            setNotes(prev => [newNoteObj, ...prev]);
            setNewNote('');
        }
    };

    const handleEditNote = (id: number, text: string) => {
        setNotes(notes.map(note => note.id === id ? { ...note, editing: false } : note));
    };

    const handleDeleteNote = (id: number) => {
        setNotes(notes.filter(note => note.id !== id));
    };

    const setNoteEditing = (id: number, editing: boolean) => {
        setNotes(notes.map(note => note.id === id ? { ...note, editing } : note));
    };

    const handleRequestDeleteNote = (id: number) => {
        setNoteToDelete(id);
    };

    const handleConfirmDeleteNote = () => {
        if (noteToDelete) {
            handleDeleteNote(noteToDelete);
            setNoteToDelete(null);
        }
    };

    const handleCancelDeleteNote = () => {
        setNoteToDelete(null);
    };

    const getEntityIcon = (entityName: string) => {
        const iconMap: Record<string, any> = {
            'Empresas': Building2,
            'Pessoas': User,
            'Parceiros': Handshake,
            'Cursos': GraduationCap,
            'Imóveis': Home,
        };
        return iconMap[entityName] || Building2;
    };

    // Funções para o sistema de entidades
    const handleAddEntity = async (flowEntity: any) => {
        try {
            const fields = await getEntityFields(flowEntity.entity_id);
            setEntityFormModal({
                open: true,
                entityId: flowEntity.entity_id,
                entityName: flowEntity.entity?.name || '',
                entitySlug: flowEntity.entity?.slug || '',
                fields,
            });
        } catch (error) {
            console.error('Erro ao carregar campos da entidade:', error);
            toast.error('Erro ao carregar campos da entidade');
        }
    };

    const handleEditEntity = async (dealEntity: any) => {
        try {
            const fields = await getEntityFields(dealEntity.entity_id);
            setEntityFormModal({
                open: true,
                entityId: dealEntity.entity_id,
                entityName: dealEntity.entity_name || '',
                entitySlug: dealEntity.entity_slug || '',
                fields,
                editData: {
                    recordId: dealEntity.record_id,
                    title: dealEntity.record?.title || '',
                    data: dealEntity.record?.data || {},
                },
            });
        } catch (error) {
            console.error('Erro ao carregar dados para edição:', error);
            toast.error('Erro ao carregar dados para edição');
        }
    };

    const handleSaveEntity = (data: any) => {
        if (entityFormModal.editData) {
            // Modo edição
            updateEntityRecord({
                recordId: entityFormModal.editData.recordId,
                title: data.title,
                data: data.data,
            });
        } else {
            // Modo criação
            createEntityRecord(data);
        }
        setEntityFormModal({ ...entityFormModal, open: false });
    };

    const handleRemoveEntity = (dealEntityId: string) => {
        if (confirm('Tem certeza que deseja remover esta entidade da oportunidade?')) {
            removeEntityFromDeal(dealEntityId);
        }
    };

    if (!deal) return null;

    // Adicionar estilos customizados para scrollbar
    const scrollbarStyles = `
        .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgb(148 163 184) rgb(241 245 249);
            overflow-y: scroll !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            display: block;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgb(241 245 249);
            border-radius: 4px;
            margin: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgb(148 163 184);
            border-radius: 4px;
            border: 1px solid rgb(226 232 240);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgb(100 116 139);
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
            background: rgb(241 245 249);
        }
    `;

    const tabs = [
        { id: 'overview', label: 'Visão Geral', icon: Target },
        { id: 'tasks', label: 'Tarefas', icon: CheckCircle2 },
        { id: 'activities', label: 'Notas', icon: MessageSquare },
        { id: 'attachments', label: 'Anexos', icon: Paperclip },
        { id: 'history', label: 'Histórico', icon: History },
    ];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <style>{scrollbarStyles}</style>
            <DialogContent className="h-[95vh] max-w-[95%] p-0 overflow-hidden">
                {/* Grid Layout with aligned headers */}
                <div className="grid grid-cols-[320px_1fr_280px] grid-rows-[auto_1fr] h-full">
                    {/* Headers Row - All aligned horizontally */}
                    <div className="bg-white/95 backdrop-blur-sm border-b border-slate-200/60 px-5 py-3 flex items-center">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold text-slate-800">
                                Detalhes da Oportunidade
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="bg-white/95 backdrop-blur-sm border-b border-l border-slate-200/60 px-4 py-3 flex items-center justify-between">
                        <h3 className="text-base font-semibold text-slate-800">{deal.title}</h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-6 w-6 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="bg-white/95 backdrop-blur-sm border-b border-l border-slate-200/60 px-4 py-3 flex items-center">
                        <h3 className="text-base font-semibold text-slate-800">Ações do Negócio</h3>
                    </div>

                    {/* Content Row - All with independent scroll */}
                    {/* Left Sidebar - Detalhes da Oportunidade */}
                    <div className="bg-slate-50/80 border-r border-slate-200/60 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(88vh - 60px)' }}>
                        <div className="px-5 py-5 space-y-4">
                            {/* Entidades Vinculadas */}
                            {isLoadingEntities ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                                    <p className="text-sm text-slate-500">Carregando entidades...</p>
                                </div>
                            ) : linkedEntities.length === 0 ? (
                                <div className="text-center py-12">
                                    <Database className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                                    <h3 className="text-sm font-medium text-slate-600 mb-1">Nenhuma entidade configurada</h3>
                                    <p className="text-xs text-slate-400">Configure entidades no flow para ver dados relacionados</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {linkedEntities
                                        .sort((a, b) => a.order_index - b.order_index)
                                        .map((flowEntity) => {
                                            const Icon = getEntityIcon(flowEntity.entity?.name || '');
                                            const isExpanded = expandedEntities.has(flowEntity.id);
                                            
                                            // Buscar dados reais da entidade para este deal
                                            const dealEntity = dealEntities.find(de => de.entity_id === flowEntity.entity_id);
                                            const hasData = !!dealEntity?.record;
                                            
                                            // Calcular campos extras para controle de expansão
                                            let extraFieldsCount = 0;
                                            if (hasData && dealEntity?.record) {
                                                const fields = dealEntity.fields || [];
                                                let mainCount = 1; // título
                                                fields.forEach((field) => {
                                                    const value = dealEntity.record!.data[field.slug];
                                                    if (value !== undefined && value !== null && value !== '') {
                                                        if (mainCount < 3) {
                                                            mainCount++;
                                                        } else {
                                                            extraFieldsCount++;
                                                        }
                                                    }
                                                });
                                            }
                                            
                                            // Renderizar campos baseados nos dados reais
                                            const renderEntityData = () => {
                                                if (!hasData) {
                                                    return (
                                                        <div className="text-center py-6">
                                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                                                <Icon className="w-6 h-6 text-slate-400" />
                                                            </div>
                                                            <p className="text-sm text-slate-600 mb-3">Nenhum dado preenchido</p>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleAddEntity(flowEntity)}
                                                                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 shadow-sm"
                                                            >
                                                                <Plus className="w-3 h-3 mr-2" />
                                                                Adicionar Dados
                                                            </Button>
                                                        </div>
                                                    );
                                                }

                                                const record = dealEntity.record!;
                                                const fields = dealEntity.fields || [];
                                                
                                                // Campos principais (primeiros 3 para melhor layout)
                                                const mainFieldsData: Array<{ label: string; value: string }> = [];
                                                const extraFieldsData: Array<{ label: string; value: string }> = [];
                                                
                                                // Adicionar título como primeiro campo
                                                mainFieldsData.push({ label: 'Nome', value: record.title });
                                                
                                                // Adicionar campos do banco de dados
                                                fields.forEach((field, index) => {
                                                    const value = record.data[field.slug];
                                                    if (value !== undefined && value !== null && value !== '') {
                                                        const fieldData = { 
                                                            label: field.name, 
                                                            value: String(value) 
                                                        };
                                                        
                                                        if (mainFieldsData.length < 3) {
                                                            mainFieldsData.push(fieldData);
                                                        } else {
                                                            extraFieldsData.push(fieldData);
                                                        }
                                                    }
                                                });

                                                return (
                                                    <div className="space-y-4">
                                                        {/* Campos principais em grid elegante */}
                                                        <div className="space-y-3">
                                                            {mainFieldsData.map((field, index) => (
                                                                <div key={index} className="group">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                                                            {field.label}
                                                                        </span>
                                                                    </div>
                                                                    <div className="mt-1 p-2 bg-white rounded-md border border-slate-200 group-hover:border-slate-300 transition-colors">
                                                                        <span className="text-sm font-medium text-slate-800 break-all">
                                                                            {field.value}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        
                                                        {/* Campos extras (expansíveis) */}
                                                        {isExpanded && extraFieldsData.length > 0 && (
                                                            <div className="space-y-3 pt-3 border-t border-slate-200">
                                                                {extraFieldsData.map((field, index) => (
                                                                    <div key={index} className="group">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                                                                {field.label}
                                                                            </span>
                                                                        </div>
                                                                        <div className="mt-1 p-2 bg-white rounded-md border border-slate-200 group-hover:border-slate-300 transition-colors">
                                                                            <span className="text-sm font-medium text-slate-800 break-all">
                                                                                {field.value}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        
                                                        {/* Indicador de mais campos */}
                                                        {extraFieldsData.length > 0 && !isExpanded && (
                                                            <div className="pt-3 border-t border-slate-200">
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    className="w-full h-8 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-md border border-dashed border-slate-300 hover:border-slate-400 transition-all"
                                                                    onClick={() => toggleEntityExpansion(flowEntity.id)}
                                                                >
                                                                    <ChevronRight className="w-3 h-3 mr-1" />
                                                                    Ver mais {extraFieldsData.length} campo{extraFieldsData.length > 1 ? 's' : ''}
                                                                </Button>
                                                            </div>
                                                        )}

                                                        {/* Botões de ação elegantes */}
                                                        <div className="pt-3 border-t border-slate-200">
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleEditEntity(dealEntity)}
                                                                    className="flex-1 h-8 text-xs border-slate-300 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                                >
                                                                    <Edit2 className="w-3 h-3 mr-1" />
                                                                    Editar
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleRemoveEntity(dealEntity.id)}
                                                                    className="h-8 px-3 text-xs border-slate-300 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            };
                                            
                                            return (
                                                <Card key={flowEntity.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden bg-white">
                                                    <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn(
                                                                    "w-10 h-10 rounded-lg flex items-center justify-center shadow-sm",
                                                                    hasData ? "bg-gradient-to-br from-blue-500 to-blue-600" : "bg-slate-200"
                                                                )}>
                                                                    <Icon 
                                                                        className={cn(
                                                                            "w-5 h-5",
                                                                            hasData ? "text-white" : "text-slate-500"
                                                                        )}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <CardTitle className="text-sm font-semibold text-slate-800">
                                                                        {flowEntity.entity?.name}
                                                                    </CardTitle>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        {flowEntity.is_primary && (
                                                                            <Badge variant="default" className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 border-blue-200 font-medium">
                                                                                Principal
                                                                            </Badge>
                                                                        )}
                                                                        <Badge 
                                                                            variant={flowEntity.is_required ? "destructive" : "outline"} 
                                                                            className="text-[10px] px-2 py-0.5 font-medium"
                                                                        >
                                                                            {flowEntity.is_required ? 'Obrigatório' : 'Opcional'}
                                                                        </Badge>
                                                                        {hasData && (
                                                                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-green-50 text-green-700 border-green-200 font-medium">
                                                                                ✓ Preenchido
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {hasData && extraFieldsCount > 0 && (
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full"
                                                                    onClick={() => toggleEntityExpansion(flowEntity.id)}
                                                                >
                                                                    <ChevronRight className={cn(
                                                                        "h-4 w-4 transition-transform duration-200 text-slate-500",
                                                                        isExpanded && "rotate-90"
                                                                    )} />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="p-5 bg-slate-50/30">
                                                        {renderEntityData()}
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex flex-col bg-white border-r border-slate-200/60 overflow-hidden">
                        {/* Tab Navigation */}
                        <div className="border-b border-slate-200/60 px-4 py-3">
                            <div className="flex space-x-1">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors",
                                            activeTab === tab.id
                                                ? "bg-blue-100 text-blue-700 border border-blue-200"
                                                : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                                        )}
                                    >
                                        <tab.icon className="w-3 h-3" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                            <div className="space-y-4">
                                {activeTab === 'overview' && (
                                    <DynamicOverviewTab 
                                        deal={deal} 
                                        flowId={flowId} 
                                        onSaveData={handleSaveOverviewData} 
                                    />
                                )}

                                {activeTab === 'tasks' && (
                                    <QuickTasksPanel dealId={deal.id} />
                                )}

                                {activeTab === 'activities' && (
                                    <Card className="border-slate-200/60 shadow-sm">
                                        <CardHeader className="pb-4 border-b border-slate-100">
                                            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                                <MessageSquare className="h-5 w-5 text-blue-500" /> Notas
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6 space-y-4">
                                            {/* Add Note */}
                                            <div className="flex gap-2">
                                                <Input
                                                    value={newNote}
                                                    onChange={e => setNewNote(e.target.value)}
                                                    placeholder="Escreva uma nova nota..."
                                                    className="flex-1"
                                                    onKeyDown={e => {
                                                        if (e.key === "Enter" && newNote.trim()) {
                                                            handleAddNote();
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    onClick={handleAddNote}
                                                    disabled={!newNote.trim()}
                                                    size="sm"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {/* Notes List */}
                                            <div className="space-y-3">
                                                {notes.length === 0 ? (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                        <p className="text-sm">Nenhuma nota registrada</p>
                                                        <p className="text-xs">Adicione uma nota para começar</p>
                                                    </div>
                                                ) : (
                                                    notes.map(note => (
                                                        <div key={note.id} className="flex gap-3 p-3 bg-blue-50 rounded-lg items-start">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {new Date(note.date).toLocaleString('pt-BR')}
                                                                    </span>
                                                                </div>
                                                                {note.editing ? (
                                                                    <div className="flex gap-2">
                                                                        <Textarea
                                                                            value={note.text}
                                                                            onChange={e => setNotes(notes.map(n => n.id === note.id ? { ...n, text: e.target.value } : n))}
                                                                            rows={2}
                                                                            className="flex-1 text-sm"
                                                                        />
                                                                        <Button size="sm" variant="outline" onClick={() => handleEditNote(note.id, note.text)}>
                                                                            Salvar
                                                                        </Button>
                                                                        <Button size="sm" variant="ghost" onClick={() => setNoteEditing(note.id, false)}>
                                                                            Cancelar
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center justify-between">
                                                                        <p className="text-sm flex-1">{note.text}</p>
                                                                        <div className="flex gap-1 ml-2">
                                                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setNoteEditing(note.id, true)}>
                                                                                <Edit2 className="h-4 w-4 text-blue-600" />
                                                                            </Button>
                                                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRequestDeleteNote(note.id)}>
                                                                                <X className="h-4 w-4 text-red-500" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {activeTab === 'attachments' && (
                                    <Card className="border-slate-200/60 shadow-sm">
                                        <CardHeader className="pb-4 border-b border-slate-100">
                                            <CardTitle className="text-lg font-semibold text-slate-800">Anexos</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                                <Paperclip className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                                                <p className="text-sm text-muted-foreground mb-3">
                                                    Arraste arquivos para cá ou clique para selecionar
                                                </p>
                                                <Button size="sm">
                                                    <Plus className="h-3 w-3 mr-2" />
                                                    Adicionar arquivos
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {activeTab === 'history' && (
                                    <Card className="border-slate-200/60 shadow-sm">
                                        <CardHeader className="pb-4 border-b border-slate-100">
                                            <CardTitle className="text-lg font-semibold text-slate-800">Histórico do Negócio</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                                                    <div>
                                                        <p className="text-sm font-medium">Negócio criado</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(deal.created_at).toLocaleString('pt-BR')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar - Stage Actions */}
                    <div className="bg-slate-50/80 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(88vh - 60px)' }}>
                        <div className="p-4 space-y-4">
                            <Card className="border-slate-200/60 shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-slate-700">Estágio Atual</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {stages.map(stage => (
                                        <button
                                            key={stage.id}
                                            onClick={() => onStageChange?.(stage.id)}
                                            className={cn(
                                                "w-full text-left p-2 rounded-md text-xs transition-colors flex items-center justify-between",
                                                stage.id === deal.stage_id 
                                                    ? "bg-blue-100 text-blue-800 border border-blue-200" 
                                                    : "hover:bg-slate-100 text-slate-600"
                                            )}
                                        >
                                            <span>{stage.name}</span>
                                            {stage.id === deal.stage_id && (
                                                <ChevronRight className="h-4 w-4 ml-2 text-blue-600" />
                                            )}
                                        </button>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200/60 shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-slate-700">Ações Rápidas</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full h-8 text-xs justify-start"
                                    >
                                        <Phone className="h-3 w-3 mr-2" />
                                        Ligar para Cliente
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full h-8 text-xs justify-start"
                                    >
                                        <Mail className="h-3 w-3 mr-2" />
                                        Enviar Email
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full h-8 text-xs justify-start"
                                    >
                                        <Calendar className="h-3 w-3 mr-2" />
                                        Agendar Reunião
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </DialogContent>

            {/* Entity Form Modal */}
            <EntityFormModal
                open={entityFormModal.open}
                onClose={() => setEntityFormModal({ ...entityFormModal, open: false })}
                onSave={handleSaveEntity}
                entityId={entityFormModal.entityId}
                entityName={entityFormModal.entityName}
                entitySlug={entityFormModal.entitySlug}
                fields={entityFormModal.fields}
                isLoading={isCreating || isUpdating}
                initialData={entityFormModal.editData}
            />
        </Dialog>
    );
} 