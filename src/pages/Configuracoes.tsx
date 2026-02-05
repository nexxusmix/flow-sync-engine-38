import { Settings2, Palette, FileText, Link2 } from "lucide-react";

const settingsSections = [
  {
    icon: Palette,
    title: "Aparência",
    description: "Personalize cores e temas",
  },
  {
    icon: FileText,
    title: "Catálogo de Serviços",
    description: "Gerencie seus produtos e preços",
  },
  {
    icon: Link2,
    title: "Integrações",
    description: "Conecte com outras ferramentas",
  },
];

export default function Configuracoes() {
  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="mb-6">
        <span className="polo-label">Sistema</span>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Personalize seu sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {settingsSections.map((section) => (
          <div
            key={section.title}
            className="polo-card cursor-pointer group"
          >
            <div className="p-2.5 rounded-xl bg-secondary border border-border w-fit mb-4">
              <section.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-medium">{section.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
          </div>
        ))}
      </div>

      <div className="polo-card flex items-center justify-center h-[40vh]">
        <div className="text-center">
          <Settings2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Selecione uma seção para configurar</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Catálogo de serviços, templates e integrações
          </p>
        </div>
      </div>
    </div>
  );
}
