import { useState } from 'react';
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

interface NewTaskDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (task: any) => void;
}

export function NewTaskDialog({ open, onClose, onSave }: NewTaskDialogProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: '',
        priority: 'medium',
        responsible: '',
        opportunity: '',
        due_date: undefined as Date | undefined
    });

    const handleSave = () => {
        if (!formData.title || !formData.type || !formData.responsible) {
            return;
        }

        const newTask = {
            id: `task-${Date.now()}`,
            title: formData.title,
            description: formData.description,
            type: formData.type,
            status: 'pending',
            priority: formData.priority,
            due_date: formData.due_date?.toISOString() || new Date().toISOString(),
            created_at: new Date().toISOString(),
            assigned_to: formData.responsible,
            opportunity_id: formData.opportunity || null,
            opportunity_name: formData.opportunity ? 'Oportunidade Selecionada' : null,
            created_by: 'Usuário Atual',
            responsible: formData.responsible,
            completed: false
        };

        onSave(newTask);

        // Reset form
        setFormData({
            title: '',
            description: '',
            type: '',
            priority: 'medium',
            responsible: '',
            opportunity: '',
            due_date: undefined
        });

        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nova Tarefa</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Tipo */}
                    <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
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

                    {/* Responsável e Oportunidade */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Responsável</Label>
                            <Select value={formData.responsible} onValueChange={(value) => setFormData(prev => ({ ...prev, responsible: value }))}>
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
                            <Label>Oportunidade</Label>
                            <Select value={formData.opportunity} onValueChange={(value) => setFormData(prev => ({ ...prev, opportunity: value }))}>
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

                    {/* Botões */}
                    <div className="flex gap-2 pt-4">
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} className="flex-1">
                            Salvar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 