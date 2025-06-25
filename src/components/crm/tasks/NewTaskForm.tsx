import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { taskTypes } from './MockTaskData';
import { addTaskHistoryEntry } from '@/hooks/useTaskHistory';

interface NewTaskFormProps {
    onSave: (task: {
        id: string;
        title: string;
        description: string;
        type: string;
        status: string;
        priority: string;
        due_date: string;
        created_at: string;
        assigned_to: string;
        opportunity_id: string | null;
        opportunity_name: string | null;
        created_by: string;
        responsible: string;
        completed: boolean;
        is_scheduled: boolean;
    }) => void;
    onCancel: () => void;
}

export function NewTaskForm({ onSave, onCancel }: NewTaskFormProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: '',
        priority: 'medium',
        responsible: '',
        opportunity: '',
        due_date: undefined as Date | undefined,
        due_time: ''
    });

    const isScheduled = () => {
        if (!formData.due_date) return false;
        const now = new Date();
        const selectedDateTime = new Date(formData.due_date);
        if (formData.due_time) {
            const [hours, minutes] = formData.due_time.split(':');
            selectedDateTime.setHours(parseInt(hours), parseInt(minutes));
        }
        return selectedDateTime > now;
    };

    const getButtonText = () => {
        if (!formData.due_date && !formData.due_time) {
            return 'Concluir Tarefa';
        }
        return isScheduled() ? 'Agendar Tarefa' : 'Salvar Tarefa';
    };

    const handleSave = () => {
        if (!formData.title || !formData.type || !formData.priority || !formData.responsible) return;

        let dueDateTime: Date;
        let taskStatus = 'pending';

        // Se não tem data nem hora definidas, marca como concluída agora
        if (!formData.due_date && !formData.due_time) {
            dueDateTime = new Date();
            taskStatus = 'completed';
        } else {
            // Se tem data ou hora, usa a data informada ou hoje
            dueDateTime = formData.due_date || new Date();
            if (formData.due_time && formData.due_date) {
                const [hours, minutes] = formData.due_time.split(':');
                dueDateTime = new Date(formData.due_date);
                dueDateTime.setHours(parseInt(hours), parseInt(minutes));
            }
        }

        const taskId = `task-${Date.now()}`;

        const newTask = {
            id: taskId,
            title: formData.title,
            description: formData.description,
            type: formData.type,
            status: taskStatus,
            priority: formData.priority,
            due_date: dueDateTime.toISOString(),
            created_at: new Date().toISOString(),
            assigned_to: formData.responsible,
            opportunity_id: formData.opportunity || null,
            opportunity_name: formData.opportunity ? 'Oportunidade Selecionada' : null,
            created_by: 'Usuário Atual',
            responsible: formData.responsible,
            completed: taskStatus === 'completed',
            is_scheduled: isScheduled()
        };

        // Registrar criação da tarefa no histórico
        addTaskHistoryEntry(
            taskId,
            'created',
            `Tarefa criada: ${formData.title}`,
            undefined,
            undefined,
            undefined,
            {
                priority: formData.priority,
                assigned_to: formData.responsible,
                type: formData.type,
                is_scheduled: isScheduled()
            },
            'Usuário Atual',
            'usuario@nexflow.com'
        );

        // Se foi atribuída para alguém, registrar atribuição também
        if (formData.responsible) {
            addTaskHistoryEntry(
                taskId,
                'assigned',
                `Tarefa atribuída para ${formData.responsible}`,
                { assigned_to: { old: null, new: formData.responsible } },
                { assigned_to: null },
                { assigned_to: formData.responsible },
                { timestamp: new Date().toISOString() },
                'Usuário Atual',
                'usuario@nexflow.com'
            );
        }

        onSave(newTask);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <Input
                    placeholder="Título da tarefa"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="text-base border-gray-300 rounded-lg"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <Label className="text-sm text-gray-600">Tipo</Label>
                        <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                            <SelectTrigger className="border-gray-300 rounded-lg">
                                <SelectValue placeholder="Tipo da tarefa" />
                            </SelectTrigger>
                            <SelectContent>
                                {taskTypes.map(type => (
                                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <Label className="text-sm text-gray-600">Prioridade</Label>
                        <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                            <SelectTrigger className="border-gray-300 rounded-lg">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Baixa</SelectItem>
                                <SelectItem value="medium">Média</SelectItem>
                                <SelectItem value="high">Alta</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <Label className="text-sm text-gray-600">Responsável</Label>
                        <Select value={formData.responsible} onValueChange={(value) => setFormData(prev => ({ ...prev, responsible: value }))}>
                            <SelectTrigger className="border-gray-300 rounded-lg">
                                <SelectValue placeholder="Atribuir a..." />
                            </SelectTrigger>
                            <SelectContent>
                                {["João Silva", "Maria Santos", "Pedro Costa", "Ana Silva", "Carlos Oliveira"].map(name => (
                                    <SelectItem key={name} value={name}>{name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <Label className="text-sm text-gray-600">Oportunidade</Label>
                        <Select value={formData.opportunity} onValueChange={(value) => setFormData(prev => ({ ...prev, opportunity: value }))}>
                            <SelectTrigger className="border-gray-300 rounded-lg">
                                <SelectValue placeholder="Relacionar a..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="deal-1">Venda para ACME S.A.</SelectItem>
                                <SelectItem value="deal-2">Proposta para Beta Ltda.</SelectItem>
                                <SelectItem value="deal-3">Negociação com Gamma Inc.</SelectItem>
                                <SelectItem value="deal-4">Fechamento com Delta S/A</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <Label className="text-sm text-gray-600">Data</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start border-gray-300 rounded-lg text-left">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.due_date ? format(formData.due_date, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={formData.due_date}
                                    onSelect={(date) => setFormData(prev => ({ ...prev, due_date: date }))}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex flex-col gap-1">
                        <Label className="text-sm text-gray-600">Horário</Label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="time"
                                value={formData.due_time}
                                onChange={(e) => setFormData(prev => ({ ...prev, due_time: e.target.value }))}
                                className="pl-10 border-gray-300 rounded-lg"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <Label className="text-sm text-gray-600">Descrição</Label>
                    <Textarea
                        placeholder="Descreva os detalhes da tarefa"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className="border-gray-300 rounded-lg"
                    />
                </div>

                {isScheduled() && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-blue-700">
                            <CalendarIcon className="h-4 w-4" />
                            <div className="text-sm">
                                <div className="font-medium">Tarefa Agendada</div>
                                <div>
                                    {formData.due_date && format(formData.due_date, 'dd/MM/yyyy', { locale: ptBR })}
                                    {formData.due_time && ` às ${formData.due_time}`}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-2">
                    <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">Cancelar</Button>
                    <Button
                        onClick={handleSave}
                        disabled={!formData.title || !formData.type || !formData.priority || !formData.responsible}
                        className="w-full sm:w-auto"
                    >
                        {getButtonText()}
                    </Button>
                </div>
            </div>
        </div>
    );
}
