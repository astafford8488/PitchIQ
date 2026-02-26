-- Pitch IQ template engine: store templates with vertical, success rate, usage count.
-- Run in Supabase SQL Editor.

create table if not exists public.pitch_templates (
  id uuid primary key default gen_random_uuid(),
  template_subject text not null,
  template_body text not null,
  vertical text,
  success_count integer default 0,
  usage_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.pitch_templates enable row level security;

-- Templates: readable by all authenticated (global library); only service/admin can insert/update.
create policy "pitch_templates_select" on public.pitch_templates for select to authenticated using (true);
create policy "pitch_templates_insert" on public.pitch_templates for insert to authenticated with check (true);
create policy "pitch_templates_update" on public.pitch_templates for update to authenticated using (true);

alter table public.pitches add column if not exists template_id uuid references public.pitch_templates(id) on delete set null;

-- Seed a generic template (user can add more via SQL or a future admin UI).
insert into public.pitch_templates (template_subject, template_body, vertical)
select
  'Guest pitch for {{podcast_title}}',
  'Hi, {{host_name}},

I''d love to be a guest on {{podcast_title}}.

{{bio}}

{{expertise}}

{{credentials}}

Best,
{{name}}',
  null
where not exists (select 1 from public.pitch_templates limit 1);
