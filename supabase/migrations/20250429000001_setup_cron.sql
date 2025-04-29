
-- Enable pg_cron extension (a prerequisite for scheduling edge functions)
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Create a cron job to run at midnight daily
select
  cron.schedule(
    'daily-due-date-reminder-check',  -- Unique name for the cron job
    '0 0 * * *',                     -- Cron schedule: Run at midnight every day
    $$
    select
      net.http_post(
          url:='https://mdwrmfqjxakhpwmfyvft.functions.supabase.co/send-due-date-reminders',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd3JtZnFqeGFraHB3bWZ5dmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzMDMxNTQsImV4cCI6MjA2MDg3OTE1NH0.JILbp0b-d7HlmnvxIFA9PTrTR6c6BXI8-oOvbmzcagA"}'::jsonb,
          body:='{"scheduledRun": true, "timestamp": "' || now() || '"}'::jsonb
      ) as request_id;
    $$
  );
