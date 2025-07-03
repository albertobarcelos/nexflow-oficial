import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { User, Phone, Mail, Building2, Calendar, DollarSign } from "lucide-react";

// Use the same type as in FlowPage
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

interface DealDetailsDialogProps {
    open: boolean;
    deal: MockDeal | null;
    stages: Stage[];
    onClose: () => void;
    onStageChange: (stageId: string) => void;
}

const mockActivities = [
    // Exemplo de atividades
    // { id: 1, text: "Comentário de teste", date: "2024-05-19" },
];

export function DealDetailsDialog({ open, deal, stages, onClose, onStageChange }: DealDetailsDialogProps) {
    const [form, setForm] = useState({
        services: "",
        discounts: "",
        validity: "",
        proposal: "",
    });
    const [activity, setActivity] = useState("");
    const [activities, setActivities] = useState(mockActivities);
    const [tab, setTab] = useState<'form' | 'attachments' | 'history' | 'checklists' | 'comments' | 'email' | 'pdf' | 'onboarding' | 'companies' | 'contacts' | 'activities' | 'opportunity'>('form');

    if (!deal) return null;

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-6xl w-full p-0 overflow-hidden">
                <div className="flex h-[90vh]">
                    {/* Esquerda: Info básica */}
                    <div className="w-80 border-r flex-1">
                        {/* Fixed header */}
                        <div className="p-4 border-b">
                            <div className="flex items-center gap-2">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${deal.id}`} className="w-10 h-10 rounded-full" />
                                <div>
                                    <div className="font-semibold text-lg ">{deal.title}</div>
                                    <div className="text-xs gap-2 text-gray-500">
                                        Negócio • {deal.company_id || "Empresa"}
                                        <Badge variant="outline" className="text-xs ml-2">{deal.tags?.join(", ")}</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Scrollable content */}
                        <div className="flex-1 p-4 overflow-y-auto">
                            {/* Choice chip tabBar */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                <button
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${tab === 'form' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                    onClick={() => setTab('form')}
                                >Formulário</button>
                                <button
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${tab === 'opportunity' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                    onClick={() => setTab('opportunity')}
                                >Oportunidade</button>
                                <button
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${tab === 'attachments' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                    onClick={() => setTab('attachments')}
                                >Anexos</button>
                                <button
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${tab === 'checklists' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                    onClick={() => setTab('checklists')}
                                >Checklists</button>
                                <button
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${tab === 'comments' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                    onClick={() => setTab('comments')}
                                >Comentários</button>
                                <button
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${tab === 'email' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                    onClick={() => setTab('email')}
                                >Email</button>
                                <button
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${tab === 'pdf' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                    onClick={() => setTab('pdf')}
                                >PDF</button>
                                <button
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${tab === 'onboarding' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                    onClick={() => setTab('onboarding')}
                                >Onboarding de Clientes</button>
                                <button
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${tab === 'companies' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                    onClick={() => setTab('companies')}
                                >Empresas</button>
                                <button
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${tab === 'contacts' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                    onClick={() => setTab('contacts')}
                                >Contatos</button>
                                <button
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${tab === 'activities' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                    onClick={() => setTab('activities')}
                                >Atividades</button>
                                <button
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${tab === 'history' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                    onClick={() => setTab('history')}
                                >Histórico</button>
                            </div>
                            {/* Contact info */}
                            <div className="flex flex-col gap-1 mb-4">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <User className="w-4 h-4" /> Gunther
                        </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Phone className="w-4 h-4" /> +55 99 99999-9999
                        </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Mail className="w-4 h-4" /> gunther@pijeymail.com
                                </div>
                            </div>

                            {/* Tab content */}
                            {tab === 'form' && (
                                <div>
                                    <div className="text-sm">
                                        {/* Valor do negócio */}
                                        <div className="mb-3">
                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-0.5">
                                                <DollarSign className="w-4 h-4" />
                                                Valor do negócio
                                            </div>
                                            <div className="ml-6 text-base text-gray-900 font-semibold">{deal.value ? deal.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "--"}</div>
                                        </div>
                                        {/* Data de fechamento esperado */}
                                        <div className="mb-3">
                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-0.5">
                                                <Calendar className="w-4 h-4" />
                                                Data de fechamento esperado
                                            </div>
                                            <div className="ml-6">
                                                <button className="text-xs text-sky-700 underline underline-offset-2 hover:text-sky-900">Clique aqui para adicionar</button>
                                            </div>
                                        </div>
                                        {/* Temperatura do negócio */}
                                        <div className="mb-3">
                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-0.5">
                                                <span className="inline-block w-4 h-4 rounded-full bg-yellow-400 mr-1"></span>
                                                Temperatura do negócio
                                            </div>
                                            <div className="ml-6 text-xs text-yellow-700 font-semibold">Morno</div>
                                        </div>
                                        {/* Notas sobre o negócio */}
                                        <div className="mb-3">
                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-0.5">
                                                <span className="inline-block w-4 h-4"><svg width="16" height="16" fill="none"><rect width="16" height="16" rx="3" fill="#CBD5E1" /><rect x="3" y="4" width="10" height="1.5" rx="0.75" fill="#64748B" /><rect x="3" y="7" width="7" height="1.5" rx="0.75" fill="#64748B" /><rect x="3" y="10" width="5" height="1.5" rx="0.75" fill="#64748B" /></svg></span>
                                                Notas sobre o negócio
                                            </div>
                                            <div className="ml-6">
                                                <button className="text-xs text-sky-700 underline underline-offset-2 hover:text-sky-900">Clique aqui para adicionar</button>
                                            </div>
                                        </div>
                                        {/* Documentos */}
                                        <div className="mb-3">
                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-0.5">
                                                <span className="inline-block w-4 h-4"><svg width="16" height="16" fill="none"><rect width="16" height="16" rx="3" fill="#CBD5E1" /><path d="M5 8h6M5 11h6" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" /></svg></span>
                                                Documentos
                                            </div>
                                            <div className="ml-6">
                                                <button className="text-xs text-sky-700 underline underline-offset-2 hover:text-sky-900">Clique aqui para adicionar</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {tab === 'opportunity' && (
                                <div>
                                    <div className="font-semibold text-base mb-2">Nova Oportunidade</div>
                                    <div className="text-xs text-gray-400">Criar nova oportunidade relacionada...</div>
                                </div>
                            )}
                            {tab === 'attachments' && (
                                <div>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <button className="flex items-center gap-1 px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-600 text-xs font-medium"><svg width="16" height="16" fill="none"><path d="M6.5 2.75A2.75 2.75 0 0 1 9.25 5.5v5.75a2.25 2.25 0 1 1-4.5 0V4.5a1.75 1.75 0 1 1 3.5 0v6.25a.75.75 0 1 1-1.5 0V5.5" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" /></svg>Anexos</button>
                                    </div>
                                    <div className="mt-2">
                                        <div className="font-semibold text-base mb-2">Anexos</div>
                                        <div className="border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center bg-white">
                                            <div className="mb-2">
                                                <svg width="64" height="64" fill="none"><rect width="64" height="64" rx="12" fill="#F1F5F9" /><g><rect x="18" y="24" width="28" height="16" rx="3" fill="#E0E7EF" /><rect x="24" y="30" width="16" height="2.5" rx="1.25" fill="#64748B" /><rect x="24" y="34" width="10" height="2.5" rx="1.25" fill="#64748B" /></g></svg>
                                            </div>
                                            <div className="text-xs text-gray-500 mb-2">Arraste para cá ou selecione arquivos do seu computador para anexá-los a este card.</div>
                                            <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded px-4 py-2 mt-2">Adicionar novos arquivos</button>
                                        </div>
                            </div>
                        </div>
                            )}
                            {tab === 'checklists' && (
                                <div>
                                    <div className="font-semibold text-base mb-2">Checklists</div>
                                    <div className="text-xs text-gray-400">Gerenciar listas de verificação...</div>
                                </div>
                            )}
                            {tab === 'comments' && (
                                <div>
                                    <div className="font-semibold text-base mb-2">Comentários</div>
                                    <div className="text-xs text-gray-400">Adicionar e visualizar comentários...</div>
                                </div>
                            )}
                            {tab === 'email' && (
                                <div>
                                    <div className="font-semibold text-base mb-2">Email</div>
                                    <div className="text-xs text-gray-400">Enviar e gerenciar emails...</div>
                                </div>
                            )}
                            {tab === 'pdf' && (
                                <div>
                                    <div className="font-semibold text-base mb-2">PDF</div>
                                    <div className="text-xs text-gray-400">Gerar e visualizar PDFs...</div>
                                </div>
                            )}
                            {tab === 'onboarding' && (
                                <div>
                                    <div className="font-semibold text-base mb-2">Onboarding de Clientes</div>
                                    <div className="text-xs text-gray-400">Processo de integração de clientes...</div>
                                </div>
                            )}
                            {tab === 'companies' && (
                                                <div>
                                    <div className="font-semibold text-base mb-2">Empresas</div>
                                    <div className="text-xs text-gray-400">Gerenciar empresas relacionadas...</div>
                                                </div>
                            )}
                            {tab === 'contacts' && (
                                                <div>
                                    <div className="font-semibold text-base mb-2">Contatos</div>
                                    <div className="text-xs text-gray-400">Gerenciar contatos relacionados...</div>
                                                </div>
                            )}
                            {tab === 'activities' && (
                                                <div>
                                    <div className="font-semibold text-base mb-2">Atividades</div>
                                    <div className="text-xs text-gray-400">Acompanhar atividades e tarefas...</div>
                                                </div>
                            )}
                            {tab === 'history' && (
                                                <div>
                                    <div className="font-semibold text-base mb-2">Histórico</div>
                                    <div className="text-xs text-gray-400">Prospecção, Apresentação...</div>
                                </div>
                            )}
                        </div>
                                                </div>

                    {/* Centro: Formulário e atividades */}
                    <div className="flex-1 flex flex-col p-8 gap-4 overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                Fase atual
                                <Badge variant="outline" className="bg-pink-100 text-pink-700">Proposta</Badge>
                            </DialogTitle>
                        </DialogHeader>
                        <form className="space-y-4">
                                                <div>
                                <label className="block text-xs font-medium mb-1">Quais serviços o cliente está adquirindo?</label>
                                <Input value={form.services} onChange={e => setForm(f => ({ ...f, services: e.target.value }))} placeholder="Digite aqui..." />
                                                </div>
                                                <div>
                                <label className="block text-xs font-medium mb-1">Descontos</label>
                                <Input value={form.discounts} onChange={e => setForm(f => ({ ...f, discounts: e.target.value }))} placeholder="Digite aqui..." />
                                                </div>
                                                <div>
                                <label className="block text-xs font-medium mb-1">Data de validade da proposta</label>
                                <Input value={form.validity} onChange={e => setForm(f => ({ ...f, validity: e.target.value }))} placeholder="DD/MM/AAAA" />
                                                </div>
                                                <div>
                                <label className="block text-xs font-medium mb-1">Proposta</label>
                                <Textarea value={form.proposal} onChange={e => setForm(f => ({ ...f, proposal: e.target.value }))} placeholder="Digite aqui..." rows={2} />
                                <Button variant="ghost" size="sm" className="mt-1">+ Adicionar novos arquivos</Button>
                                                </div>
                        </form>
                        <div className="mt-4">
                            <div className="font-semibold text-sm mb-2">Atividades</div>
                            <div className="flex items-center gap-2 mb-2">
                                                    <Input
                                                        value={activity}
                                                        onChange={e => setActivity(e.target.value)}
                                    placeholder="Escreva seu comentário aqui"
                                                        className="flex-1"
                                                        onKeyDown={e => {
                                                            if (e.key === "Enter" && activity.trim()) {
                                            setActivities(a => [{ id: Date.now(), text: activity, date: new Date().toISOString() }, ...a]);
                                                                setActivity("");
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                    />
                                <Button size="sm" onClick={() => {
                                                            if (activity.trim()) {
                                        setActivities(a => [{ id: Date.now(), text: activity, date: new Date().toISOString() }, ...a]);
                                                                setActivity("");
                                                            }
                                }}>Enviar</Button>
                                                </div>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {activities.length === 0 && <div className="text-xs text-gray-400">Não há atividades que correspondem aos filtros atuais.</div>}
                                {activities.map(a => (
                                    <div key={a.id} className="bg-gray-100 rounded p-2 text-xs">
                                        <div>{a.text}</div>
                                        <div className="text-[10px] text-gray-400 mt-1">{new Date(a.date).toLocaleString()}</div>
                                                        </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Direita: Mover etapa */}
                    <div className="w-64 bg-white border-l p-6 flex flex-col gap-4">
                        <div className="font-semibold text-sm mb-2">Mover card para fase</div>
                        <div className="flex flex-col gap-2">
                                        {stages.map(stage => (
                                <Button
                                                key={stage.id}
                                    variant={stage.id === deal.stage_id ? "default" : "outline"}
                                    className={stage.id === deal.stage_id ? "bg-blue-100 text-blue-700" : ""}
                                                onClick={() => onStageChange(stage.id)}
                                                disabled={stage.id === deal.stage_id}
                                            >
                                    {stage.name}
                                </Button>
                            ))}
                                        </div>
                        <div className="mt-4">
                            <Button variant="destructive" size="sm" className="w-full">Perdido</Button>
                                        </div>
                        <div className="mt-auto flex justify-end">
                            <Button variant="ghost" onClick={onClose}>Fechar</Button>
                        </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
    );
}

// Helpers para chip de temperatura
function getTemperatureLabel(temp?: string) {
    if (!temp) return "Frio";
    if (temp.toLowerCase() === "quente") return "Quente";
    if (temp.toLowerCase() === "morno") return "Morno";
    return "Frio";
}

function getTemperatureColorClass(temp?: string) {
    if (!temp) return "bg-blue-100 text-blue-700";
    if (temp.toLowerCase() === "quente") return "bg-red-100 text-red-700";
    if (temp.toLowerCase() === "morno") return "bg-yellow-100 text-yellow-800";
    return "bg-blue-100 text-blue-700";
} 