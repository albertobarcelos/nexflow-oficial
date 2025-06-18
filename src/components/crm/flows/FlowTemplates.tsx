import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface FlowTemplate {
    id: string;
    title: string;
    description: string;
    image: string;
}

interface FlowTemplatesProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectTemplate: (templateId: string) => void;
    onSetNewFlowTitle: (title: string) => void;
}

const templates: FlowTemplate[] = [
    {
        id: "sales-funnel",
        title: "Funil de Vendas",
        description: "Converta os leads mais qualificados com um funil de vendas eficiente",
        image: "https://fakjjzrucxpektnhhnjl.supabase.co/storage/v1/object/public/appimages//17.png"
    },
    {
        id: "client-onboarding",
        title: "Onboarding de Clientes",
        description: "Otimize a experiência inicial dos seus clientes com um processo estruturado",
        image: "https://fakjjzrucxpektnhhnjl.supabase.co/storage/v1/object/public/appimages//16.png"
    },
    {
        id: "team-tasks",
        title: "Gestão de Tarefas da Equipe",
        description: "Mantenha sua equipe alinhada e produtiva com um fluxo de trabalho organizado",
        image: "https://fakjjzrucxpektnhhnjl.supabase.co/storage/v1/object/public/appimages//19.png"
    }
];

export function FlowTemplates({ open, onOpenChange, onSelectTemplate, onSetNewFlowTitle }: FlowTemplatesProps) {
    const [showCreateFlow, setShowCreateFlow] = useState(false);
    const [flowName, setFlowName] = useState("");
    const navigate = useNavigate();

    const handleCreateFlow = () => {
        if (flowName.trim()) {
            onSetNewFlowTitle(flowName.trim());
            setFlowName("");
            setShowCreateFlow(false);
            onOpenChange(false);
            navigate("/crm/flow/new/settings", { state: { title: flowName.trim() } });
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[800px]">
                    <DialogHeader>
                        <DialogTitle>Templates</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-4 py-4">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                className="group relative overflow-hidden rounded-lg border bg-white  hover:border-orange-500 cursor-pointer transition-all hover:shadow-md"
                                onClick={() => onSelectTemplate(template.id)}
                            >
                                <div className="aspect-video overflow-hidden rounded-md">
                                    <img
                                        src={template.image}
                                        alt={template.title}
                                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                    />
                                </div>
                                <div className="p-2">
                                    <h3 className="font-semibold text-sm">{template.title}</h3>
                                    <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <DialogFooter className="sm:justify-between">

                        <Button variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button
                            className="bg-orange-500 text-white hover:bg-blue-950 hover:text-white"
                            variant="ghost"
                            onClick={() => {
                                setShowCreateFlow(true);
                                onOpenChange(false);
                            }}
                        >
                            Iniciar do Zero
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showCreateFlow} onOpenChange={setShowCreateFlow}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Criar Flow</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome do Flow</Label>
                            <Input
                                id="name"
                                placeholder="Digite o nome do flow"
                                value={flowName}
                                onChange={(e) => setFlowName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter >


                        <Button variant="ghost" onClick={() => setShowCreateFlow(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateFlow}
                            disabled={!flowName.trim()}
                        >
                            Criar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
} 