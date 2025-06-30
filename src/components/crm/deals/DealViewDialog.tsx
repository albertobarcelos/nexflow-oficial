import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MoreVertical, X, Edit2, User, Building2, Mail, Phone, FileText, Calendar as CalendarIcon, FilePlus, ChevronRight, ChevronLeft, Thermometer, StickyNote, History, Paperclip, TrendingUp, CheckSquare, MessageCircle, DollarSign, Tag, Plus, ChevronDown, Smile, Activity, Type } from "lucide-react";
import type { MockDeal } from "@/types/deals";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { ContactSelector } from './ContactSelector';
import { CompanySelector } from './CompanySelector';
import { DealValueEditor } from './DealValueEditor';
import { DealDateEditor } from './DealDateEditor';
import { DealTemperatureEditor } from './DealTemperatureEditor';

interface Stage { id: string; name: string; }

interface DealViewDialogProps {
    open: boolean;
    deal: MockDeal | null;
    stages: Stage[];
    onClose: () => void;
    onStageChange: (stageId: string) => void;
}

// Move getTemperatureTag to the top-level scope so Sidebar can access it
const getTemperatureTag = (temperature?: string) => {
    switch (temperature) {
        case 'hot': return { label: 'Quente', color: 'bg-red-100 text-red-700 ' };
        case 'warm': return { label: 'Morno', color: 'bg-orange-100 text-orange-700 ' };
        case 'cold': return { label: 'Frio', color: 'bg-blue-100 text-blue-700 border border-blue-20' };
        default: return { label: 'Novo', color: 'bg-gray-100 text-gray-700 ' };
    }
};

// --- SelectContactCompany Component ---
// Minimal, but visually close to the image: search, add, list, select
function SelectContactCompany({
    type, // 'contact' | 'company'
    options,
    value,
    onChange,
    onAdd,
    placeholder = "Pesquisar...",
}: {
    type: 'contact' | 'company',
    options: { id: string; name: string; email?: string; phone?: string; }[];
    value?: string;
    onChange: (id: string) => void;
    onAdd?: () => void;
    placeholder?: string;
}) {
    const [search, setSearch] = useState("");
    const filtered = options.filter(opt => opt.name.toLowerCase().includes(search.toLowerCase()));
    return (
        <div className="w-full bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-30">
            <div className="flex items-center gap-2 mb-2">
                <input
                    className="flex-1 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
                    placeholder={placeholder}
                    value={String(search ?? '')}
                    onChange={e => setSearch(e.target.value)}
                />
                {onAdd && (
                    <button className="text-xs text-blue-600 font-semibold ml-2" onClick={onAdd}>+ Adicionar {type === 'contact' ? 'contato' : 'empresa'}</button>
                )}
            </div>
            <div className="max-h-48 overflow-y-auto flex flex-col gap-2">
                {filtered.map(opt => (
                    <button
                        key={opt.id}
                        className={`w-full text-left rounded-lg border border-slate-100 px-3 py-2 flex flex-col gap-0.5 hover:bg-blue-50 ${value === opt.id ? 'ring-2 ring-blue-400' : ''}`}
                        onClick={() => onChange(opt.id)}
                    >
                        <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-cyan-400" />
                            <span className="font-semibold text-xs text-slate-900">{opt.name}</span>
                        </div>
                        {opt.email && <div className="text-[11px] text-slate-500">{opt.email}</div>}
                        {opt.phone && <div className="text-[11px] text-slate-500">{opt.phone}</div>}
                    </button>
                ))}
                {filtered.length === 0 && <div className="text-xs text-slate-400 px-2 py-4">Nenhum encontrado</div>}
            </div>
        </div>
    );
}

// --- ContactSelector ---
function ContactSelector({ value, options, onChange }: { value?: string; options: { id: string; name: string; email?: string; phone?: string; }[]; onChange: (id: string) => void }) {
    const [editing, setEditing] = useState(false);
    return (
        <div className="flex flex-col gap-0.5 mt-0.5">
            <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-700">Contato</span>
                {!editing && (
                    <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={() => setEditing(true)}><Edit2 className="w-3 h-3" /></Button>
                )}
            </div>
            {editing ? (
                <SelectContactCompany
                    type="contact"
                    options={options}
                    value={value}
                    onChange={id => { onChange(id); setEditing(false); }}
                    onAdd={() => { }}
                />
            ) : (
                <>
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs text-slate-900">{String(options.find(c => c.id === value)?.name || '-')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-500">{String(options.find(c => c.id === value)?.email || '-')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-500">{String(options.find(c => c.id === value)?.phone || '-')}</span>
                    </div>
                </>
            )}
        </div>
    );
}

// --- CompanySelector ---
function CompanySelector({ value, options, onChange }: { value?: string; options: { id: string; name: string; }[]; onChange: (id: string) => void }) {
    const [editing, setEditing] = useState(false);
    return (
        <div className="flex flex-col gap-0.5 mt-0.5">
            <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-700">Empresa</span>
                {!editing && (
                    <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={() => setEditing(true)}><Edit2 className="w-3 h-3" /></Button>
                )}
            </div>
            {editing ? (
                <SelectContactCompany
                    type="company"
                    options={options}
                    value={value}
                    onChange={id => { onChange(id); setEditing(false); }}
                    onAdd={() => { }}
                />
            ) : (
                <span className="text-xs text-slate-900">{String(options.find(c => c.id === value)?.name || '-')}</span>
            )}
        </div>
    );
}

// --- DealValueEditor ---
function DealValueEditor({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const [editing, setEditing] = useState(false);
    const [input, setInput] = useState(value.toString());
    return (
        <div className="flex flex-col gap-0.5 mt-0.5">
            <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-700">Valor do negócio</span>
                {!editing && (
                    <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={() => setEditing(true)}><Edit2 className="w-3 h-3" /></Button>
                )}
            </div>
            {editing ? (
                <input
                    type="number"
                    className="text-xs border border-slate-200 rounded px-2 py-1 w-32"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onBlur={() => { onChange(Number(input)); setEditing(false); }}
                    autoFocus
                />
            ) : (
                <span className="text-xs text-slate-900">{value ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>
            )}
        </div>
    );
}

// --- DealTemperatureEditor ---
function DealTemperatureEditor({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
    const [editing, setEditing] = useState(false);
    const options = [
        { value: 'hot', label: 'Quente' },
        { value: 'warm', label: 'Morno' },
        { value: 'cold', label: 'Frio' },
        { value: 'new', label: 'Novo' },
    ];
    return (
        <div className="flex flex-col gap-0.5 mt-0.5">
            <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-700">Temperatura do negócio</span>
                {!editing && (
                    <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={() => setEditing(true)}><Edit2 className="w-3 h-3" /></Button>
                )}
            </div>
            {editing ? (
                <select
                    className="text-xs border border-slate-200 rounded px-2 py-1 w-32"
                    value={value}
                    onChange={e => { onChange(e.target.value); setEditing(false); }}
                    autoFocus
                >
                    {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            ) : (
                <span className="text-xs text-slate-900">{getTemperatureTag(value).label}</span>
            )}
        </div>
    );
}

export function DealViewDialog({ open, deal, stages, onClose, onStageChange }: DealViewDialogProps) {
    const [activeTab, setActiveTab] = useState("necessidades");
    const [notes, setNotes] = useState(deal?.notes || "");
    const [editingTitle, setEditingTitle] = useState(false);
    const [title, setTitle] = useState(deal?.title || "");
    // --- Editable Contact/Company ---
    const [editingContact, setEditingContact] = useState(false);
    const [editingCompany, setEditingCompany] = useState(false);
    const [selectedContact, setSelectedContact] = useState(deal?.contact_id || "");
    const [selectedCompany, setSelectedCompany] = useState(deal?.company_id || "");
    // Mock options for demo
    const contactOptions = [
        { id: "1", name: "Bruce Wayne", email: "brucewayne@pipefymail.com", phone: "+55 99 99999-9999" },
        { id: "2", name: "Willy Wonka", email: "willywonka@pipefymail.com", phone: "+55 99 99999-9999" },
        { id: "3", name: "Gustavo Fring", email: "gustavo@pipefymail.com", phone: "+55 99 99999-9999" },
    ];
    const companyOptions = [
        { id: "a", name: "Indústrias Wonka" },
        { id: "b", name: "Wayne Enterprises" },
        { id: "c", name: "Los Pollos Hermanos" },
    ];

    if (!deal) return null;

    // Helpers
    const getTemperature = (temp?: string) => {
        switch (temp) {
            case "hot": return { label: "Quente", color: "bg-red-100 text-red-700" };
            case "warm": return { label: "Morno", color: "bg-orange-100 text-orange-700" };
            case "cold": return { label: "Frio", color: "bg-blue-100 text-blue-700" };
            default: return { label: "Novo", color: "bg-gray-100 text-gray-700" };
        }
    };
    const temp = getTemperature(deal.temperature);
    const contact = deal.responsibles?.[0]?.name || deal.responsible_name || "—";
    const contactEmail = deal.contact_email || "—";
    const contactPhone = deal.contact_phone || "—";
    const company = deal.company_name || deal.company_id || "—";
    const industry = deal.industry || "—";
    const value = typeof deal.value === "number" ? deal.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";
    const closingDate = deal.closing_date || null;

    // --- Header ---
    const Header = () => (
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white/95 backdrop-blur-md">
            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-5 w-5" /></Button>
            <div className="flex-1 flex justify-center">
                {editingTitle ? (
                    <input
                        className="text-lg font-bold text-slate-900 bg-slate-100 rounded px-2 py-1 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={String(title)}
                        onChange={e => setTitle(e.target.value)}
                        onBlur={() => setEditingTitle(false)}
                        autoFocus
                    />
                ) : (
                    <button className="text-lg font-bold text-slate-900 hover:underline" onClick={() => setEditingTitle(true)}>{String(title || '')}</button>
                )}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
    );

    // --- Sidebar ---
    const Sidebar = () => (
        <aside className="bg-white border-r border-slate-200/60 px-7 py-7 min-w-[340px] max-w-[400px] flex flex-col h-full overflow-y-auto gap-8">
            {/* Header: Title and Quick Actions */}
            <div>
                {/* Deal Title (editable) */}
                <div className="flex items-center gap-2 mb-2">
                    <button className="text-2xl font-extrabold text-slate-900 hover:underline focus:outline-none break-words whitespace-normal w-full text-left">{String(deal?.title || 'Negócio')}</button>
                </div>
                {/* Quick Actions: Add Responsible, Due Date, Temperature */}
                <div className="flex items-center gap-2 mb-4">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs flex gap-1"><User className="w-4 h-4" />Adicionar responsável</Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs flex gap-1"><CalendarIcon className="w-4 h-4" />Vencimento</Button>
                    <Badge className={`h-7 px-2 text-xs font-semibold rounded-full ${getTemperatureTag(deal?.temperature).color}`}>{String(getTemperatureTag(deal?.temperature).label)}</Badge>
                </div>
            </div>
            {/* Row of Compact Icon Buttons */}
            <div className="flex flex-wrap gap-2 mb-2">
                <Button variant="secondary" size="sm" className="h-8 px-2 flex gap-1 items-center"><TrendingUp className="w-4 h-4" />Nova oportunidade</Button>
                <Button variant="outline" size="sm" className="h-8 px-2 flex gap-1 items-center"><Paperclip className="w-4 h-4" />Anexos</Button>
                <Button variant="outline" size="sm" className="h-8 px-2 flex gap-1 items-center"><CheckSquare className="w-4 h-4" />Checklists</Button>
                <Button variant="outline" size="sm" className="h-8 px-2 flex gap-1 items-center"><MessageCircle className="w-4 h-4" />Comentários</Button>
                <Button variant="outline" size="sm" className="h-8 px-2 flex gap-1 items-center"><Mail className="w-4 h-4" />Email</Button>
                <Button variant="outline" size="sm" className="h-8 px-2 flex gap-1 items-center"><FileText className="w-4 h-4" />PDF</Button>
                <Button variant="outline" size="sm" className="h-8 px-2 flex gap-1 items-center"><Smile className="w-4 h-4" />Onboarding</Button>
                <Button variant="outline" size="sm" className="h-8 px-2 flex gap-1 items-center"><Building2 className="w-4 h-4" />Empresas <span className="ml-1 bg-slate-200 rounded-full px-1 text-xs">1</span></Button>
                <Button variant="outline" size="sm" className="h-8 px-2 flex gap-1 items-center"><Phone className="w-4 h-4" />Contatos <span className="ml-1 bg-slate-200 rounded-full px-1 text-xs">1</span></Button>
                <Button variant="outline" size="sm" className="h-8 px-2 flex gap-1 items-center"><Activity className="w-4 h-4" />Atividades</Button>
                <Button variant="secondary" size="icon" className="h-8 w-8"><Plus className="w-4 h-4" /></Button>
            </div>
            {/* Initial Form Section */}
            <section>
                <header className="text-xs font-bold text-slate-700 mb-1">Formulário Inicial</header>
                <div className="text-xs text-slate-500 mb-3">Criado por Pipebot • há um mês</div>
                <div className="flex flex-col gap-4">
                    {/* Business Block */}
                    <div className="flex items-start gap-3">
                        <Type className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div className="flex-1">
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-semibold text-slate-700">Negócio</span>
                                <Button variant="ghost" size="icon" className="h-5 w-5 p-0"><Edit2 className="w-3 h-3" /></Button>
                            </div>
                            <div className="text-xs text-slate-900 mt-0.5">{String(deal?.title || '-')}</div>
                        </div>
                    </div>
                    {/* Contact Block - editable */}
                    <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-cyan-400 mt-0.5" />
                        <div className="flex-1">
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-semibold text-slate-700">Contato</span>
                                {editingContact ? null : (
                                    <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={() => setEditingContact(true)}><Edit2 className="w-3 h-3" /></Button>
                                )}
                            </div>
                            {editingContact ? (
                                <ContactSelector
                                    value={String(selectedContact ?? '')}
                                    options={contactOptions}
                                    onChange={id => { setSelectedContact(id); setEditingContact(false); }}
                                />
                            ) : (
                                <ContactSelector
                                    value={String(selectedContact ?? '')}
                                    options={contactOptions}
                                    onChange={id => { setSelectedContact(id); setEditingContact(false); }}
                                />
                            )}
                        </div>
                    </div>
                    {/* Company Block - editable */}
                    <div className="flex items-start gap-3">
                        <Building2 className="w-5 h-5 text-cyan-400 mt-0.5" />
                        <div className="flex-1">
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-semibold text-slate-700">Empresa</span>
                                {editingCompany ? null : (
                                    <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={() => setEditingCompany(true)}><Edit2 className="w-3 h-3" /></Button>
                                )}
                            </div>
                            {editingCompany ? (
                                <CompanySelector
                                    value={String(selectedCompany ?? '')}
                                    options={companyOptions}
                                    onChange={id => { setSelectedCompany(id); setEditingCompany(false); }}
                                />
                            ) : (
                                <CompanySelector
                                    value={String(selectedCompany ?? '')}
                                    options={companyOptions}
                                    onChange={id => { setSelectedCompany(id); setEditingCompany(false); }}
                                />
                            )}
                        </div>
                    </div>
                    {/* Value Block */}
                    <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div className="flex-1">
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-semibold text-slate-700">Valor do negócio</span>
                                <Button variant="ghost" size="icon" className="h-5 w-5 p-0"><Edit2 className="w-3 h-3" /></Button>
                            </div>
                            <div className="text-xs text-slate-900 mt-0.5">{String(deal?.value ? deal.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '-' : '-')}</div>
                        </div>
                    </div>
                    {/* Expected Close Date Block */}
                    <div className="flex items-start gap-3">
                        <CalendarIcon className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div className="flex-1">
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-semibold text-slate-700">Data de fechamento esperado</span>
                                <Button variant="ghost" size="icon" className="h-5 w-5 p-0"><Edit2 className="w-3 h-3" /></Button>
                            </div>
                            <div className="text-xs text-slate-900 mt-0.5">{typeof deal?.expected_close_date === 'string' ? deal.expected_close_date : <button className="text-xs text-blue-600 underline">Clique aqui para adicionar</button>}</div>
                        </div>
                    </div>
                    {/* Temperature Block */}
                    <div className="flex items-start gap-3">
                        <Thermometer className="w-5 h-5 text-orange-400 mt-0.5" />
                        <div className="flex-1">
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-semibold text-slate-700">Temperatura do negócio</span>
                                <Button variant="ghost" size="icon" className="h-5 w-5 p-0"><Edit2 className="w-3 h-3" /></Button>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`h-4 w-4 rounded-full ${getTemperatureTag(deal?.temperature).color}`}></span>
                                <span className="text-xs text-slate-900">{String(getTemperatureTag(deal?.temperature).label)}</span>
                            </div>
                        </div>
                    </div>
                    {/* Notes Block */}
                    <div className="flex items-start gap-3">
                        <StickyNote className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div className="flex-1">
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-semibold text-slate-700">Notas sobre o negócio</span>
                                <Button variant="ghost" size="icon" className="h-5 w-5 p-0"><Edit2 className="w-3 h-3" /></Button>
                            </div>
                            <div className="text-xs text-slate-900 mt-0.5">{typeof deal?.notes === 'string' ? deal.notes : <button className="text-xs text-blue-600 underline">Clique aqui para adicionar</button>}</div>
                        </div>
                    </div>
                    {/* Documents Block */}
                    <div className="flex items-start gap-3">
                        <Paperclip className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div className="flex-1">
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-semibold text-slate-700">Documentos</span>
                                <Button variant="ghost" size="icon" className="h-5 w-5 p-0"><Edit2 className="w-3 h-3" /></Button>
                            </div>
                            <div className="text-xs text-slate-900 mt-0.5"><button className="text-xs text-blue-600 underline">Clique aqui para adicionar</button></div>
                        </div>
                    </div>
                </div>
            </section>
            {/* History Section */}
            <section>
                <header className="text-xs font-bold text-slate-700 mb-1">Histórico</header>
                <div className="flex flex-col gap-2">
                    {/* Example history item */}
                    {Array.isArray(deal?.history) ? deal.history.map((h, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                            <Badge className="bg-yellow-100 text-yellow-700 h-5 px-2 font-medium rounded">{h.stage}</Badge>
                            <span>{h.timeAgo}</span>
                            <span className="text-slate-400">{h.date}</span>
                        </div>
                    )) : null}
                    <Button variant="ghost" size="sm" className="mt-2 text-xs text-blue-600 underline flex items-center gap-1"><ChevronDown className="w-4 h-4" />Mostrar mais</Button>
                </div>
            </section>
            {/* Card View Edit Button */}
            <Button variant="outline" size="sm" className="w-full mt-4 flex items-center gap-2"><Plus className="w-4 h-4" />Editar visualização do card</Button>
        </aside>
    );

    // --- Main Panel ---
    const MainPanel = () => (
        <main className="bg-slate-50 flex flex-col h-full px-8 py-8 min-w-0 flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-200/60 mb-4">
                <div className="text-xs font-bold text-slate-500">Fase atual</div>
                <Badge className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-xs shadow-none">{String(stages.find(s => s.id === deal.stage_id)?.name || '—')}</Badge>
            </div>
            <div className="flex gap-2 mb-4 flex-wrap">
                <Button variant={activeTab === "necessidades" ? "default" : "outline"} size="sm" className="rounded-full px-4 py-1 text-xs font-semibold flex items-center gap-1" onClick={() => setActiveTab("necessidades")}> <StickyNote className="h-3 w-3" /> <span>Necessidades do cliente</span></Button>
                <Button variant={activeTab === "atividades" ? "default" : "outline"} size="sm" className="rounded-full px-4 py-1 text-xs font-semibold flex items-center gap-1" onClick={() => setActiveTab("atividades")}> <History className="h-3 w-3" /> <span>Atividades</span></Button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {activeTab === "necessidades" && (
                    <div className="mb-6">
                        <div className="font-bold text-xs text-slate-700 mb-2">Necessidades do cliente</div>
                        <Textarea placeholder="Digite aqui ..." className="mb-4 border border-slate-200 rounded-lg bg-white/80" defaultValue={String(deal.needs || '')} />
                    </div>
                )}
                {activeTab === "atividades" && (
                    <div className="mb-6">
                        <div className="font-bold text-xs text-slate-700 mb-2">Atividades</div>
                        <Badge className="bg-purple-100 text-purple-700 font-bold px-3 py-1 rounded-full text-xs mb-2 shadow-none">Marketing</Badge>
                        <Textarea placeholder="Escreva seu comentário aqui" className="mb-2 border border-slate-200 rounded-lg bg-white/80" />
                        <div className="text-xs text-slate-400 mt-4">Não há atividades que correspondem aos filtros atuais. Limpe os filtros para ver todas as atividades.</div>
                    </div>
                )}
            </div>
        </main>
    );

    // --- Move Panel ---
    const MovePanel = () => (
        <aside className="bg-white border-l border-slate-200/60 px-6 py-8 min-w-[260px] max-w-[300px] flex flex-col h-full overflow-y-auto">
            <div className="font-bold text-xs text-slate-700 mb-2">Mover card para fase</div>
            {stages.filter(s => s.id !== deal.stage_id).map((stage, idx) => (
                <Button key={stage.id} variant="outline" className="w-full justify-between mb-2 rounded-full border-2 border-slate-200 font-semibold text-slate-700 hover:bg-blue-50 transition-colors flex items-center gap-2 px-4 py-2" onClick={() => onStageChange(stage.id)}>
                    {stage.id < deal.stage_id ? <ChevronLeft className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                    <span className="flex-1 text-left">{stage.name}</span>
                </Button>
            ))}
            <div className="mt-4">
                <Button variant="ghost" className="w-full text-xs justify-start text-slate-400 hover:text-blue-600">Configurar mover cards</Button>
            </div>
        </aside>
    );

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-[95vw] h-[95vh] p-0  overflow-hidden rounded-2xl shadow-xl">
                {/* Close button absolute top right */}
                <button
                    onClick={onClose}
                    aria-label="Fechar"
                    className="absolute top-4 right-4 z-20 bg-white/80 hover:bg-white rounded-full p-2 shadow border border-slate-200 transition-colors"
                >
                    <X className="w-5 h-5 text-slate-700" />
                </button>
                {/* Modal columns layout */}
                <div className="flex flex-1 h-full min-h-0">
                    <Sidebar />
                    <MainPanel />
                    <MovePanel />
                </div>
            </DialogContent>
        </Dialog>
    );
} 