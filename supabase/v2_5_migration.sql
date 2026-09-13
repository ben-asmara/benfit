-- BenFit V2.5 Polish + Automation migration

create table if not exists favorite_foods (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  calories integer not null default 0,
  protein_g numeric not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

create table if not exists meal_templates (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists reminders (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  time_of_day time not null default '08:00',
  days text[] not null default array['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table favorite_foods enable row level security;
alter table meal_templates enable row level security;
alter table reminders enable row level security;

drop policy if exists "favorites own select" on favorite_foods;
drop policy if exists "favorites own insert" on favorite_foods;
drop policy if exists "favorites own update" on favorite_foods;
drop policy if exists "favorites own delete" on favorite_foods;
create policy "favorites own select" on favorite_foods for select using (auth.uid() = user_id);
create policy "favorites own insert" on favorite_foods for insert with check (auth.uid() = user_id);
create policy "favorites own update" on favorite_foods for update using (auth.uid() = user_id);
create policy "favorites own delete" on favorite_foods for delete using (auth.uid() = user_id);

drop policy if exists "templates own select" on meal_templates;
drop policy if exists "templates own insert" on meal_templates;
drop policy if exists "templates own update" on meal_templates;
drop policy if exists "templates own delete" on meal_templates;
create policy "templates own select" on meal_templates for select using (auth.uid() = user_id);
create policy "templates own insert" on meal_templates for insert with check (auth.uid() = user_id);
create policy "templates own update" on meal_templates for update using (auth.uid() = user_id);
create policy "templates own delete" on meal_templates for delete using (auth.uid() = user_id);

drop policy if exists "reminders own select" on reminders;
drop policy if exists "reminders own insert" on reminders;
drop policy if exists "reminders own update" on reminders;
drop policy if exists "reminders own delete" on reminders;
create policy "reminders own select" on reminders for select using (auth.uid() = user_id);
create policy "reminders own insert" on reminders for insert with check (auth.uid() = user_id);
create policy "reminders own update" on reminders for update using (auth.uid() = user_id);
create policy "reminders own delete" on reminders for delete using (auth.uid() = user_id);
