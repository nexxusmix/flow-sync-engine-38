// Timeline Types for SQUAD Hub

export type MilestoneType = 'delivery' | 'review' | 'payment' | 'internal' | 'start' | 'end';
export type MilestoneSeverity = 'normal' | 'risk' | 'critical';

export interface TimelineMilestone {
  id: string;
  projectId: string;
  projectName?: string;
  clientName?: string;
  title: string;
  date: string;
  type: MilestoneType;
  severity: MilestoneSeverity;
  linkedStageId?: string;
  description?: string;
}

export interface TimelineStageSegment {
  id: string;
  projectId: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'done' | 'blocked';
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  ownerName?: string;
  ownerInitials?: string;
  blockers?: string[];
  progress: number;
}

export interface TimelineData {
  milestones: TimelineMilestone[];
  segments?: TimelineStageSegment[];
  hasPaymentBlock?: boolean;
  currentStage?: string;
  lastUpdated?: string;
}
