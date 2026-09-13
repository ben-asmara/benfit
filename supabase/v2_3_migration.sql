-- V2.3 progress tracking tables

create table if not exists measurements (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_on date not null default current_date,
  waist_cm numeric,
  chest_cm numeric,
  arm_cm numeric,
  thigh_cm numeric,
  created_at timestamptz not null default now()
);

create table if not exists workout_prs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_on date not null default current_date,
  exercise text not null,
  weight_kg numeric not null default 0,
  reps integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists progress_photos (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_on date not null default current_date,
  pose text not null default 'front',
  image_url text not null,
  storage_path text,
  created_at timestamptz not null default now()
);

alter table measurements enable row level security;
alter table workout_prs enable row level security;
alter table progress_photos enable row level security;

drop policy if exists "measurements own select" on measurements;
drop policy if exists "measurements own insert" on measurements;
drop policy if exists "measurements own delete" on measurements;
drop policy if exists "measurements own update" on measurements;

create policy "measurements own select" on measurements for select using (auth.uid() = user_id);
create policy "measurements own insert" on measurements for insert with check (auth.uid() = user_id);
create policy "measurements own delete" on measurements for delete using (auth.uid() = user_id);
create policy "measurements own update" on measurements for update using (auth.uid() = user_id);

drop policy if exists "prs own select" on workout_prs;
drop policy if exists "prs own insert" on workout_prs;
drop policy if exists "prs own delete" on workout_prs;
drop policy if exists "prs own update" on workout_prs;

create policy "prs own select" on workout_prs for select using (auth.uid() = user_id);
create policy "prs own insert" on workout_prs for insert with check (auth.uid() = user_id);
create policy "prs own delete" on workout_prs for delete using (auth.uid() = user_id);
create policy "prs own update" on workout_prs for update using (auth.uid() = user_id);

drop policy if exists "progress photos own select" on progress_photos;
drop policy if exists "progress photos own insert" on progress_photos;
drop policy if exists "progress photos own delete" on progress_photos;

create policy "progress photos own select" on progress_photos for select using (auth.uid() = user_id);
create policy "progress photos own insert" on progress_photos for insert with check (auth.uid() = user_id);
create policy "progress photos own delete" on progress_photos for delete using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "progress photo upload own folder" on storage.objects;
drop policy if exists "progress photo delete own folder" on storage.objects;
drop policy if exists "progress photo public read" on storage.objects;

create policy "progress photo upload own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'progress-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "progress photo delete own folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'progress-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "progress photo public read"
on storage.objects for select
using (bucket_id = 'progress-photos');
