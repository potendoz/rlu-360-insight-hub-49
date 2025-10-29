-- Run this SQL in Supabase SQL Editor to create access_logs table
-- https://supabase.com/dashboard/project/pvzgswmdxkybrnznsyih/sql/new

-- Create access_logs table
create table if not exists public.access_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_email text not null,
  user_name text,
  user_role text,
  action text not null,
  route text,
  ip_address text,
  user_agent text,
  timestamp timestamptz not null default now(),
  session_id text,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.access_logs enable row level security;

-- Create policy for admins to view all logs
create policy "Admins can view all access logs"
  on public.access_logs
  for select
  to authenticated
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create policy for anyone to insert logs (for logging purposes)
create policy "Anyone can insert access logs"
  on public.access_logs
  for insert
  to anon, authenticated
  with check (true);

-- Create indexes for better query performance
create index if not exists access_logs_user_id_idx on public.access_logs(user_id);
create index if not exists access_logs_timestamp_idx on public.access_logs(timestamp desc);
create index if not exists access_logs_action_idx on public.access_logs(action);
create index if not exists access_logs_user_email_idx on public.access_logs(user_email);

-- Grant permissions
grant select, insert on public.access_logs to anon, authenticated;
