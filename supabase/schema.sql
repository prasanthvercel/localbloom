-- Create a table for public profiles
create table profiles (
  id uuid not null references auth.users on delete cascade,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  role text,
  address text,
  city text,
  state text,
  country text,
  pincode text,
  mobile_number text,

  primary key (id),
  unique(id),
  constraint full_name_length check (char_length(full_name) >= 3)
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table profiles
  enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- This trigger automatically creates a profile for new users.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, avatar_url)
  values (new.id, new.raw_user_meta_data->>'role', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Set up Storage!
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true);

create policy "Avatar images are publicly accessible." on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Anyone can upload an avatar." on storage.objects
  for insert with check (bucket_id = 'avatars');

create policy "Anyone can update their own avatar." on storage.objects
  for update using ( auth.uid() = owner ) with check (bucket_id = 'avatars');
