import { useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useFinancialStore } from '@/stores/financialStore';
import { TimelineMilestone, MilestoneSeverity } from '@/types/timeline';
import { addDays, differenceInDays, isAfter, isBefore, parseISO, startOfDay } from 'date-fns';

export function useTimelineMilestones() {
  const { projects } = useProjects();
  const { revenues, contracts } = useFinancialStore();

  const milestones = useMemo(() => {
    const today = startOfDay(new Date());
    const thirtyDaysLater = addDays(today, 30);
    const result: TimelineMilestone[] = [];

    // 1. Generate milestones from Projects
    projects.forEach((project) => {
      const projectName = project.name;
      const clientName = project.client_name;

      // Project delivery date
      if (project.due_date) {
        const deliveryDate = parseISO(project.due_date);
        if (isAfter(deliveryDate, today) && isBefore(deliveryDate, thirtyDaysLater)) {
          const daysUntil = differenceInDays(deliveryDate, today);
          let severity: MilestoneSeverity = 'normal';
          
          // Critical if within 3 days, risk if within 7 days
          if (daysUntil <= 3) severity = 'critical';
          else if (daysUntil <= 7) severity = 'risk';

          // Increase severity if project has blockers or is at risk
          if (project.has_payment_block) severity = 'critical';
          if (project.health_score && project.health_score < 70) {
            severity = severity === 'normal' ? 'risk' : 'critical';
          }

          result.push({
            id: `proj-delivery-${project.id}`,
            projectId: project.id,
            projectName,
            clientName: clientName || undefined,
            title: `Entrega Final - ${projectName}`,
            date: project.due_date,
            type: 'delivery',
            severity,
          });
        }
      }

      // Project stages with planned dates (not started yet)
      project.stages?.forEach((stage) => {
        if (stage.status === 'not_started' && stage.planned_start) {
          const stageDate = parseISO(stage.planned_start);
          if (isAfter(stageDate, today) && isBefore(stageDate, thirtyDaysLater)) {
            const daysUntil = differenceInDays(stageDate, today);
            let severity: MilestoneSeverity = 'normal';
            
            if (daysUntil <= 2) severity = 'risk';

            result.push({
              id: `proj-stage-${project.id}-${stage.id}`,
              projectId: project.id,
              projectName,
              clientName: clientName || undefined,
              title: `${stage.title} - ${projectName}`,
              date: stage.planned_start,
              type: 'internal',
              severity,
              linkedStageId: stage.id,
            });
          }
        }
      });
    });

    // 2. Generate milestones from Financial - Revenues (payments due)
    revenues.forEach((revenue) => {
      if (revenue.status === 'pending' && revenue.due_date) {
        const dueDate = parseISO(revenue.due_date);
        if (isAfter(dueDate, today) && isBefore(dueDate, thirtyDaysLater)) {
          const project = projects.find(p => p.id === revenue.project_id);
          const daysUntil = differenceInDays(dueDate, today);
          let severity: MilestoneSeverity = 'normal';
          
          if (daysUntil <= 3) severity = 'critical';
          else if (daysUntil <= 7) severity = 'risk';

          result.push({
            id: `fin-revenue-${revenue.id}`,
            projectId: revenue.project_id || '',
            projectName: project?.name || revenue.description,
            clientName: project?.client_name || undefined,
            title: `Pagamento - ${revenue.description}`,
            date: revenue.due_date,
            type: 'payment',
            severity,
          });
        }
      }
    });

    // 3. Generate milestones from Financial - Contract Milestones
    contracts.forEach((contract) => {
      const project = projects.find(p => p.id === contract.project_id);
      
      contract.milestones?.forEach((milestone) => {
        if (milestone.status === 'pending' && milestone.due_date) {
          const dueDate = parseISO(milestone.due_date);
          if (isAfter(dueDate, today) && isBefore(dueDate, thirtyDaysLater)) {
            const daysUntil = differenceInDays(dueDate, today);
            
            let severity: MilestoneSeverity = 'normal';
            if (daysUntil <= 3) severity = 'critical';
            else if (daysUntil <= 7) severity = 'risk';

            result.push({
              id: `fin-milestone-${milestone.id}`,
              projectId: contract.project_id || '',
              projectName: project?.name || contract.project_name || milestone.title,
              clientName: contract.client_name || project?.client_name || undefined,
              title: milestone.title,
              date: milestone.due_date,
              type: 'payment',
              severity,
            });
          }
        }
      });
    });

    // 4. Add overdue revenues as critical (show at today)
    revenues.forEach((revenue) => {
      if (revenue.status === 'overdue' && revenue.due_date) {
        const dueDate = parseISO(revenue.due_date);
        if (isBefore(dueDate, today)) {
          const project = projects.find(p => p.id === revenue.project_id);
          result.push({
            id: `fin-overdue-${revenue.id}`,
            projectId: revenue.project_id || '',
            projectName: project?.name || revenue.description,
            clientName: project?.client_name || undefined,
            title: `⚠️ ATRASADO - ${revenue.description}`,
            date: today.toISOString(),
            type: 'payment',
            severity: 'critical',
          });
        }
      }
    });

    // Sort by severity (critical first) then by date
    return result.sort((a, b) => {
      const severityOrder = { critical: 0, risk: 1, normal: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [projects, revenues, contracts]);

  return milestones;
}
