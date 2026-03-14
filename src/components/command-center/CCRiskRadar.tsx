import { AIRiskRadar } from '@/components/dashboard/AIRiskRadar';
import { ProjectHealthRanking } from '@/components/dashboard/ProjectHealthRanking';
import type { ExecutiveMetrics } from '@/hooks/useExecutiveDashboard';
import { motion } from 'framer-motion';

interface Props {
  metrics: ExecutiveMetrics;
}

export function CCRiskRadar({ metrics }: Props) {
  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <AIRiskRadar
        metrics={metrics}
        projects={metrics.rawProjects || []}
        tasks={metrics.rawTasks || []}
        deals={metrics.rawDeals || []}
        revenues={metrics.rawRevenues || []}
      />
      <ProjectHealthRanking projects={metrics.projectRiskScores} />
    </motion.div>
  );
}
