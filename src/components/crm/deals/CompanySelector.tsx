import { Building2 } from 'lucide-react';

interface CompanyOption {
    id: string;
    name: string;
}

export function CompanySelector({ value, options, onChange }: {
    value?: string;
    options: CompanyOption[];
    onChange: (id: string) => void;
}) {
    const selected = options.find(c => c.id === value);
    return (
        <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-700 mb-1">Selecione a empresa</span>
            <div className="flex flex-col gap-1">
                {options.map(opt => (
                    <button
                        key={opt.id}
                        className={`w-full text-left rounded-lg border px-3 py-2 flex items-center gap-2 hover:bg-blue-50 transition-colors text-xs font-medium ${value === opt.id ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700'}`}
                        onClick={() => onChange(opt.id)}
                    >
                        <Building2 className="w-4 h-4 text-cyan-400 mr-2" />
                        <span className="truncate">{opt.name}</span>
                    </button>
                ))}
                {options.length === 0 && <div className="text-xs text-slate-400 px-2 py-4">Nenhuma empresa encontrada</div>}
            </div>
            <div className="mt-2 text-xs text-slate-500">
                Empresa atual: <span className="font-semibold text-slate-700">{selected?.name || '-'}</span>
            </div>
        </div>
    );
} 