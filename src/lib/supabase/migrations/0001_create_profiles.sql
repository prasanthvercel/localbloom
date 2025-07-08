-- Creates a 'profiles' table to store user data.
-- Creates RLS policies to secure the data.
-- Creates a trigger to automatically create a profile for new users.

-- 1. Create the profiles table
create table public.profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  role text,
  address text,
  city text,
  state text,
  country text,
  mobile_number text,
  pincode text
);

-- 2. Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone."
  on public.profiles for select using (true);

create policy "Users can insert their own profile."
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile."
  on public.profiles for update using (auth.uid() = id);

-- 3. Create a trigger to create a profile for new users
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, new.raw_user_meta_data->>'role');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
