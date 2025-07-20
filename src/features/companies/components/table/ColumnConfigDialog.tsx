import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Settings, GripVertical, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { CompanyColumn } from '../../hooks/useCompanyColumns';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ColumnConfigDialogProps {
    columns: CompanyColumn[];
    onColumnsChange: (columns: CompanyColumn[]) => void;
    onToggle: (id: string) => void;
    onReset: () => void;
}

interface SortableItemProps {
    column: CompanyColumn;
    onToggle: (id: string) => void;
}

function SortableItem({ column, onToggle }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: column.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-3 p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors"
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1"
            >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
            
            <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate block">{column.label}</span>
                <span className="text-xs text-muted-foreground truncate block">{column.id}</span>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
                <Switch
                    checked={column.visible}
                    onCheckedChange={() => onToggle(column.id)}
                />
                {column.visible ? (
                    <Eye className="w-4 h-4 text-green-600" />
                ) : (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
            </div>
        </div>
    );
}

export function ColumnConfigDialog({ columns, onColumnsChange, onToggle, onReset }: ColumnConfigDialogProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = columns.findIndex((col) => col.id === active.id);
            const newIndex = columns.findIndex((col) => col.id === over.id);
            
            onColumnsChange(arrayMove(columns, oldIndex, newIndex));
        }
    };

    const visibleCount = columns.filter(col => col.visible).length;

    return (
        <TooltipProvider>
            <Sheet>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="px-2">
                                <Settings className="w-4 h-4" />
                            </Button>
                        </SheetTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Configurar Colunas</p>
                    </TooltipContent>
                </Tooltip>
            <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                <SheetHeader className="pb-6">
                    <SheetTitle>Configurar Colunas da Tabela</SheetTitle>
                    <SheetDescription>
                        Arraste para reordenar e use os switches para mostrar/ocultar colunas da tabela de empresas.
                    </SheetDescription>
                </SheetHeader>
                
                <div className="space-y-6">
                    {/* Estatísticas e Reset */}
                    <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                        <div className="space-y-1">
                            <span className="text-sm font-medium">
                                {visibleCount} de {columns.length} colunas visíveis
                            </span>
                            <p className="text-xs text-muted-foreground">
                                Personalize a visualização da sua tabela
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onReset}
                            className="flex-shrink-0"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Resetar
                        </Button>
                    </div>
                    
                    {/* Lista de Colunas com Scroll */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">
                            Colunas Disponíveis
                        </h4>
                        <div className="max-h-[calc(100vh-280px)] overflow-y-auto space-y-2 pr-2">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                 items={columns.map(col => col.id)}
                                 strategy={verticalListSortingStrategy}
                             >
                                 {columns.map((column) => (
                                     <SortableItem
                                         key={column.id}
                                         column={column}
                                         onToggle={onToggle}
                                     />
                                 ))}
                                </SortableContext>
                            </DndContext>
                        </div>
                    </div>
                    
                    {/* Dicas de Uso */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                            💡 Dicas de Uso
                        </h5>
                        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                            <li>• Arraste o ícone ⋮⋮ para reordenar as colunas</li>
                            <li>• Use o switch para mostrar/ocultar colunas</li>
                            <li>• As configurações são salvas automaticamente</li>
                            <li>• Use "Resetar" para voltar ao padrão</li>
                        </ul>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
        </TooltipProvider>
    );
}