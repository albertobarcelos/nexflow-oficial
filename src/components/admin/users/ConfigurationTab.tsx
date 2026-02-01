import { GlobalLevelsManager } from "./GlobalLevelsManager";

export function ConfigurationTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuração de Níveis Globais</h2>
        <p className="text-muted-foreground">
          Configure os níveis hierárquicos globais e seus critérios de promoção/demissão automática
        </p>
      </div>

      <GlobalLevelsManager />
    </div>
  );
}
