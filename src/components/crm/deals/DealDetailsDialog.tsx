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

    if (!deal) return null;

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
                <div className="flex h-[90vh]">
                    {/* Esquerda: Info básica */}
                    <div className="w-80 bg-gray-50 border-r p-6 flex flex-col gap-4 overflow-y-auto max-h-full">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${deal.id}`} className="w-10 h-10 rounded-full" />
                                <div>
                                    <div className="font-semibold text-lg">{deal.title}</div>
                                    <Badge variant="outline" className="text-xs">{deal.stage_id}</Badge>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 mb-2">Negócio • {deal.company_id || "Empresa"}</div>
                            <div className="flex flex-col gap-1 mb-2">
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
                        </div>
                        <div className="text-sm mt-2">
                            <div className="flex items-center gap-2 mb-1">
                                <Building2 className="w-4 h-4 text-blue-400" />
                                <span>{deal.company_id || "Central Perk"}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="w-4 h-4 text-green-500" />
                                <span>R$ {deal.value?.toLocaleString("pt-BR")}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>Data esperada: --/--/----</span>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-blue-500">Frio</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="font-semibold text-xs mb-1">Notas sobre o negócio</div>
                            <Textarea placeholder="Clique aqui para adicionar" rows={2} className="text-xs" />
                        </div>
                        <div className="mt-4">
                            <div className="font-semibold text-xs mb-1">Documentos</div>
                            <Button variant="outline" size="sm" className="w-full">Clique aqui para adicionar</Button>
                        </div>
                        <div className="mt-4">
                            <div className="font-semibold text-xs mb-1">Histórico</div>
                            <div className="text-xs text-gray-400">Prospecção, Apresentação...</div>
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