import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { taskTypes } from './MockTaskData';

interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'todo' | 'doing' | 'done' | 'pending' | 'completed';
    priority: 'low' | 'medium' | 'high';
    assigned_to: string | null;
    due_date: string;
    created_at?: string;
    responsible?: string;
    completed?: boolean;
    type?: string;
    opportunity_id?: string | null;
    opportunity_name?: string | null;
    assigned_to_collaborator?: {
        name: string;
    };
}

interface EditTaskDialogProps {
    task: Task | null;
    open: boolean;
    onClose: () => void;
    onSave: (task: Task) => void;
}

export function EditTaskDialog({ task, open, onClose, onSave }: EditTaskDialogProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: undefined as string | undefined,
        priority: 'medium' as 'low' | 'medium' | 'high',
        responsible: undefined as string | undefined,
        opportunity: undefined as string | undefined,
        due_date: undefined as Date | undefined
    });

    // Populate form when task changes
    useEffect(() => {
        if (task && open) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                type: task.type || 'call',
                priority: task.priority || 'medium',
                responsible: task.responsible || task.assigned_to_collaborator?.name || undefined,
                opportunity: task.opportunity_id || undefined,
                due_date: task.due_date ? new Date(task.due_date) : undefined
            });
        } else {
            // Reset form when dialog closes
            setFormData({
                title: '',
                description: '',
                type: undefined,
                priority: 'medium',
                responsible: undefined,
                opportunity: undefined,
                due_date: undefined
            });
        }
    }, [task, open]);

    const handleSave = () => {
        if (!task || !formData.title || !formData.type || !formData.responsible) {
            return;
        }

        const updatedTask: Task = {
            ...task,
            title: formData.title,
            description: formData.description,
            type: formData.type,
            priority: formData.priority,
            due_date: formData.due_date?.toISOString() || task.due_date,
            responsible: formData.responsible,
            assigned_to: formData.responsible,
            opportunity_id: formData.opportunity || null,
            opportunity_name: formData.opportunity ? 'Oportunidade Selecionada' : null,
            assigned_to_collaborator: formData.responsible ? { name: formData.responsible } : undefined
        };

        onSave(updatedTask);
        onClose();
    };

    if (!task) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Tarefa</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Tipo */}
                    <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select value={formData.type || undefined} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                {taskTypes.map(type => (
                                    <SelectItem key={type.id} value={type.id}>
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Título */}
                    <div className="space-y-2">
                        <Label>Título</Label>
                        <Input
                            placeholder="Insira o título da Tarefa"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        />
                    </div>

                    {/* Descrição */}
                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea
                            placeholder="Descreva o que foi ou deve ser feito"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                        />
                    </div>

                    {/* Prioridade */}
                    <div className="space-y-2">
                        <Label>Prioridade</Label>
                        <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setFormData(prev => ({ ...prev, priority: value }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a prioridade" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Baixa</SelectItem>
                                <SelectItem value="medium">Média</SelectItem>
                                <SelectItem value="high">Alta</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Responsável e Oportunidade */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Responsável</Label>
                            <Select value={formData.responsible || undefined} onValueChange={(value) => setFormData(prev => ({ ...prev, responsible: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Usuário" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="João Silva">João Silva</SelectItem>
                                    <SelectItem value="Maria Santos">Maria Santos</SelectItem>
                                    <SelectItem value="Pedro Costa">Pedro Costa</SelectItem>
                                    <SelectItem value="Ana Silva">Ana Silva</SelectItem>
                                    <SelectItem value="Carlos Oliveira">Carlos Oliveira</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center justify-between">
                                Oportunidade
                                {formData.opportunity && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-1 text-xs text-slate-500 hover:text-slate-700"
                                        onClick={() => setFormData(prev => ({ ...prev, opportunity: undefined }))}
                                    >
                                        Limpar
                                    </Button>
                                )}
                            </Label>
                            <Select value={formData.opportunity || undefined} onValueChange={(value) => setFormData(prev => ({ ...prev, opportunity: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a Oportunidade" />
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

                    {/* Data e Horário */}
                    <div className="space-y-2">
                        <Label>Data e Horário</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-left font-normal"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.due_date ? format(formData.due_date, "PPP", { locale: ptBR }) : "Data, hora"}
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

                    {/* Informações da tarefa */}
                    <div className="bg-slate-50 p-3 rounded-lg space-y-1 text-sm text-slate-600">
                        <p><strong>ID:</strong> {task.id}</p>
                        {task.created_at && (
                            <p><strong>Criada em:</strong> {new Date(task.created_at).toLocaleDateString('pt-BR')}</p>
                        )}
                        <p><strong>Status atual:</strong> {
                            task.status === 'completed' || task.status === 'done' ? 'Concluída' :
                                task.status === 'doing' ? 'Em Andamento' : 'A Fazer'
                        }</p>
                    </div>

                    {/* Botões */}
                    <div className="flex gap-2 pt-4">
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="flex-1"
                            disabled={!formData.title.trim() || !formData.type || !formData.responsible}
                        >
                            Salvar Alterações
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 