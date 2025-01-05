import { useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, GitBranch } from "lucide-react";
import { EntitiesCustomization } from "./customization/EntitiesCustomization";
import { PipelinesCustomization } from "./customization/PipelinesCustomization";
import { motion } from "framer-motion";

export function CustomizationSettings() {
  const handleDragEnd = (result: DropResult) => {
    console.log('Drag ended:', result);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 animate-fade-in"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
          Personalização
        </h2>
        <p className="text-muted-foreground text-lg mt-1">
          Configure suas entidades e pipelines de forma intuitiva
        </p>
      </motion.div>

      <Card className="p-6 shadow-md border-primary/10">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Tabs defaultValue="entities" className="space-y-6">
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
            
            <TabsContent value="entities" className="space-y-4 mt-2 animate-fade-in">
              <EntitiesCustomization />
            </TabsContent>
            
            <TabsContent value="pipelines" className="space-y-4 mt-2 animate-fade-in">
              <PipelinesCustomization />
            </TabsContent>
          </Tabs>
        </DragDropContext>
      </Card>
    </motion.div>
  );
}