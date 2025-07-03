import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit2 } from 'lucide-react';

export function DealValueEditor({ value, onChange }: { value: number; onChange: (v: number) => void }) {
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
                    onKeyDown={e => { if (e.key === 'Enter') { onChange(Number(input)); setEditing(false); } }}
                    autoFocus
                />
            ) : (
                <span className="text-xs text-slate-900">{value ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>
            )}
        </div>
    );
} 