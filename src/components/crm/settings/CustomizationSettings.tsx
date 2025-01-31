import { useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitBranch, HelpCircle } from "lucide-react";
import { PipelinesCustomization } from "./customization/PipelinesCustomization";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CustomFieldsLayout } from "./custom-fields/CustomFieldsLayout";

export function CustomizationSettings() {
  const [activeTab, setActiveTab] = useState("entities");

  const getHelpText = () => {
    switch (activeTab) {
      case "entities":
        return "Gerencie suas entidades personalizadas e campos customizados.";
      case "pipelines":
        return "Configure seus pipelines e estágios de vendas.";
      default:
        return "Precisa de ajuda? Clique para ver o guia completo de personalização do CRM.";
    }
  };

  const handleDragEnd = (result: DropResult) => {
    console.log('Drag ended:', result);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-[calc(100vh-8rem)] gap-4 relative"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="absolute top-0 right-0 z-10"
          >
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[300px]">
          <p>{getHelpText()}</p>
        </TooltipContent>
      </Tooltip>

      <Card className="shadow-md border-primary/10 flex-1 min-h-0 flex flex-col">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Tabs 
            defaultValue="entities" 
            className="h-full flex flex-col"
            onValueChange={setActiveTab}
          >
            <div className="px-6 pt-6 flex-shrink-0">
              <TabsList className="w-full justify-start bg-muted/30 p-1">
                <TabsTrigger 
                  value="entities" 
                  className="flex items-center gap-2 text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200"
                >
                  Entidades
                </TabsTrigger>
                <TabsTrigger 
                  value="pipelines"
                  className="flex items-center gap-2 text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200"
                >
                  <GitBranch className="w-4 h-4" />
                  Pipelines
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex-1 p-6 min-h-0 overflow-hidden">
              <TabsContent value="entities" className="h-full m-0 animate-fade-in">
                <CustomFieldsLayout />
              </TabsContent>
              
              <TabsContent value="pipelines" className="h-full m-0 animate-fade-in">
                <PipelinesCustomization />
              </TabsContent>
            </div>
          </Tabs>
        </DragDropContext>
      </Card>
    </motion.div>
  );
}
