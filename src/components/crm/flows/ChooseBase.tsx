import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ChooseBaseProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectBase: (base: string) => void;
}

const BASES = [
    { name: "Empresas" },
    { name: "Contatos" },
];

const ChooseBase: React.FC<ChooseBaseProps> = ({ open, onOpenChange, onSelectBase }) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[350px]">
                <DialogHeader>
                    <DialogTitle>Escolher Base de Dados</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                    {BASES.map((base) => (
                        <Button
                            key={base.name}
                            className="w-full justify-start"
                            variant="outline"
                            onClick={() => {
                                onSelectBase(base.name);
                                onOpenChange(false);
                            }}
                        >
                            {base.name}
                        </Button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ChooseBase; 