export default function Configuracoes() {
  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Personalize seu sistema
        </p>
      </div>

      <div className="bento-card flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground">Configurações em desenvolvimento</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Catálogo de serviços, templates e integrações
          </p>
        </div>
      </div>
    </div>
  );
}
