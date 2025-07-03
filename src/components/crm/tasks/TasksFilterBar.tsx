import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { List, Users, Phone, Mail, CheckCircle, Clock, Filter, Handshake, FileText } from 'lucide-react';
import React from 'react';

interface TasksFilterBarProps {
    showStatusFilter?: boolean;
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
    periodFilter: string;
    onPeriodFilterChange: (value: string) => void;
    priorityFilter: string;
    onPriorityFilterChange: (value: string) => void;
    typeFilter: string;
    onTypeFilterChange: (value: string) => void;
    pendingCount?: number;
    completedCount?: number;
    totalCount?: number;
}

export const TasksFilterBar: React.FC<TasksFilterBarProps> = ({
    showStatusFilter = false,
    statusFilter,
    onStatusFilterChange,
    periodFilter,
    onPeriodFilterChange,
    priorityFilter,
    onPriorityFilterChange,
    typeFilter,
    onTypeFilterChange,
    pendingCount = 0,
    completedCount = 0,
    totalCount = 0
}) => (
    <div className="flex items-center justify-between border-t border-slate-200 pt-3 pb-0 px-0 md:px-0 mt-0">
        {/* Esquerda: Ícone e texto 'Filtros' */}
        <div className="flex items-center gap-2 min-w-fit">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-700 font-semibold text-sm">Filtros</span>
        </div>
        {/* Direita: Filtros */}
        <div className="flex flex-wrap items-center gap-3 justify-end w-full md:w-auto">
            {showStatusFilter && (
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-600 text-xs font-medium whitespace-nowrap">Status:</span>
                    <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                        <SelectTrigger className="w-36 h-8 text-xs bg-slate-100 border-none focus:ring-0 focus:outline-none">
                            <SelectValue>
                                {statusFilter === 'all' && <span className="flex items-center gap-2"><List className="w-4 h-4 text-slate-400" />Todas ({totalCount})</span>}
                                {statusFilter === 'pending' && <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" />Pendentes ({pendingCount})</span>}
                                {statusFilter === 'completed' && <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />Finalizadas ({completedCount})</span>}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all"><span className="flex items-center gap-2"><List className="w-4 h-4 text-slate-400" />Todas ({totalCount})</span></SelectItem>
                            <SelectItem value="pending"><span className="flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" />Pendentes ({pendingCount})</span></SelectItem>
                            <SelectItem value="completed"><span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />Finalizadas ({completedCount})</span></SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
            {/* Filtro por período */}
            <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-600 text-xs font-medium whitespace-nowrap">Período:</span>
                <Select value={periodFilter} onValueChange={onPeriodFilterChange}>
                    <SelectTrigger className="w-32 h-8 text-xs bg-slate-100 border-none focus:ring-0 focus:outline-none">
                        <SelectValue>{
                            periodFilter === 'all' ? 'Todas' :
                                periodFilter === 'today' ? 'Hoje' :
                                    periodFilter === 'week' ? 'Esta semana' : ''
                        }</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="today">Hoje</SelectItem>
                        <SelectItem value="week">Esta semana</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {/* Filtro por prioridade */}
            <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-600 text-xs font-medium whitespace-nowrap">Prioridade:</span>
                <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
                    <SelectTrigger className="w-32 h-8 text-xs bg-slate-100 border-none focus:ring-0 focus:outline-none">
                        <SelectValue>{
                            priorityFilter === 'all' ? 'Todas' :
                                priorityFilter === 'high' ? 'Alta' :
                                    priorityFilter === 'medium' ? 'Média' :
                                        priorityFilter === 'low' ? 'Baixa' : ''
                        }</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {/* Filtro por tipo */}
            <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-600 text-xs font-medium whitespace-nowrap">Tipo:</span>
                <Select value={typeFilter} onValueChange={onTypeFilterChange}>
                    <SelectTrigger className="w-36 h-8 text-xs bg-slate-100 border-none focus:ring-0 focus:outline-none">
                        <SelectValue>
                            {typeFilter === 'all' && <span className="flex items-center gap-2">Todos</span>}
                            {typeFilter === 'E-mail' && <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-blue-500" />E-mail</span>}
                            {typeFilter === 'Ligação' && <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-green-500" />Ligação</span>}
                            {typeFilter === 'Reunião' && <span className="flex items-center gap-2"><Users className="w-4 h-4 text-purple-500" />Reunião</span>}
                            {typeFilter === 'Negociação' && <span className="flex items-center gap-2"><Handshake className="w-4 h-4 text-yellow-500" />Negociação</span>}
                            {typeFilter === 'Proposta' && <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-orange-500" />Proposta</span>}
                            {typeFilter === 'Follow-up' && <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" />Follow-up</span>}
                            {typeFilter === 'Demonstração' && <span className="flex items-center gap-2"><Users className="w-4 h-4 text-indigo-500" />Demonstração</span>}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all"><span className="flex items-center gap-2"><Filter className="w-4 h-4 text-slate-400" />Todos</span></SelectItem>
                        <SelectItem value="E-mail"><span className="flex items-center gap-2"><Mail className="w-4 h-4 text-blue-500" />E-mail</span></SelectItem>
                        <SelectItem value="Ligação"><span className="flex items-center gap-2"><Phone className="w-4 h-4 text-green-500" />Ligação</span></SelectItem>
                        <SelectItem value="Reunião"><span className="flex items-center gap-2"><Users className="w-4 h-4 text-purple-500" />Reunião</span></SelectItem>
                        <SelectItem value="Negociação"><span className="flex items-center gap-2"><Handshake className="w-4 h-4 text-yellow-500" />Negociação</span></SelectItem>
                        <SelectItem value="Proposta"><span className="flex items-center gap-2"><FileText className="w-4 h-4 text-orange-500" />Proposta</span></SelectItem>
                        <SelectItem value="Follow-up"><span className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" />Follow-up</span></SelectItem>
                        <SelectItem value="Demonstração"><span className="flex items-center gap-2"><Users className="w-4 h-4 text-indigo-500" />Demonstração</span></SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    </div>
); 