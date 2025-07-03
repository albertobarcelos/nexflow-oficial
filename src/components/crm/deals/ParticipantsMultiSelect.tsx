import { useState } from "react";
import { mockUsers } from "../flows/MockUsers";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog as UIDialog, DialogContent as UIDialogContent } from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";

export function ParticipantsMultiSelect({ value, onChange, setEditParticipants }: { value: string[]; onChange: (ids: string[]) => void; setEditParticipants: (b: boolean) => void }) {
    const [selected, setSelected] = useState<string[]>(value.length ? value : []);
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(true);
    const selectedUsers = mockUsers.filter(u => selected.includes(u.id));
    const availableUsers = mockUsers.filter(u => !selected.includes(u.id) && (
        u.first_name.toLowerCase().includes(search.toLowerCase()) ||
        u.last_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    ));
    const handleRemove = (id: string) => {
        if (selected.length > 1) setSelected(selected.filter(uid => uid !== id));
    };
    const handleAdd = (id: string) => {
        setSelected([...selected, id]);
    };
    const handleSave = () => {
        if (selected.length > 0) {
            onChange(selected);
            setEditParticipants(false);
            setOpen(false);
        }
    };
    const handleClose = () => {
        setEditParticipants(false);
        setOpen(false);
    };
    return (
        <UIDialog open={open} onOpenChange={handleClose}>
            <UIDialogContent className="max-w-md w-full">
                <div className="mb-2 flex flex-wrap gap-1">
                    {selectedUsers.map(u => (
                        <Badge key={u.id} className="flex items-center gap-1 px-2 py-1 text-xs">
                            <Avatar className="h-4 w-4"><AvatarFallback>{u.first_name[0]}{u.last_name[0]}</AvatarFallback></Avatar>
                            {u.first_name} {u.last_name}
                            {selected.length > 1 && (
                                <button className="ml-1 text-red-500 hover:text-red-700" onClick={() => handleRemove(u.id)} title="Remover">
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </Badge>
                    ))}
                </div>
                <Input
                    className="w-full border px-2 py-1 rounded mb-2 text-xs"
                    placeholder="Buscar usuário..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div className="max-h-40 overflow-auto space-y-1">
                    {availableUsers.map(u => (
                        <div key={u.id} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded">
                            <Avatar className="h-5 w-5"><AvatarFallback>{u.first_name[0]}{u.last_name[0]}</AvatarFallback></Avatar>
                            <span className="text-xs flex-1">{u.first_name} {u.last_name}</span>
                            <span className="text-xs text-slate-400">{u.email}</span>
                            <Button size="sm" className="h-6 px-2 text-xs" onClick={() => handleAdd(u.id)}>
                                <Plus className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                    {availableUsers.length === 0 && <div className="text-xs text-slate-400 px-2">Nenhum usuário encontrado</div>}
                </div>
                <div className="flex justify-end mt-2 gap-2">
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button size="sm" className="h-7 px-2 text-xs" onClick={handleSave} disabled={selected.length === 0}>
                        Salvar
                    </Button>
                </div>
                {selected.length === 0 && (
                    <div className="text-xs text-red-500 mt-2">Selecione pelo menos um participante.</div>
                )}
            </UIDialogContent>
        </UIDialog>
    );
} 