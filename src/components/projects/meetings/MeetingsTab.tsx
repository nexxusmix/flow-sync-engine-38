/**
 * MeetingsTab - Full meetings/interactions tab for project detail
 * Timeline list + detail panel layout
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectWithStages } from "@/hooks/useProjects";
import {
  useProjectInteractions,
  useProjectActionItems,
} from "@/hooks/useProjectInteractions";
import { MeetingsList } from "./MeetingsList";
import { MeetingDetail } from "./MeetingDetail";
import { MeetingsHeader } from "./MeetingsHeader";
import { ActionItemsPanel } from "./ActionItemsPanel";
import { NewMeetingDialog } from "./NewMeetingDialog";
import { useUrlState } from "@/hooks/useUrlState";
import { Loader2 } from "lucide-react";

interface MeetingsTabProps {
  project: ProjectWithStages;
}

export function MeetingsTab({ project }: MeetingsTabProps) {
  const [meetingId, setMeetingId] = useUrlState('meetingId', '');
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [period, setPeriod] = useState<string>('30d');

  const { data: interactions, isLoading } = useProjectInteractions(project.id);
  const { data: actionItems } = useProjectActionItems(project.id);

  // Filter interactions
  const filteredInteractions = (interactions || []).filter(i => {
    if (filter !== 'all' && i.type !== filter) return false;
    
    // Period filter
    const date = new Date(i.occurred_at);
    const now = new Date();
    const days = period === '30d' ? 30 : period === '3m' ? 90 : period === '6m' ? 180 : 365;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    return date >= cutoff;
  });

  const selectedMeeting = interactions?.find(i => i.id === meetingId);

  // Open action items (not completed)
  const openActionItems = (actionItems || []).filter(a => a.status !== 'concluido');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters and new button */}
      <MeetingsHeader
        filter={filter}
        onFilterChange={setFilter}
        period={period}
        onPeriodChange={setPeriod}
        onNew={() => setIsNewOpen(true)}
        totalCount={interactions?.length || 0}
      />

      {/* Action Items Panel (collapsible) */}
      {openActionItems.length > 0 && (
        <ActionItemsPanel
          actionItems={openActionItems}
          projectId={project.id}
        />
      )}

      {/* Main Content: List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline List */}
        <div className="lg:col-span-1">
          <MeetingsList
            interactions={filteredInteractions}
            selectedId={meetingId}
            onSelect={setMeetingId}
          />
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedMeeting ? (
              <motion.div
                key={selectedMeeting.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <MeetingDetail
                  interaction={selectedMeeting}
                  projectId={project.id}
                  onClose={() => setMeetingId('')}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card border border-border p-12 text-center"
              >
                <p className="text-muted-foreground text-sm">
                  Selecione uma interação para ver detalhes
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* New Meeting Dialog */}
      <NewMeetingDialog
        open={isNewOpen}
        onOpenChange={setIsNewOpen}
        projectId={project.id}
      />
    </div>
  );
}
