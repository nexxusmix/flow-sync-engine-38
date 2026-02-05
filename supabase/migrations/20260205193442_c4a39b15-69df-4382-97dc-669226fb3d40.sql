-- Habilitar realtime para tabelas relacionadas a projetos
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_files;
ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_links;
ALTER PUBLICATION supabase_realtime ADD TABLE public.revenues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prospect_opportunities;