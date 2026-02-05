-- Report Snapshots - Store historical report data
CREATE TABLE public.report_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL CHECK (report_type IN ('owner', 'sales', 'ops', 'finance', 'marketing', 'project', 'client')),
  scope_id UUID NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  generated_by UUID NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Report Exports - Track PDF exports
CREATE TABLE public.report_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  scope_id UUID NULL,
  file_url TEXT,
  format TEXT NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for report_snapshots
CREATE POLICY "Users can view all report_snapshots" ON public.report_snapshots FOR SELECT USING (true);
CREATE POLICY "Users can insert report_snapshots" ON public.report_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update report_snapshots" ON public.report_snapshots FOR UPDATE USING (true);
CREATE POLICY "Users can delete report_snapshots" ON public.report_snapshots FOR DELETE USING (true);

-- RLS Policies for report_exports
CREATE POLICY "Users can view all report_exports" ON public.report_exports FOR SELECT USING (true);
CREATE POLICY "Users can insert report_exports" ON public.report_exports FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update report_exports" ON public.report_exports FOR UPDATE USING (true);
CREATE POLICY "Users can delete report_exports" ON public.report_exports FOR DELETE USING (true);

-- Indexes
CREATE INDEX idx_report_snapshots_type ON public.report_snapshots(report_type);
CREATE INDEX idx_report_snapshots_period ON public.report_snapshots(period_start, period_end);
CREATE INDEX idx_report_exports_type ON public.report_exports(report_type);