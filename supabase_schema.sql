-- SQL schema for Supabase database

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create applications table
create table applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  company_name text not null,
  position text not null,
  job_link text,
  apply_date date default current_date,
  status text default 'applied' check (status in ('applied', 'interview', 'offer', 'rejected', 'no_response')),
  notes text,
  cv_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create a trigger to automatically update the updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
   NEW.updated_at = now();
   return NEW;
end;
$$ language 'plpgsql';

create trigger update_applications_updated_at before update
  on applications for each row execute procedure
  update_updated_at_column();

-- Set up Row Level Security (RLS)
alter table applications enable row level security;

-- Create policies
create policy "Users can view their own applications"
  on applications for select
  using (auth.uid() = user_id);

create policy "Users can insert their own applications"
  on applications for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own applications"
  on applications for update
  using (auth.uid() = user_id);

create policy "Users can delete their own applications"
  on applications for delete
  using (auth.uid() = user_id);

-- Create a storage bucket for CVs (optional)
insert into storage.buckets (id, name, public)
  values ('cvs', 'cvs', false);

-- Set up RLS for storage
create policy "Users can upload CVs"
  on storage.objects for insert
  with check (bucket_id = 'cvs' and auth.uid() = owner);

create policy "Users can view their own CVs"
  on storage.objects for select
  using (bucket_id = 'cvs' and auth.uid() = owner);

create policy "Users can delete their own CVs"
  on storage.objects for delete
  using (bucket_id = 'cvs' and auth.uid() = owner);