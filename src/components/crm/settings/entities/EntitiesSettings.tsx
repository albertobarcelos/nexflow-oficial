import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityList } from "./components/EntityList";
import { EntityDiagram } from "./components/EntityDiagram";
import { useEntities } from "./hooks/useEntities";
import "./styles/diagram.css";

export function EntitiesSettings() {
  const { entities, relationships, isLoading } = useEntities();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Tabs defaultValue="list" className="w-full">
      <TabsList>
        <TabsTrigger value="list">Lista</TabsTrigger>
        <TabsTrigger value="diagram">Diagrama</TabsTrigger>
      </TabsList>
      <TabsContent value="list">
        <EntityList entities={entities} />
      </TabsContent>
      <TabsContent value="diagram">
        <EntityDiagram entities={entities} relationships={relationships} />
      </TabsContent>
    </Tabs>
  );
}