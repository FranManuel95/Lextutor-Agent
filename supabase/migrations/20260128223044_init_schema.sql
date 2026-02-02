-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Auth)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text check (role in ('user', 'admin')) default 'user',
  study_mode text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS for Profiles
alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Chats table
create table chats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text default 'Nuevo Chat',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS for Chats
alter table chats enable row level security;

create policy "Users can view own chats"
  on chats for select
  using ( auth.uid() = user_id );

create policy "Users can insert own chats"
  on chats for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own chats"
  on chats for update
  using ( auth.uid() = user_id );

create policy "Users can delete own chats"
  on chats for delete
  using ( auth.uid() = user_id );

-- Messages table
create table messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references chats on delete cascade not null,
  user_id uuid references auth.users not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  audio_path text,
  transcript text,
  created_at timestamptz default now()
);

-- RLS for Messages
alter table messages enable row level security;

create policy "Users can view own messages"
  on messages for select
  using ( auth.uid() = user_id );

create policy "Users can insert own messages"
  on messages for insert
  with check ( auth.uid() = user_id );

-- Chat Summaries (1:1 with chat)
create table chat_summaries (
  chat_id uuid references chats on delete cascade primary key,
  user_id uuid references auth.users not null,
  summary_text text,
  updated_at timestamptz default now()
);

-- RLS for Summaries
alter table chat_summaries enable row level security;

create policy "Users can view own summaries"
  on chat_summaries for select
  using ( auth.uid() = user_id );

create policy "Users can insert own summaries"
  on chat_summaries for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own summaries"
  on chat_summaries for update
  using ( auth.uid() = user_id );

-- RAG Documents (Admin Only)
create table rag_documents (
  id uuid default gen_random_uuid() primary key,
  store_name text,
  document_name text,
  display_name text,
  area text,
  created_at timestamptz default now()
);

-- RLS for RAG Documents
alter table rag_documents enable row level security;

-- Admin check helper function
create or replace function is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

create policy "Admins can view all docs"
  on rag_documents for select
  using ( is_admin() );

create policy "Admins can insert docs"
  on rag_documents for insert
  with check ( is_admin() );

create policy "Admins can delete docs"
  on rag_documents for delete
  using ( is_admin() );

-- Storage Bucket Policy (audio-notes)
-- Note: Must be applied in Storage UI or via SQL if enabled
-- insert into storage.buckets (id, name, public) values ('audio-notes', 'audio-notes', false);
-- create policy "Users can upload audio" on storage.objects for insert with check ( bucket_id = 'audio-notes' and auth.uid() = owner );
-- create policy "Users can view own audio" on storage.objects for select using ( bucket_id = 'audio-notes' and auth.uid() = owner );

-- Triggers
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'user');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_chats_updated_at
  before update on chats
  for each row execute procedure update_updated_at();


