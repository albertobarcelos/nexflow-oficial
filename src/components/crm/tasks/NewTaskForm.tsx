import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarIcon, Clock, Mic, Square } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { taskTypes } from './MockTaskData';
import { addTaskHistoryEntry } from '@/hooks/useTaskHistory';
import { useToast } from '@/components/ui/use-toast';

// Interfaces para Web Speech API
interface SpeechRecognitionResult {
    [index: number]: {
        transcript: string;
        confidence: number;
    };
}

interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    length: number;
}

interface SpeechRecognitionEvent {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
    error: string;
    message: string;
}

interface ISpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: (() => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
}

// Declarações de tipos para Web Speech API
declare global {
    interface Window {
        SpeechRecognition: {
            new(): ISpeechRecognition;
        };
        webkitSpeechRecognition: {
            new(): ISpeechRecognition;
        };
    }
}

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
    const { toast } = useToast();
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

    // Estados para o microfone
    const [isListening, setIsListening] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [recognition, setRecognition] = useState<any>(null);
    const [shouldContinueListening, setShouldContinueListening] = useState(false);

    // Inicializar Speech Recognition
    const initSpeechRecognition = () => {
        // Verificar se a API está disponível
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            toast({
                title: "Recurso não disponível",
                description: "Seu navegador não suporta reconhecimento de voz.",
                variant: "destructive"
            });
            return null;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'pt-BR';

        recognition.onstart = () => {
            setIsListening(true);
            setShouldContinueListening(true);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i] && event.results[i][0]) {
                    // Só adiciona se for um resultado final (não intermediário)
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
            }

            // Só adiciona ao campo se houver texto final
            if (finalTranscript.trim()) {
                setFormData(prev => ({
                    ...prev,
                    description: prev.description + finalTranscript + ' '
                }));
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);

            let errorMessage = 'Erro no reconhecimento de voz.';
            if (event.error === 'not-allowed') {
                errorMessage = 'Permissão de microfone negada. Permita o acesso ao microfone nas configurações do navegador.';
            } else if (event.error === 'no-speech') {
                errorMessage = 'Nenhuma fala detectada. Tente novamente.';
            }

            toast({
                title: "Erro no reconhecimento de voz",
                description: errorMessage,
                variant: "destructive"
            });
        };

        recognition.onend = () => {
            // Se ainda deve continuar ouvindo, reinicia automaticamente
            if (shouldContinueListening) {
                try {
                    setTimeout(() => {
                        recognition.start();
                    }, 100);
                } catch (error) {
                    console.log('Erro ao reiniciar reconhecimento:', error);
                    setIsListening(false);
                    setShouldContinueListening(false);
                }
            } else {
                setIsListening(false);
            }
        };

        return recognition;
    };

    // Solicitar permissão e iniciar gravação
    const startVoiceRecording = async () => {
        try {
            // Solicitar permissão para o microfone
            await navigator.mediaDevices.getUserMedia({ audio: true });

            const speechRecognition = initSpeechRecognition();
            if (speechRecognition) {
                setRecognition(speechRecognition);
                speechRecognition.start();

                toast({
                    title: "Gravação iniciada",
                    description: "Fale agora para transcrever a descrição da tarefa.",
                });
            }
        } catch (error) {
            console.error('Error accessing microphone:', error);
            toast({
                title: "Erro de permissão",
                description: "Não foi possível acessar o microfone. Verifique as permissões do navegador.",
                variant: "destructive"
            });
        }
    };

    // Parar gravação
    const stopVoiceRecording = () => {
        setShouldContinueListening(false);
        if (recognition) {
            recognition.stop();
            setRecognition(null);
        }
        setIsListening(false);

        toast({
            title: "Gravação finalizada",
            description: "A transcrição foi adicionada à descrição.",
        });
    };

    // Toggle do microfone
    const toggleVoiceRecording = () => {
        if (isListening) {
            stopVoiceRecording();
        } else {
            startVoiceRecording();
        }
    };

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
                                    defaultMonth={new Date()}
                                    initialFocus
                                    className="p-2 w-[280px]"
                                    classNames={{
                                        month: "space-y-3 w-full",
                                        caption: "flex justify-between items-center pt-1 mb-3",
                                        table: "w-full border-collapse space-y-1",
                                        head_row: "flex justify-between w-full",
                                        head_cell: "text-muted-foreground rounded-md w-8 font-normal text-xs text-center",
                                        row: "flex w-full mt-1 justify-between",
                                        cell: "relative flex items-center justify-center h-8 w-8 text-center text-sm p-0",
                                        day: "h-7 w-7 p-0 font-normal hover:bg-accent hover:text-accent-foreground rounded-md text-sm",
                                        day_selected: "bg-orange-500 text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                                        day_today: "bg-accent text-accent-foreground font-semibold",
                                        day_outside: "text-muted-foreground opacity-50",
                                        day_disabled: "text-muted-foreground opacity-30",
                                    }}
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
                    <div className="relative">
                        <Textarea
                            placeholder="Descreva os detalhes da tarefa ou clique no ícone do microfone para falar"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={4}
                            className="border-gray-300 rounded-lg pr-12"
                        />

                        {/* Botão do microfone sobreposto */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={toggleVoiceRecording}
                                        className={`absolute top-2 right-2 h-8 w-8 p-0 z-10 transition-all duration-200 ${isListening
                                            ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100 shadow-lg'
                                            : 'bg-white hover:bg-blue-50 hover:border-blue-300 shadow-sm'
                                            }`}
                                    >
                                        {isListening ? (
                                            <div className="relative">
                                                <Square className="h-4 w-4 fill-current" />
                                                {/* Animação de pulso quando ouvindo */}
                                                <span className="absolute -top-1 -right-1 h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                </span>
                                            </div>
                                        ) : (
                                            <Mic className="h-4 w-4" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                    <p className="text-sm">
                                        {isListening
                                            ? 'Clique para parar a gravação de voz'
                                            : 'Clique para gravar descrição por voz'
                                        }
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {isListening && (
                            <div className="absolute inset-0 bg-blue-50/50 border-2 border-blue-300 rounded-lg pointer-events-none flex items-center justify-center">
                                <div className="bg-white/90 rounded-lg px-4 py-2 shadow-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                        <span className="text-sm text-blue-700 font-medium">Ouvindo...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
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
