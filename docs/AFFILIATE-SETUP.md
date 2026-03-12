# Affiliate program setup

## If the application form fails to submit

1. **Production env**  
   Set `SUPABASE_SERVICE_ROLE_KEY` in your hosting env (e.g. Railway).  
   Get it from Supabase Dashboard → Settings → API → `service_role` (secret).  
   The affiliate form and admin approve/deny use the service-role client; without this key the insert will fail.

2. **Database**  
   Ensure the `affiliate_applications` (and `affiliates`) tables exist in the **same** Supabase project your app uses.  
   Run the SQL in `supabase/affiliate-tables.sql`, or your full migration (e.g. `supabase/run-all-migrations.sql`) in the Supabase SQL editor.

3. **Logs**  
   After the change in `app/api/affiliate/apply/route.ts`, a failed insert is logged with Supabase `error.code` and `error.message`. Check your server logs (e.g. Railway) to see the exact error (e.g. missing table, RLS, or invalid data).
