import { useMemo } from 'react';
import { useProjectsStore } from '@/stores/projectsStore';
import { useFinancialStore } from '@/stores/financialStore';
import { TimelineMilestone, MilestoneSeverity } from '@/types/timeline';
import { addDays, differenceInDays, isAfter, isBefore, parseISO, startOfDay } from 'date-fns';

export function useTimelineMilestones() {
  const { projects } = useProjectsStore();
  const { revenues, contracts } = useFinancialStore();

  const milestones = useMemo(() => {
    const today = startOfDay(new Date());
    const thirtyDaysLater = addDays(today, 30);
    const result: TimelineMilestone[] = [];

    // 1. Generate milestones from Projects
    projects.forEach((project) => {
      const projectName = project.title;
      const clientName = project.client?.company || project.client?.name;

      // Project delivery date
      if (project.estimatedDelivery) {
        const deliveryDate = parseISO(project.estimatedDelivery);
        if (isAfter(deliveryDate, today) && isBefore(deliveryDate, thirtyDaysLater)) {
          const daysUntil = differenceInDays(deliveryDate, today);
          let severity: MilestoneSeverity = 'normal';
          
          // Critical if within 3 days, risk if within 7 days
          if (daysUntil <= 3) severity = 'critical';
          else if (daysUntil <= 7) severity = 'risk';

          // Increase severity if project has blockers or is at risk
          if (project.blockedByPayment) severity = 'critical';
          if (project.healthScore && project.healthScore < 70) {
            severity = severity === 'normal' ? 'risk' : 'critical';
          }

          result.push({
            id: `proj-delivery-${project.id}`,
            projectId: project.id,
            projectName,
            clientName,
            title: `Entrega Final - ${projectName}`,
            date: project.estimatedDelivery,
            type: 'delivery',
            severity,
          });
        }
      }

      // Project stages with planned dates (not started yet)
      project.stages?.forEach((stage) => {
        if (stage.status === 'nao_iniciado' && stage.plannedDate) {
          const stageDate = parseISO(stage.plannedDate);
          if (isAfter(stageDate, today) && isBefore(stageDate, thirtyDaysLater)) {
            const daysUntil = differenceInDays(stageDate, today);
            let severity: MilestoneSeverity = 'normal';
            
            if (daysUntil <= 2) severity = 'risk';

            result.push({
              id: `proj-stage-${project.id}-${stage.id}`,
              projectId: project.id,
              projectName,
              clientName,
              title: `${stage.name} - ${projectName}`,
              date: stage.plannedDate,
              type: 'internal',
              severity,
              linkedStageId: stage.id,
            });
          }
        }
      });

      // Revision deadlines
      if (project.revisionsUsed && project.revisionsUsed > 0) {
        // Find current revision stage
        const revisionStage = project.stages?.find(s => s.type === 'revisao' && s.status === 'em_andamento');
        if (revisionStage?.plannedDate) {
          const revisionDate = parseISO(revisionStage.plannedDate);
          if (isAfter(revisionDate, today) && isBefore(revisionDate, thirtyDaysLater)) {
            const daysUntil = differenceInDays(revisionDate, today);
            result.push({
              id: `proj-revision-${project.id}`,
              projectId: project.id,
              projectName,
              clientName,
              title: `Revisão ${project.revisionsUsed} - ${projectName}`,
              date: revisionStage.plannedDate,
              type: 'review',
              severity: daysUntil <= 3 ? 'risk' : 'normal',
            });
          }
        }
      }
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
            projectName: project?.title || revenue.description,
            clientName: project?.client?.company,
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
              projectName: project?.title || contract.project_name || milestone.title,
              clientName: contract.client_name || project?.client?.company,
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
            projectName: project?.title || revenue.description,
            clientName: project?.client?.company,
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
