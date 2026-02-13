
-- Enable realtime for CRM tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_deals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_stages;
