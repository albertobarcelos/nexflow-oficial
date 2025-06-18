import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface Stage {
    name: string;
    color: string;
    description: string;
}

interface NewStageProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialStage?: Stage;
    onSave: (stage: Stage) => void;
}

const NewStage: React.FC<NewStageProps> = ({ open, onOpenChange, initialStage, onSave }) => {
    const [stage, setStage] = useState<Stage>({ name: "", color: "#94A3B8", description: "" });

    useEffect(() => {
        if (initialStage) setStage(initialStage);
        else setStage({ name: "", color: "#94A3B8", description: "" });
    }, [initialStage, open]);

    const handleSave = () => {
        if (stage.name.trim()) {
            onSave(stage);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>{initialStage ? "Editar Etapa" : "Nova Etapa"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div>
                        <Label>Nome da etapa</Label>
                        <Input value={stage.name} onChange={e => setStage(s => ({ ...s, name: e.target.value }))} />
                    </div>
                    <div>
                        <Label>Cor</Label>
                        <Input type="color" value={stage.color} onChange={e => setStage(s => ({ ...s, color: e.target.value }))} className="w-12 h-8 p-0 border-none bg-transparent" />
                    </div>
                    <div>
                        <Label>Descrição</Label>
                        <Input value={stage.description} onChange={e => setStage(s => ({ ...s, description: e.target.value }))} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!stage.name.trim()}>{initialStage ? "Salvar" : "Adicionar"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default NewStage; 