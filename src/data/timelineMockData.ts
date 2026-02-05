import { TimelineMilestone, TimelineStageSegment, TimelineData } from "@/types/timeline";
import { addDays, subDays, format } from "date-fns";

const today = new Date();

// Mock milestones for dashboard (all projects)
export const dashboardMilestones: TimelineMilestone[] = [
  {
    id: "m1",
    projectId: "SF-092",
    projectName: "Manifesto Matta",
    clientName: "Lugasa Group",
    title: "Entrega Final - Manifesto",
    date: addDays(today, 3).toISOString(),
    type: "delivery",
    severity: "critical",
  },
  {
    id: "m2",
    projectId: "SF-095",
    projectName: "Brand Film Exotic",
    clientName: "Sarto Imóveis",
    title: "Revisão Cliente",
    date: addDays(today, 7).toISOString(),
    type: "review",
    severity: "risk",
  },
  {
    id: "m3",
    projectId: "SF-102",
    projectName: "Legacy Private",
    clientName: "Banco Legacy",
    title: "Aprovação Roteiro",
    date: addDays(today, 12).toISOString(),
    type: "review",
    severity: "normal",
  },
  {
    id: "m4",
    projectId: "SF-108",
    projectName: "Tour 360",
    clientName: "Vértice Arq",
    title: "Captação Agendada",
    date: addDays(today, 18).toISOString(),
    type: "internal",
    severity: "normal",
  },
  {
    id: "m5",
    projectId: "SF-092",
    projectName: "Manifesto Matta",
    clientName: "Lugasa Group",
    title: "Pagamento Final",
    date: addDays(today, 25).toISOString(),
    type: "payment",
    severity: "normal",
  },
];

// Mock segments for project detail timeline
export const getProjectTimelineSegments = (projectId: string): TimelineStageSegment[] => {
  // SF-092 - Manifesto Matta (Em Edição)
  if (projectId === "SF-092" || projectId.includes("SF-092")) {
    return [
      {
        id: "s1",
        projectId: "SF-092",
        name: "Briefing",
        status: "done",
        plannedStart: subDays(today, 30).toISOString(),
        plannedEnd: subDays(today, 27).toISOString(),
        actualStart: subDays(today, 30).toISOString(),
        actualEnd: subDays(today, 27).toISOString(),
        ownerName: "Maria V.",
        ownerInitials: "MV",
        progress: 100,
      },
      {
        id: "s2",
        projectId: "SF-092",
        name: "Roteiro",
        status: "done",
        plannedStart: subDays(today, 26).toISOString(),
        plannedEnd: subDays(today, 20).toISOString(),
        actualStart: subDays(today, 26).toISOString(),
        actualEnd: subDays(today, 19).toISOString(),
        ownerName: "Carlos R.",
        ownerInitials: "CR",
        progress: 100,
      },
      {
        id: "s3",
        projectId: "SF-092",
        name: "Pré-Produção",
        status: "done",
        plannedStart: subDays(today, 19).toISOString(),
        plannedEnd: subDays(today, 14).toISOString(),
        actualStart: subDays(today, 18).toISOString(),
        actualEnd: subDays(today, 13).toISOString(),
        ownerName: "Bruno M.",
        ownerInitials: "BM",
        progress: 100,
      },
      {
        id: "s4",
        projectId: "SF-092",
        name: "Captação",
        status: "done",
        plannedStart: subDays(today, 13).toISOString(),
        plannedEnd: subDays(today, 10).toISOString(),
        actualStart: subDays(today, 12).toISOString(),
        actualEnd: subDays(today, 9).toISOString(),
        ownerName: "Ana L.",
        ownerInitials: "AL",
        progress: 100,
      },
      {
        id: "s5",
        projectId: "SF-092",
        name: "Edição",
        status: "in_progress",
        plannedStart: subDays(today, 9).toISOString(),
        plannedEnd: addDays(today, 2).toISOString(),
        actualStart: subDays(today, 8).toISOString(),
        ownerName: "Victor S.",
        ownerInitials: "VS",
        progress: 85,
      },
      {
        id: "s6",
        projectId: "SF-092",
        name: "Revisão",
        status: "not_started",
        plannedStart: addDays(today, 2).toISOString(),
        plannedEnd: addDays(today, 4).toISOString(),
        ownerName: "Maria V.",
        ownerInitials: "MV",
        progress: 0,
      },
      {
        id: "s7",
        projectId: "SF-092",
        name: "Aprovação",
        status: "not_started",
        plannedStart: addDays(today, 4).toISOString(),
        plannedEnd: addDays(today, 5).toISOString(),
        progress: 0,
      },
      {
        id: "s8",
        projectId: "SF-092",
        name: "Entrega",
        status: "not_started",
        plannedStart: addDays(today, 5).toISOString(),
        plannedEnd: addDays(today, 6).toISOString(),
        progress: 0,
      },
    ];
  }

  // SF-095 - Brand Film Exotic (Em Risco)
  if (projectId === "SF-095" || projectId.includes("SF-095")) {
    return [
      {
        id: "s1",
        projectId: "SF-095",
        name: "Briefing",
        status: "done",
        plannedStart: subDays(today, 25).toISOString(),
        plannedEnd: subDays(today, 22).toISOString(),
        actualStart: subDays(today, 25).toISOString(),
        actualEnd: subDays(today, 21).toISOString(),
        ownerName: "Victor R.",
        ownerInitials: "VR",
        progress: 100,
      },
      {
        id: "s2",
        projectId: "SF-095",
        name: "Roteiro",
        status: "done",
        plannedStart: subDays(today, 21).toISOString(),
        plannedEnd: subDays(today, 16).toISOString(),
        actualStart: subDays(today, 20).toISOString(),
        actualEnd: subDays(today, 14).toISOString(),
        ownerName: "Carlos R.",
        ownerInitials: "CR",
        progress: 100,
        blockers: ["aprovacao_pendente"],
      },
      {
        id: "s3",
        projectId: "SF-095",
        name: "Captação",
        status: "done",
        plannedStart: subDays(today, 14).toISOString(),
        plannedEnd: subDays(today, 10).toISOString(),
        actualStart: subDays(today, 13).toISOString(),
        actualEnd: subDays(today, 8).toISOString(),
        ownerName: "Bruno M.",
        ownerInitials: "BM",
        progress: 100,
      },
      {
        id: "s4",
        projectId: "SF-095",
        name: "Edição",
        status: "in_progress",
        plannedStart: subDays(today, 8).toISOString(),
        plannedEnd: subDays(today, 2).toISOString(),
        actualStart: subDays(today, 7).toISOString(),
        ownerName: "Victor S.",
        ownerInitials: "VS",
        progress: 45,
        blockers: ["asset_pendente"],
      },
      {
        id: "s5",
        projectId: "SF-095",
        name: "Revisão",
        status: "not_started",
        plannedStart: addDays(today, 5).toISOString(),
        plannedEnd: addDays(today, 8).toISOString(),
        progress: 0,
      },
      {
        id: "s6",
        projectId: "SF-095",
        name: "Entrega",
        status: "not_started",
        plannedStart: addDays(today, 8).toISOString(),
        plannedEnd: addDays(today, 10).toISOString(),
        progress: 0,
      },
    ];
  }

  // Default project timeline
  return [
    {
      id: "s1",
      projectId,
      name: "Briefing",
      status: "done",
      plannedStart: subDays(today, 20).toISOString(),
      plannedEnd: subDays(today, 17).toISOString(),
      actualStart: subDays(today, 20).toISOString(),
      actualEnd: subDays(today, 17).toISOString(),
      progress: 100,
    },
    {
      id: "s2",
      projectId,
      name: "Roteiro",
      status: "in_progress",
      plannedStart: subDays(today, 16).toISOString(),
      plannedEnd: subDays(today, 10).toISOString(),
      actualStart: subDays(today, 15).toISOString(),
      progress: 60,
    },
    {
      id: "s3",
      projectId,
      name: "Captação",
      status: "not_started",
      plannedStart: addDays(today, 5).toISOString(),
      plannedEnd: addDays(today, 10).toISOString(),
      progress: 0,
    },
    {
      id: "s4",
      projectId,
      name: "Edição",
      status: "not_started",
      plannedStart: addDays(today, 11).toISOString(),
      plannedEnd: addDays(today, 20).toISOString(),
      progress: 0,
    },
    {
      id: "s5",
      projectId,
      name: "Entrega",
      status: "not_started",
      plannedStart: addDays(today, 21).toISOString(),
      plannedEnd: addDays(today, 25).toISOString(),
      progress: 0,
    },
  ];
};

// Get milestones for a specific project
export const getProjectMilestones = (projectId: string): TimelineMilestone[] => {
  return dashboardMilestones.filter((m) => m.projectId === projectId);
};

// Get full timeline data for a project
export const getProjectTimelineData = (projectId: string): TimelineData => {
  return {
    milestones: getProjectMilestones(projectId),
    segments: getProjectTimelineSegments(projectId),
    hasPaymentBlock: projectId === "SF-095",
    currentStage: projectId === "SF-092" ? "Edição" : "Roteiro",
    lastUpdated: new Date().toISOString(),
  };
};
