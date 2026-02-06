import { useEffect, useState, useCallback } from "react";
import { Package, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { CreativePackage, CreativePackageContent } from "@/types/creative-packages";
import { Campaign } from "@/types/marketing";
import { CreativePackagesList } from "./CreativePackagesList";
import { CreativePackageViewer } from "./CreativePackageViewer";

interface CampaignPackagesSectionProps {
  campaign: Campaign;
  campaigns: Campaign[];
}

export function CampaignPackagesSection({ campaign, campaigns }: CampaignPackagesSectionProps) {
  const [packages, setPackages] = useState<CreativePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<CreativePackage | null>(null);

  const fetchPackages = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("campaign_creative_packages")
        .select("*")
        .eq("campaign_id", campaign.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Map the data to our typed interface
      const typedPackages: CreativePackage[] = (data || []).map(pkg => ({
        ...pkg,
        package_json: pkg.package_json as CreativePackageContent,
      }));

      setPackages(typedPackages);
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [campaign.id]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between px-3 py-2 h-auto">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Package className="w-4 h-4" />
              Pacotes Criativos
              {packages.length > 0 && (
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  {packages.length}
                </span>
              )}
            </span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          {isLoading ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Carregando...
            </div>
          ) : (
            <CreativePackagesList
              packages={packages}
              onRefresh={fetchPackages}
              onOpenPackage={setSelectedPackage}
            />
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Package Viewer Sheet */}
      <CreativePackageViewer
        pkg={selectedPackage}
        campaign={campaign}
        campaigns={campaigns}
        onClose={() => setSelectedPackage(null)}
        onRefresh={fetchPackages}
      />
    </>
  );
}
