-- BenFit V2.4 Daily Engine migration

create table if not exists daily_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_on date not null default current_date,
  water_l numeric not null default 0,
  sleep_h numeric not null default 0,
  steps integer not null default 0,
  workout_done boolean not null default false,
  protein_hit boolean not null default false,
  created_at timestamptz not null default now(),
  unique(user_id, logged_on)
);

create table if not exists workout_sets (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_on date not null default current_date,
  exercise text not null,
  set_no integer not null default 1,
  weight_kg numeric not null default 0,
  reps integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists weekly_checkins (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_of date not null,
  energy integer not null default 3,
  hunger integer not null default 3,
  adherence integer not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique(user_id, week_of)
);

alter table daily_logs enable row level security;
alter table workout_sets enable row level security;
alter table weekly_checkins enable row level security;

drop policy if exists "daily own select" on daily_logs;
drop policy if exists "daily own insert" on daily_logs;
drop policy if exists "daily own update" on daily_logs;
drop policy if exists "daily own delete" on daily_logs;

create policy "daily own select" on daily_logs for select using (auth.uid() = user_id);
create policy "daily own insert" on daily_logs for insert with check (auth.uid() = user_id);
create policy "daily own update" on daily_logs for update using (auth.uid() = user_id);
create policy "daily own delete" on daily_logs for delete using (auth.uid() = user_id);

drop policy if exists "sets own select" on workout_sets;
drop policy if exists "sets own insert" on workout_sets;
drop policy if exists "sets own update" on workout_sets;
drop policy if exists "sets own delete" on workout_sets;

create policy "sets own select" on workout_sets for select using (auth.uid() = user_id);
create policy "sets own insert" on workout_sets for insert with check (auth.uid() = user_id);
create policy "sets own update" on workout_sets for update using (auth.uid() = user_id);
create policy "sets own delete" on workout_sets for delete using (auth.uid() = user_id);

drop policy if exists "checkins own select" on weekly_checkins;
drop policy if exists "checkins own insert" on weekly_checkins;
drop policy if exists "checkins own update" on weekly_checkins;
drop policy if exists "checkins own delete" on weekly_checkins;

create policy "checkins own select" on weekly_checkins for select using (auth.uid() = user_id);
create policy "checkins own insert" on weekly_checkins for insert with check (auth.uid() = user_id);
create policy "checkins own update" on weekly_checkins for update using (auth.uid() = user_id);
create policy "checkins own delete" on weekly_checkins for delete using (auth.uid() = user_id);
