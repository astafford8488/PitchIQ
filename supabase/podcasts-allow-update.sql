-- Allow authenticated users to update podcasts (e.g. add host email for sending pitches).
-- Run in Supabase SQL Editor if you need to edit podcast contact info.

create policy "podcasts_update" on public.podcasts for update to authenticated using (true) with check (true);
