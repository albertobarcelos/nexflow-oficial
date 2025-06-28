import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Building2, Edit2, Plus } from 'lucide-react';

interface CompanyOption {
    id: string;
    name: string;
}

export function CompanySelector({ value, options, onChange }: {
    value?: string;
    options: CompanyOption[];
    onChange: (id: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const selected = options.find(c => c.id === value);
    const filtered = options.filter(opt => opt.name.toLowerCase().includes(search.toLowerCase()));
    return (
        <div className="flex flex-col gap-0.5 mt-0.5">
            <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-700">Empresa</span>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 p-0"><Edit2 className="w-3 h-3" /></Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-80 p-3 z-50">
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                className="flex-1 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
                                placeholder="Pesquisar..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <button className="text-xs text-blue-600 font-semibold ml-2 flex items-center gap-1"><Plus className="w-3 h-3" />Adicionar empresa</button>
                        </div>
                        <div className="max-h-48 overflow-y-auto flex flex-col gap-2">
                            {filtered.map(opt => (
                                <button
                                    key={opt.id}
                                    className={`w-full text-left rounded-lg border border-slate-100 px-3 py-2 flex flex-col gap-0.5 hover:bg-blue-50 ${value === opt.id ? 'ring-2 ring-blue-400' : ''}`}
                                    onClick={() => { onChange(opt.id); setOpen(false); }}
                                >
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-cyan-400" />
                                        <span className="font-semibold text-xs text-slate-900">{opt.name}</span>
                                    </div>
                                </button>
                            ))}
                            {filtered.length === 0 && <div className="text-xs text-slate-400 px-2 py-4">Nenhuma encontrada</div>}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            <span className="text-xs text-slate-900">{selected?.name || '-'}</span>
        </div>
    );
} 