import { ProjectWithStages } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";
import { toast } from "sonner";

interface PortalTabProps {
  project: ProjectWithStages;
}

export function PortalTab({ project }: PortalTabProps) {
  const handleGenerateLink = () => {
    toast.info('Portal do cliente será implementado em breve');
  };

  return (
    <div className="glass-card rounded-2xl p-12 text-center">
      <Link className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">Portal do Cliente</h3>
      <p className="text-muted-foreground mb-6">
        Crie um link seguro para o cliente acompanhar o projeto, revisar entregas e aprovar versões.
      </p>
      <Button onClick={handleGenerateLink}>
        <Link className="w-4 h-4 mr-2" />
        Gerar Link do Portal
      </Button>
    </div>
  );
}
