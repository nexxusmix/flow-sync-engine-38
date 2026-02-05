export default function Configuracoes() {
  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Personalize seu sistema
        </p>
      </div>

      <div className="flex items-center justify-center h-[60vh] border border-dashed border-border rounded-xl bg-card/50">
        <div className="text-center">
          <p className="text-muted-foreground">Configurações em desenvolvimento</p>
          <p className="text-sm text-muted-foreground mt-1">
            Catálogo de serviços, templates e integrações
          </p>
        </div>
      </div>
    </div>
  );
}
