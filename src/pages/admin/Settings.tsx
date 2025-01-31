export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold">Em breve</h2>
          <p className="text-muted-foreground">
            Configurações avançadas estarão disponíveis em breve.
          </p>
        </div>
      </div>
    </div>
  );
}
