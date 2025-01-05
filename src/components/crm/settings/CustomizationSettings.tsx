import { useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, GitBranch, HelpCircle } from "lucide-react";
import { EntitiesCustomization } from "./customization/EntitiesCustomization";
import { PipelinesCustomization } from "./customization/PipelinesCustomization";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function CustomizationSettings() {
  const handleDragEnd = (result: DropResult) => {
    console.log('Drag ended:', result);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 h-[calc(100vh-12rem)] overflow-hidden"
    >
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
            Personalização
          </h2>
          <p className="text-muted-foreground text-lg">
            Configure suas entidades e pipelines de forma intuitiva
          </p>
        </motion.div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="ml-4">
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-[300px]">
            <p>Precisa de ajuda? Clique para ver o guia completo de personalização do CRM.</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <Card className="shadow-md border-primary/10 h-[calc(100vh-16rem)] overflow-hidden">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Tabs defaultValue="entities" className="h-full flex flex-col">
            <div className="px-6 pt-6">
              <TabsList className="w-full justify-start bg-muted/30 p-1">
                <TabsTrigger 
                  value="entities" 
                  className="flex items-center gap-2 text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200"
                >
                  <Database className="w-4 h-4" />
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
            
            <div className="flex-1 overflow-hidden p-6">
              <TabsContent value="entities" className="h-full m-0 animate-fade-in">
                <EntitiesCustomization />
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