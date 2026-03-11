-- Daily database search usage per user (for tier limits: starter 5, growth 10, platinum 50).
create table if not exists public.search_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default (current_date at time zone 'utc'),
  count int not null default 0,
  primary key (user_id, usage_date)
);

alter table public.search_usage enable row level security;

create policy "Users can read own search_usage"
  on public.search_usage for select
  using (auth.uid() = user_id);

create policy "Users can insert own search_usage"
  on public.search_usage for insert
  with check (auth.uid() = user_id);

create policy "Users can update own search_usage"
  on public.search_usage for update
  using (auth.uid() = user_id);
