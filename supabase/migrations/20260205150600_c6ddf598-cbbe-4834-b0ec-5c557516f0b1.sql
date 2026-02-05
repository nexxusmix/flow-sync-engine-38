-- Proposals Module Tables

-- Main proposals table
CREATE TABLE public.proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  opportunity_id UUID NULL REFERENCES public.prospect_opportunities(id) ON DELETE SET NULL,
  project_id TEXT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  title TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'approved', 'rejected', 'expired')),
  valid_until DATE,
  total_value NUMERIC NOT NULL DEFAULT 0,
  notes_internal TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Proposal sections (block-based editor)
CREATE TABLE public.proposal_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('intro', 'context', 'scope', 'deliverables', 'timeline', 'investment', 'terms', 'cta')),
  title TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Proposal deliverables
CREATE TABLE public.proposal_deliverables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  quantity INT DEFAULT 1,
  unit_price NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Proposal timeline phases
CREATE TABLE public.proposal_timeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Proposal acceptance record (audit trail)
CREATE TABLE public.proposal_acceptance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  accepted_by_name TEXT NOT NULL,
  accepted_by_email TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  notes TEXT
);

-- Proposal shareable links
CREATE TABLE public.proposal_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  view_count INT DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_acceptance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for proposals
CREATE POLICY "Users can view all proposals" ON public.proposals FOR SELECT USING (true);
CREATE POLICY "Users can insert proposals" ON public.proposals FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update proposals" ON public.proposals FOR UPDATE USING (true);
CREATE POLICY "Users can delete proposals" ON public.proposals FOR DELETE USING (true);

-- RLS Policies for proposal_sections
CREATE POLICY "Users can view all proposal_sections" ON public.proposal_sections FOR SELECT USING (true);
CREATE POLICY "Users can insert proposal_sections" ON public.proposal_sections FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update proposal_sections" ON public.proposal_sections FOR UPDATE USING (true);
CREATE POLICY "Users can delete proposal_sections" ON public.proposal_sections FOR DELETE USING (true);

-- RLS Policies for proposal_deliverables
CREATE POLICY "Users can view all proposal_deliverables" ON public.proposal_deliverables FOR SELECT USING (true);
CREATE POLICY "Users can insert proposal_deliverables" ON public.proposal_deliverables FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update proposal_deliverables" ON public.proposal_deliverables FOR UPDATE USING (true);
CREATE POLICY "Users can delete proposal_deliverables" ON public.proposal_deliverables FOR DELETE USING (true);

-- RLS Policies for proposal_timeline
CREATE POLICY "Users can view all proposal_timeline" ON public.proposal_timeline FOR SELECT USING (true);
CREATE POLICY "Users can insert proposal_timeline" ON public.proposal_timeline FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update proposal_timeline" ON public.proposal_timeline FOR UPDATE USING (true);
CREATE POLICY "Users can delete proposal_timeline" ON public.proposal_timeline FOR DELETE USING (true);

-- RLS Policies for proposal_acceptance (public access for client acceptance)
CREATE POLICY "Anyone can view proposal_acceptance" ON public.proposal_acceptance FOR SELECT USING (true);
CREATE POLICY "Anyone can insert proposal_acceptance" ON public.proposal_acceptance FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update proposal_acceptance" ON public.proposal_acceptance FOR UPDATE USING (true);
CREATE POLICY "Users can delete proposal_acceptance" ON public.proposal_acceptance FOR DELETE USING (true);

-- RLS Policies for proposal_links
CREATE POLICY "Anyone can view proposal_links" ON public.proposal_links FOR SELECT USING (true);
CREATE POLICY "Users can insert proposal_links" ON public.proposal_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update proposal_links" ON public.proposal_links FOR UPDATE USING (true);
CREATE POLICY "Users can delete proposal_links" ON public.proposal_links FOR DELETE USING (true);

-- Indexes for performance
CREATE INDEX idx_proposals_status ON public.proposals(status);
CREATE INDEX idx_proposals_opportunity ON public.proposals(opportunity_id);
CREATE INDEX idx_proposal_sections_proposal ON public.proposal_sections(proposal_id);
CREATE INDEX idx_proposal_deliverables_proposal ON public.proposal_deliverables(proposal_id);
CREATE INDEX idx_proposal_timeline_proposal ON public.proposal_timeline(proposal_id);
CREATE INDEX idx_proposal_links_token ON public.proposal_links(share_token);

-- Trigger for updated_at
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_marketing_updated_at();