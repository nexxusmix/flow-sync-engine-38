import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { CockpitTab } from '@/components/instagram-engine/CockpitTab';
import { CalendarTab } from '@/components/instagram-engine/CalendarTab';
import { ScriptsTab } from '@/components/instagram-engine/ScriptsTab';
import { CreateWithAITab } from '@/components/instagram-engine/CreateWithAITab';
import { CampaignsTab } from '@/components/instagram-engine/CampaignsTab';
import { ProjectionsTab } from '@/components/instagram-engine/ProjectionsTab';
import { ProfileHealthTab } from '@/components/instagram-engine/ProfileHealthTab';

const TABS = [
  { key: 'cockpit', label: 'Cockpit', icon: 'rocket_launch' },
  { key: 'calendar', label: 'Calendário', icon: 'calendar_month' },
  { key: 'scripts', label: 'Roteiros', icon: 'description' },
  { key: 'create', label: 'Criar com IA', icon: 'auto_awesome' },
  { key: 'campaigns', label: 'Campanhas', icon: 'campaign' },
  { key: 'projections', label: 'Projeções', icon: 'trending_up' },
  { key: 'health', label: 'Saúde', icon: 'monitoring' },
];

export default function InstagramEnginePage() {
  const [activeTab, setActiveTab] = useState('cockpit');

  return (
    <DashboardLayout title="Instagram Engine">
      <motion.div
        className="space-y-6 max-w-[1600px] mx-auto"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                Instagram <span className="bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] bg-clip-text text-transparent">Engine</span>
              </h1>
              <p className="text-xs text-muted-foreground">Sistema operacional de crescimento e posicionamento • @squadfilme</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start gap-0 bg-muted/30 border border-border/50 rounded-xl p-1 overflow-x-auto flex-nowrap">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="cockpit" className="mt-6"><CockpitTab /></TabsContent>
          <TabsContent value="calendar" className="mt-6"><CalendarTab /></TabsContent>
          <TabsContent value="scripts" className="mt-6"><ScriptsTab /></TabsContent>
          <TabsContent value="create" className="mt-6"><CreateWithAITab /></TabsContent>
          <TabsContent value="campaigns" className="mt-6"><CampaignsTab /></TabsContent>
          <TabsContent value="projections" className="mt-6"><ProjectionsTab /></TabsContent>
          <TabsContent value="health" className="mt-6"><ProfileHealthTab /></TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
}
