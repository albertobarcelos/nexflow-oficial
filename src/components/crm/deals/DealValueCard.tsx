import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Thermometer, CalendarDays } from "lucide-react";
import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as LucideCalendar, Edit2 } from 'lucide-react';
import { Calendar as DatePicker } from '@/components/ui/calendar';

interface MockDeal { value?: number; temperature?: string; created_at: string; expected_date?: string; }

export function DealValueCard({ deal, onChangeValue, onChangeDate, onChangeTemperature }: {
    deal: MockDeal;
    onChangeValue?: (value: number) => void;
    onChangeDate?: (date: string) => void;
    onChangeTemperature?: (temperature: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [inputValue, setInputValue] = useState(deal.value ? deal.value.toString() : "");
    const inputRef = useRef<HTMLInputElement>(null);
    const [tempEditOpen, setTempEditOpen] = useState(false);
    const [open, setOpen] = useState(false);

    const getTemperatureConfig = (temp?: string) => {
        switch (temp) {
            case 'hot': return {
                label: 'Quente',
                color: 'bg-red-100 text-red-700 border-red-200',
                icon: Thermometer,
                iconColor: 'text-red-500',
                value: 'hot',
            };
            case 'warm': return {
                label: 'Morno',
                color: 'bg-orange-100 text-orange-700 border-orange-200',
                icon: Thermometer,
                iconColor: 'text-orange-500',
                value: 'warm',
            };
            case 'cold': return {
                label: 'Frio',
                color: 'bg-blue-100 text-blue-700 border-blue-200',
                icon: Thermometer,
                iconColor: 'text-blue-500',
                value: 'cold',
            };
            default: return {
                label: 'Novo',
                color: 'bg-gray-100 text-gray-700 border-gray-200',
                icon: Thermometer,
                iconColor: 'text-gray-500',
                value: 'new',
            };
        }
    };
    const tempConfig = getTemperatureConfig(deal.temperature);
    const TempIcon = tempConfig.icon;

    const handleValueClick = () => {
        setEditing(true);
        setTimeout(() => inputRef.current?.focus(), 0);
    };
    const handleInputBlur = () => {
        setEditing(false);
        const parsed = parseFloat(inputValue.replace(/[^\d,.]/g, '').replace(',', '.'));
        if (!isNaN(parsed) && parsed !== deal.value) {
            onChangeValue?.(parsed);
        }
    };
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            inputRef.current?.blur();
        } else if (e.key === 'Escape') {
            setEditing(false);
            setInputValue(deal.value ? deal.value.toString() : "");
        }
    };

    const temperatureOptions = [
        { value: 'hot', label: 'Quente', color: 'bg-red-100 text-red-700', icon: Thermometer },
        { value: 'warm', label: 'Morno', color: 'bg-orange-100 text-orange-700', icon: Thermometer },
        { value: 'cold', label: 'Frio', color: 'bg-blue-100 text-blue-700', icon: Thermometer },
        { value: 'new', label: 'Novo', color: 'bg-gray-100 text-gray-700', icon: Thermometer },
    ];

    return (
        <div className="space-y-3">
            <Card className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-green-50/60 shadow-sm min-w-[240px] relative group">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-30 bg-white rounded-full h-5 w-5 p-0 shadow hover:bg-emerald-100 transition-opacity opacity-0 group-hover:opacity-100 border border-emerald-200"
                    style={{ zIndex: 1010 }}
                    onClick={handleValueClick}
                    tabIndex={0}
                    aria-label="Editar valor do negócio"
                >
                    <Edit2 className="w-3 h-3 text-emerald-600" />
                </Button>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-xl">
                            <DollarSign className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 mb-1">Valor do Negócio</p>
                            <div className="flex items-center gap-2">
                                {editing ? (
                                    <Input
                                        ref={inputRef}
                                        value={inputValue}
                                        onChange={e => setInputValue(e.target.value)}
                                        onBlur={handleInputBlur}
                                        onKeyDown={handleInputKeyDown}
                                        className="text-xl font-bold text-emerald-700 h-9 px-2"
                                        placeholder="Digite o valor"
                                        type="text"
                                        inputMode="decimal"
                                    />
                                ) : (
                                    <span
                                        className="text-lg font-bold text-emerald-700 truncate"
                                        tabIndex={-1}
                                    >
                                        {deal.value ? deal.value.toLocaleString("pt-BR", {
                                            style: "currency",
                                            currency: "BRL"
                                        }) : <span className="text-slate-400">Não informado</span>}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="border-slate-200/60 bg-white/70 backdrop-blur-sm shadow-sm min-w-[240px] relative group">
                <Popover open={tempEditOpen} onOpenChange={setTempEditOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 z-30 bg-white rounded-full h-5 w-5 p-0 shadow hover:bg-orange-100 transition-opacity opacity-0 group-hover:opacity-100 border border-orange-200"
                            style={{ zIndex: 1010 }}
                            tabIndex={0}
                            aria-label="Editar temperatura"
                        >
                            <Edit2 className="w-3 h-3 text-orange-500" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="z-50 p-2 bg-white rounded shadow min-w-[160px]">
                        <div className="flex flex-col gap-1">
                            {temperatureOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-orange-50 transition-colors ${deal.temperature === opt.value ? 'bg-orange-100' : ''}`}
                                    onClick={() => { onChangeTemperature?.(opt.value); setTempEditOpen(false); }}
                                >
                                    <opt.icon className={`h-4 w-4 ${opt.color.split(' ')[1]}`} />
                                    <span className={`text-xs font-semibold ${opt.color}`}>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${tempConfig.icon === Thermometer ? 'bg-orange-100' : 'bg-slate-100'}`}>
                            <TempIcon className={`h-5 w-5 ${tempConfig.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 mb-1">Temperatura</p>
                            <div className="flex items-center gap-2">
                                <Badge className={`${tempConfig.color} font-medium px-3 py-1 text-sm border-0 select-none`}>{tempConfig.label}</Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="border-blue-200/60 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 shadow-sm min-w-[240px] relative group">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverContent align="start" className="z-50 p-2 bg-white rounded shadow">
                        <DatePicker
                            mode="single"
                            selected={deal.expected_date ? new Date(deal.expected_date) : undefined}
                            onSelect={d => { if (d) { onChangeDate?.(d.toISOString()); setOpen(false); } }}
                        />
                    </PopoverContent>
                </Popover>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl">
                            <CalendarDays className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 mb-1">Data de Fechamento</p>
                            <span className="text-xs text-slate-900 ml-2">
                                {deal.expected_date ? new Date(deal.expected_date).toLocaleDateString('pt-BR')
                                    : <button className="text-xs text-blue-600 underline" onClick={() => setOpen(true)}>Adicionar data</button>}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 