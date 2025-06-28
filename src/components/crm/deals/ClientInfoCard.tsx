import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Building2, Pencil, Phone, Mail, User, Users } from "lucide-react";
import { mockUsers } from "../flows/MockUsers";
import { ParticipantsMultiSelect } from "./ParticipantsMultiSelect";
import { cn } from "@/lib/utils";
import type { MockDeal } from "@/types/deals";

interface Responsible { id: string; name: string; }

export function ClientInfoCard({ deal, participants, setEditParticipants, editParticipants, users, setParticipants }: {
    deal: MockDeal,
    participants: string[],
    setEditParticipants: (b: boolean) => void,
    editParticipants: boolean,
    users: typeof mockUsers,
    setParticipants: (ids: string[]) => void
}) {
    const getUser = (id: string) => users.find((u) => u.id === id);
    const names = participants.map(id => {
        const u = getUser(id);
        if (u) return `${u.first_name} ${u.last_name}`;
        if (deal.responsibles && Array.isArray(deal.responsibles)) {
            const responsible = deal.responsibles.find((r: Responsible) => r.id === id);
            if (responsible && responsible.name) return responsible.name;
        }
        if (participants.length === 1 && ((deal as unknown) as { [key: string]: unknown })['responsible_name']) return ((deal as unknown) as { [key: string]: unknown })['responsible_name'] as string;
        return "";
    }).filter(Boolean);
    const Icon = participants.length > 1 ? Users : User;
    return (
        <Card className="border-0 bg-white/60 backdrop-blur-lg rounded-2xl overflow-hidden">
            <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row items-center gap-4 px-7 pt-7 pb-3 border-b border-slate-100/60 bg-gradient-to-br from-white/80 to-blue-50/60">
                    <div className="relative">
                        <Avatar className="h-20 w-20 ring-4 ring-blue-400/30 shadow-lg border-2 border-white">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${deal.id}`} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                {deal.title.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-2 -right-2 bg-white rounded-full shadow p-1 border border-slate-200">
                            <Icon className="h-5 w-5 text-blue-500" />
                        </span>
                    </div>
                    <div className="flex-1 min-w-0 w-full text-center sm:text-left">
                        <h3 className="font-extrabold text-xl text-slate-800 break-words leading-tight mb-1 tracking-tight">
                            {deal.title}
                        </h3>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-500 mt-1">
                            <Building2 className="h-4 w-4" />
                            <span className="truncate max-w-[120px] font-semibold">Empresa Exemplo</span>
                            {deal.tags && deal.tags.length > 0 && (
                                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 border-0 font-semibold">
                                    {deal.tags[0]}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                <div className="px-7 py-4 border-b border-slate-100/60 bg-white/70">
                    <div className="mb-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Participante{names.length > 1 ? 's' : ''}</div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700 group relative">
                                    <span className="flex-1 font-semibold whitespace-pre-line break-words min-w-0">
                                        {names.join(", ")}
                                    </span>
                                    <button
                                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-1 rounded hover:bg-slate-100"
                                        onClick={() => setEditParticipants(true)}
                                        title="Editar participantes"
                                        type="button"
                                    >
                                        <Pencil className="h-4 w-4 text-slate-500" />
                                    </button>
                                    {editParticipants && (
                                        <ParticipantsMultiSelect value={participants} onChange={setParticipants} setEditParticipants={setEditParticipants} />
                                    )}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>Responsável(is) pelo negócio</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div className="px-7 py-4 border-b border-slate-100/60 bg-white/80">
                    <div className="mb-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Contato</div>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                            <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg shadow-sm">
                                <Phone className="h-4 w-4 text-blue-500" />
                            </div>
                            <span className="flex-1 truncate font-medium">+55 11 99999-9999</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                                <Phone className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                            <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg shadow-sm">
                                <Mail className="h-4 w-4 text-green-500" />
                            </div>
                            <span className="flex-1 truncate font-medium">joao@empresa.com</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 transition-colors"
                            >
                                <Mail className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="px-7 py-4 bg-white/90">
                    <div className="mb-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Empresa</div>
                    <div className="flex items-center gap-3 text-xs text-slate-700">
                        <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg shadow-sm">
                            <Building2 className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="font-semibold truncate">Empresa Exemplo</span>
                        <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 border-0 ml-2 font-semibold">Saúde</Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 