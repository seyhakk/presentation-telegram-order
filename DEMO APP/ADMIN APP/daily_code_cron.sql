-- ============================================
-- Schedule auto-generation of daily dine-in code
-- via Supabase pg_cron + pg_net
-- 
-- Run this AFTER creating the function endpoint
-- ============================================

-- Enable pg_cron extension (should already be enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule a POST to the generate endpoint every day at 1pm (13:00)
-- Uses pg_net to make the HTTP request
SELECT cron.schedule(
    'daily-dinein-code',           -- job name
    '0 13 * * *',                  -- cron: every day at 1pm
    $$SELECT net.http_post(
        url:='https://admin-app-zeta-pink.vercel.app/api/generate-daily-code',
        headers:='{"Content-Type": "application/json"}'::jsonb
    ) AS request_id;$$
);

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To remove the schedule:
-- SELECT cron.unschedule('daily-dinein-code');
