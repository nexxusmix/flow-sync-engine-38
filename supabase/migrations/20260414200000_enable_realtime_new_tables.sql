-- Enable realtime for newly added tables
alter table if exists public.project_health_snapshots replica identity full;
alter table if exists public.project_retrospectives replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.project_health_snapshots;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.project_retrospectives;
    exception when duplicate_object then null;
    end;
  end if;
end $$;
