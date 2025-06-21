import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import {
    User,
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
    Video,
    Send,
    AlertCircle,
    ChevronRight,
    X,
    Thermometer,
    CalendarDays,
    PlayCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface MockDeal {
    id: string;
    title: string;
    value?: number;
    company_id?: string;
    person_id?: string;
    stage_id: string;
    position: number;
    created_at: string;
    tags?: string[];
    temperature?: string;
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

// Client Info Card Component
function ClientInfoCard({ deal }: { deal: MockDeal }) {
    return (
        <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${deal.id}`} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                            {deal.title.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base text-slate-800 truncate">{deal.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <Building2 className="h-4 w-4" />
                            <span className="truncate">Empresa Exemplo</span>
                            {deal.tags && deal.tags.length > 0 && (
                                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 border-0">
                                    {deal.tags[0]}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg">
                            <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <span className="flex-1 truncate font-medium">João Silva</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg">
                            <Phone className="h-4 w-4 text-slate-500" />
                        </div>
                        <span className="flex-1 truncate">+55 11 99999-9999</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                            <Phone className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg">
                            <Mail className="h-4 w-4 text-slate-500" />
                        </div>
                        <span className="flex-1 truncate">joao@empresa.com</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 transition-colors"
                        >
                            <Mail className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Deal Value Card Component
function DealValueCard({ deal }: { deal: MockDeal }) {
    const getTemperatureConfig = (temp?: string) => {
        switch (temp) {
            case 'hot': return {
                label: 'Quente',
                color: 'bg-red-100 text-red-700 border-red-200',
                icon: Thermometer,
                iconColor: 'text-red-500'
            };
            case 'warm': return {
                label: 'Morno',
                color: 'bg-orange-100 text-orange-700 border-orange-200',
                icon: Thermometer,
                iconColor: 'text-orange-500'
            };
            case 'cold': return {
                label: 'Frio',
                color: 'bg-blue-100 text-blue-700 border-blue-200',
                icon: Thermometer,
                iconColor: 'text-blue-500'
            };
            default: return {
                label: 'Novo',
                color: 'bg-gray-100 text-gray-700 border-gray-200',
                icon: Thermometer,
                iconColor: 'text-gray-500'
            };
        }
    };

    const tempConfig = getTemperatureConfig(deal.temperature);
    const TempIcon = tempConfig.icon;

    return (
        <div className="space-y-3">
            {/* Card do Valor */}
            <Card className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-green-50/60 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-xl">
                            <DollarSign className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-600 mb-1">Valor do Negócio</p>
                            <p className="text-xl font-bold text-emerald-700 truncate">
                                {deal.value ? deal.value.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL"
                                }) : "Não informado"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Card da Temperatura */}
            <Card className="border-slate-200/60 bg-white/70 backdrop-blur-sm shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${tempConfig.icon === Thermometer ? 'bg-orange-100' : 'bg-slate-100'
                            }`}>
                            <TempIcon className={`h-5 w-5 ${tempConfig.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-600 mb-1">Temperatura</p>
                            <Badge className={`${tempConfig.color} font-medium px-3 py-1 text-sm border-0`}>
                                {tempConfig.label}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Card da Data */}
            <Card className="border-blue-200/60 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl">
                            <CalendarDays className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-600 mb-1">Data Esperada</p>
                            <Button
                                variant="ghost"
                                className="h-auto p-0 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                            >
                                + Adicionar data
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Main Component
export function DealDetailsDialog({ open, deal, stages, onClose, onStageChange }: DealDetailsDialogProps) {
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
        { id: 'overview', label: 'Visão Geral', icon: FileText },
        { id: 'tasks', label: 'Tarefas', icon: CheckCircle2 },
        { id: 'activities', label: 'Atividades', icon: MessageSquare },
        { id: 'attachments', label: 'Anexos', icon: Paperclip },
        { id: 'history', label: 'Histórico', icon: History },
    ];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <style>{scrollbarStyles}</style>
            <DialogContent className="max-w-7xl w-full h-[88vh] p-0 overflow-hidden">
                {/* Grid Layout with aligned headers */}
                <div className="grid grid-cols-[320px_1fr_280px] grid-rows-[auto_1fr] h-full">
                    {/* Headers Row - All aligned horizontally */}
                    <div className="bg-white/95 backdrop-blur-sm border-b border-slate-200/60 px-5 py-3 flex items-center">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold text-slate-800">
                                Detalhes do Negócio
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="bg-white border-b border-slate-200/60 px-5 py-3 flex items-center">
                        <div className="flex items-center gap-0">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        className={cn(
                                            "relative px-3 py-2 text-sm font-medium transition-all duration-300 ease-out",
                                            "hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-md",
                                            activeTab === tab.id
                                                ? "text-blue-600 bg-blue-50/50"
                                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50/50"
                                        )}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Icon className="h-4 w-4" />
                                            {tab.label}
                                        </div>
                                        {/* Active indicator */}
                                        {activeTab === tab.id && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white/95 backdrop-blur-sm border-b border-l border-slate-200/60 px-4 py-3 flex items-center">
                        <h3 className="text-base font-semibold text-slate-800">Ações do Negócio</h3>
                    </div>

                    {/* Content Row - All with independent scroll */}
                    {/* Left Sidebar - Client Info */}
                    <div className="bg-slate-50/80 border-r border-slate-200/60 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(88vh - 60px)' }}>
                        <div className="px-5 py-5 space-y-5">
                            <ClientInfoCard deal={deal} />
                            <DealValueCard deal={deal} />
                            {/* Adicionando mais conteúdo para testar scroll */}
                            <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-sm">
                                <CardContent className="p-4">
                                    <h4 className="font-semibold text-sm text-slate-800 mb-3">Histórico de Interações</h4>
                                    <div className="space-y-2 text-xs text-slate-600">
                                        <div className="flex justify-between">
                                            <span>Última ligação:</span>
                                            <span>15/01/2024</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Último email:</span>
                                            <span>10/01/2024</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Reunião agendada:</span>
                                            <span>20/01/2024</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-sm">
                                <CardContent className="p-4">
                                    <h4 className="font-semibold text-sm text-slate-800 mb-3">Observações</h4>
                                    <p className="text-xs text-slate-600">
                                        Cliente demonstrou interesse em expandir os serviços.
                                        Próxima reunião para apresentar proposta completa.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="bg-white overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(88vh - 60px)' }}>
                        <div className="px-5 py-5 min-h-full">
                            <div className={cn(
                                "transition-all duration-300 ease-out",
                                "animate-in fade-in-0 slide-in-from-bottom-2"
                            )}>
                                {activeTab === 'overview' && (
                                    <Card className="border-slate-200/60 shadow-sm">
                                        <CardHeader className="pb-4 border-b border-slate-100">
                                            <CardTitle className="text-lg font-semibold text-slate-800">Informações do Negócio</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="space-y-5">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                                        Quais serviços o cliente está adquirindo?
                                                    </label>
                                                    <Input
                                                        value={form.services}
                                                        onChange={e => setForm(f => ({ ...f, services: e.target.value }))}
                                                        placeholder="Digite os serviços..."
                                                        className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">Descontos</label>
                                                    <Input
                                                        value={form.discounts}
                                                        onChange={e => setForm(f => ({ ...f, discounts: e.target.value }))}
                                                        placeholder="Digite os descontos..."
                                                        className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                                        Data de validade da proposta
                                                    </label>
                                                    <Input
                                                        value={form.validity}
                                                        onChange={e => setForm(f => ({ ...f, validity: e.target.value }))}
                                                        placeholder="DD/MM/AAAA"
                                                        className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">Proposta</label>
                                                    <Textarea
                                                        value={form.proposal}
                                                        onChange={e => setForm(f => ({ ...f, proposal: e.target.value }))}
                                                        placeholder="Digite a proposta detalhada..."
                                                        rows={4}
                                                        className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 resize-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">Observações Adicionais</label>
                                                    <Textarea
                                                        placeholder="Adicione observações importantes sobre este negócio..."
                                                        rows={3}
                                                        className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 resize-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">Próximos Passos</label>
                                                    <Textarea
                                                        placeholder="Defina os próximos passos para este negócio..."
                                                        rows={3}
                                                        className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 resize-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">Concorrência</label>
                                                    <Input
                                                        placeholder="Informe sobre a concorrência..."
                                                        className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">Budget do Cliente</label>
                                                    <Input
                                                        placeholder="Qual o orçamento disponível?"
                                                        className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {activeTab === 'tasks' && (
                                    <QuickTasksPanel dealId={deal.id} />
                                )}

                                {activeTab === 'activities' && (
                                    <Card className="border-slate-200/60 shadow-sm">
                                        <CardHeader className="pb-4 border-b border-slate-100">
                                            <CardTitle className="text-lg font-semibold text-slate-800">Atividades e Comentários</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6 space-y-4">
                                            <div className="flex gap-2">
                                                <Input
                                                    value={activity}
                                                    onChange={e => setActivity(e.target.value)}
                                                    placeholder="Escreva seu comentário aqui..."
                                                    className="flex-1"
                                                    onKeyDown={e => {
                                                        if (e.key === "Enter" && activity.trim()) {
                                                            setActivities(a => [
                                                                {
                                                                    id: Date.now(),
                                                                    text: activity,
                                                                    date: new Date().toISOString(),
                                                                    author: 'Você'
                                                                },
                                                                ...a
                                                            ]);
                                                            setActivity("");
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    onClick={() => {
                                                        if (activity.trim()) {
                                                            setActivities(a => [
                                                                {
                                                                    id: Date.now(),
                                                                    text: activity,
                                                                    date: new Date().toISOString(),
                                                                    author: 'Você'
                                                                },
                                                                ...a
                                                            ]);
                                                            setActivity("");
                                                        }
                                                    }}
                                                >
                                                    <Send className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="space-y-3">
                                                {activities.length === 0 ? (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                        <p className="text-sm">Nenhuma atividade registrada</p>
                                                        <p className="text-xs">Adicione um comentário para começar</p>
                                                    </div>
                                                ) : (
                                                    activities.map(activity => (
                                                        <div key={activity.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarFallback className="text-xs">
                                                                    {activity.author.substring(0, 2).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-sm font-medium">{activity.author}</span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {new Date(activity.date).toLocaleString('pt-BR')}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm">{activity.text}</p>
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
                    <div className="bg-slate-50/80 border-l border-slate-200/60 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(88vh - 60px)' }}>
                        <div className="px-4 py-5 space-y-4">
                            <Card className="border-slate-200/60 shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-slate-700">Mover para Etapa</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {stages.map(stage => (
                                        <button
                                            key={stage.id}
                                            className={cn(
                                                "w-full flex items-center justify-start px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                                                "hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                                                stage.id === deal.stage_id
                                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                    : "text-slate-600 hover:text-slate-700 border border-transparent"
                                            )}
                                            onClick={() => onStageChange(stage.id)}
                                            disabled={stage.id === deal.stage_id}
                                        >
                                            {stage.id === deal.stage_id && (
                                                <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />
                                            )}
                                            <span className="truncate flex-1 text-left">{stage.name}</span>
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
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full h-8 text-xs justify-start"
                                    >
                                        <FileText className="h-3 w-3 mr-2" />
                                        Gerar Proposta
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200/60 shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-slate-700">Informações</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-xs text-slate-600">
                                    <div>
                                        <span className="font-medium">Criado em:</span>
                                        <p>{new Date(deal.created_at).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium">Responsável:</span>
                                        <p>João Silva</p>
                                    </div>
                                    <div>
                                        <span className="font-medium">Origem:</span>
                                        <p>Website</p>
                                    </div>
                                    <div>
                                        <span className="font-medium">Prioridade:</span>
                                        <Badge variant="secondary" className="text-xs">Alta</Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200/60 shadow-sm">
                                <CardContent className="p-4 space-y-3">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="w-full h-9 text-sm font-medium"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Marcar como Perdido
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full h-9 text-sm font-medium border-slate-200 hover:bg-slate-50"
                                        onClick={onClose}
                                    >
                                        Fechar
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 