-- 1. Create a config table for secrets
create table if not exists public.app_config (
  key text primary key,
  value text not null
);

-- 2. Insert the admin password
-- (Using upsert to avoid errors if run multiple times)
insert into public.app_config (key, value)
values ('admin_password', 'Battan25')
on conflict (key) do update set value = EXCLUDED.value;

-- Enable RLS (Security)
alter table public.app_config enable row level security;

-- Policy: Only allow Postgres/Service Role to read this table directly
-- We do NOT want the public to select * from app_config
create policy "No public access to config"
  on public.app_config
  for all
  using (false); 

-- 3. Create a Secure Function to Verify Password
-- This runs on the server (Security Definer) and returns TRUE/FALSE
create or replace function verify_admin_password(input_pass text)
returns boolean as $$
declare
  stored_pass text;
begin
  select value into stored_pass from public.app_config where key = 'admin_password';
  return stored_pass = input_pass;
end;
$$ language plpgsql security definer;
