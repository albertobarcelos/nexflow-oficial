import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit2 } from 'lucide-react';

const options = [
    { value: 'hot', label: 'Quente' },
    { value: 'warm', label: 'Morno' },
    { value: 'cold', label: 'Frio' },
    { value: 'new', label: 'Novo' },
];

function getTemperatureTag(temperature?: string) {
    switch (temperature) {
        case 'hot': return { label: 'Quente', color: 'bg-red-100 text-red-700 ' };
        case 'warm': return { label: 'Morno', color: 'bg-orange-100 text-orange-700 ' };
        case 'cold': return { label: 'Frio', color: 'bg-blue-100 text-blue-700 border border-blue-20' };
        default: return { label: 'Novo', color: 'bg-gray-100 text-gray-700 ' };
    }
}

export function DealTemperatureEditor({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
    const [editing, setEditing] = useState(false);
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
                <span className={`text-xs text-slate-900 ${getTemperatureTag(value).color}`}>{getTemperatureTag(value).label}</span>
            )}
        </div>
    );
} 