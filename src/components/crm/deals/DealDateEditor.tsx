import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as LucideCalendar, Edit2 } from 'lucide-react';
import { Calendar as DatePicker } from '@/components/ui/calendar';

export function DealDateEditor({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState(value ? new Date(value) : undefined);
    return (
        <div className="flex flex-col gap-0.5 mt-0.5">
            <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-700">Data de fechamento esperado</span>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 p-0"><Edit2 className="w-3 h-3" /></Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="z-50 p-2 bg-white rounded shadow">
                        <DatePicker
                            mode="single"
                            selected={date}
                            onSelect={d => { if (d) { setDate(d); onChange(d.toISOString()); setOpen(false); } }}
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <span className="text-xs text-slate-900">{date ? date.toLocaleDateString('pt-BR') : <button className="text-xs text-blue-600 underline">Clique aqui para adicionar</button>}</span>
        </div>
    );
} 