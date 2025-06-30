import React, { createContext, useContext, useState, ReactNode } from 'react';

// Tipagem do estado e das ações do contexto
interface Stage {
    name: string;
    description: string;
    color: string;
}

interface FlowBuilderState {
    title: string;
    stages: Stage[];
    setTitle: (title: string) => void;
    setStages: (stages: Stage[]) => void;
    addStage: (stage: Stage) => void;
    updateStage: (index: number, stage: Stage) => void;
    removeStage: (index: number) => void;
    resetFlow: () => void;
}

// Criar o contexto com um valor padrão undefined para checagem
const FlowBuilderContext = createContext<FlowBuilderState | undefined>(undefined);

// Provedor do contexto
export const FlowBuilderProvider = ({ children }: { children: ReactNode }) => {
    const [title, setTitle] = useState('');
    const [stages, setStages] = useState<Stage[]>([]);

    const addStage = (stage: Stage) => {
        setStages(prev => [...prev, stage]);
    };

    const updateStage = (index: number, stage: Stage) => {
        setStages(prev => prev.map((s, i) => i === index ? stage : s));
    };

    const removeStage = (index: number) => {
        setStages(prev => prev.filter((_, i) => i !== index));
    };
    
    const resetFlow = () => {
        setTitle('');
        setStages([]);
    };

    return (
        <FlowBuilderContext.Provider value={{ title, setTitle, stages, setStages, addStage, updateStage, removeStage, resetFlow }}>
            {children}
        </FlowBuilderContext.Provider>
    );
};

// Hook customizado para usar o contexto
export const useFlowBuilder = () => {
    const context = useContext(FlowBuilderContext);
    if (context === undefined) {
        throw new Error('useFlowBuilder must be used within a FlowBuilderProvider');
    }
    return context;
}; 