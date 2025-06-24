import { memo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Clock,
    Plus,
    Edit,
    CheckCircle,
    User,
    Trash2,
    ChevronDown,
    Activity,
    Eye
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import {
    useTaskHistory,
    useTaskHistoryStats,
    formatFieldChange,
    getActionConfig,
    TaskHistoryEntry
} from '@/hooks/useTaskHistory';

interface TaskHistoryTabProps {
    taskId: string;
}

const iconComponents = {
    Plus,
    Edit,
    CheckCircle,
    User,
    Trash2,
    Clock,
    Activity
};

export const TaskHistoryTab = memo(function TaskHistoryTab({
    taskId
}: TaskHistoryTabProps) {
    const { data: history = [], isLoading, error } = useTaskHistory(taskId);
    const { data: stats } = useTaskHistoryStats(taskId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    <span className="text-slate-600">Carregando histórico...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="text-center">
                    <div className="text-red-500 text-sm mb-2">Erro ao carregar histórico</div>
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                        Tentar novamente
                    </Button>
                </div>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="text-center">
                    <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-slate-900 font-medium mb-1">Nenhum histórico encontrado</h3>
                    <p className="text-slate-500 text-sm">As alterações desta tarefa aparecerão aqui</p>
                </div>
            </div>
        );
    }

    const HistoryEntryCard = ({ entry, isLast }: { entry: TaskHistoryEntry; isLast: boolean }) => {
        const config = getActionConfig(entry.action_type);
        const IconComponent = iconComponents[config.icon as keyof typeof iconComponents] || Clock;

        const hasDetails = entry.field_changes && Object.keys(entry.field_changes).length > 0;

        return (
            <div className="relative">
                {/* Timeline line */}
                {!isLast && (
                    <div className="absolute left-6 top-12 w-0.5 h-full bg-slate-200 -z-10" />
                )}

                <Card className="mb-3 hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0 ring-2 ring-white shadow-sm`}>
                                <IconComponent className={`w-5 h-5 ${config.color}`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-slate-900 text-sm">
                                            {entry.description}
                                        </h4>
                                        <Badge variant="outline" className={`${config.bgColor} ${config.color} border-0 text-xs`}>
                                            {config.label}
                                        </Badge>
                                    </div>

                                    <time className="text-xs text-slate-500 flex-shrink-0">
                                        {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </time>
                                </div>

                                {/* User info */}
                                {entry.user && (
                                    <div className="flex items-center gap-2 mb-3">
                                        <Avatar className="w-6 h-6">
                                            <AvatarFallback className="text-xs bg-slate-100 text-slate-600">
                                                {entry.user.name?.[0]?.toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs text-slate-600">
                                            {entry.user.name || entry.user.email}
                                        </span>
                                    </div>
                                )}

                                {/* Field changes */}
                                {hasDetails && (
                                    <Collapsible>
                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900">
                                                <Eye className="w-3 h-3 mr-1" />
                                                Ver detalhes
                                                <ChevronDown className="w-3 h-3 ml-1" />
                                            </Button>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="mt-3">
                                            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                                                <h5 className="text-xs font-medium text-slate-700 mb-2">Campos alterados:</h5>
                                                {Object.entries(entry.field_changes).map(([field, change]: [string, any]) => (
                                                    <div key={field} className="text-xs text-slate-600">
                                                        <code className="bg-white px-2 py-1 rounded text-slate-800 font-mono">
                                                            {formatFieldChange(field, change.old, change.new)}
                                                        </code>
                                                    </div>
                                                ))}

                                                {/* Metadata */}
                                                {entry.metadata && (
                                                    <div className="mt-3 pt-2 border-t border-slate-200">
                                                        <h6 className="text-xs font-medium text-slate-700 mb-1">Informações adicionais:</h6>
                                                        <pre className="text-xs text-slate-600 bg-white rounded p-2 overflow-x-auto">
                                                            {JSON.stringify(entry.metadata, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Statistics */}
            {stats && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Activity className="w-4 h-4 text-slate-600" />
                            <h3 className="font-medium text-slate-900">Resumo do Histórico</h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{stats.totalEntries}</div>
                                <div className="text-xs text-slate-600">Total de alterações</div>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{stats.actionCounts.created || 0}</div>
                                <div className="text-xs text-slate-600">Criações</div>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">{stats.actionCounts.updated || 0}</div>
                                <div className="text-xs text-slate-600">Atualizações</div>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{stats.actionCounts.status_changed || 0}</div>
                                <div className="text-xs text-slate-600">Mudanças de status</div>
                            </div>
                        </div>

                        {stats.lastChange && (
                            <>
                                <Separator className="my-3" />
                                <div className="text-xs text-slate-600">
                                    <strong>Última alteração:</strong> {stats.lastChange.description} em{' '}
                                    {format(new Date(stats.lastChange.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* History Timeline */}
            <div>
                <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Linha do Tempo
                </h3>

                <div className="space-y-0">
                    {history.map((entry, index) => (
                        <HistoryEntryCard
                            key={entry.id}
                            entry={entry}
                            isLast={index === history.length - 1}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
});

export default TaskHistoryTab; 