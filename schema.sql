create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  calorie_goal integer not null default 2500,
  protein_goal integer not null default 200,
  goal_weight numeric not null default 95,
  created_at timestamptz not null default now()
);

create table if not exists food_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  eaten_on date not null default current_date,
  name text not null,
  calories integer not null default 0,
  protein_g numeric not null default 0,
  source text not null default 'manual',
  barcode text,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists weights (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_on date not null default current_date,
  weight_kg numeric not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table food_logs enable row level security;
alter table weights enable row level security;

create policy "profile own select" on profiles for select using (auth.uid() = id);
create policy "profile own insert" on profiles for insert with check (auth.uid() = id);
create policy "profile own update" on profiles for update using (auth.uid() = id);

create policy "food own select" on food_logs for select using (auth.uid() = user_id);
create policy "food own insert" on food_logs for insert with check (auth.uid() = user_id);
create policy "food own delete" on food_logs for delete using (auth.uid() = user_id);
create policy "food own update" on food_logs for update using (auth.uid() = user_id);

create policy "weight own select" on weights for select using (auth.uid() = user_id);
create policy "weight own insert" on weights for insert with check (auth.uid() = user_id);
create policy "weight own delete" on weights for delete using (auth.uid() = user_id);
create policy "weight own update" on weights for update using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles(id) values(new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();
