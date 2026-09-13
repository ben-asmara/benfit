-- BenFit V3.1 Personalized Calendar + Push Notifications

create extension if not exists pgcrypto;

create table if not exists calendar_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  feed_token uuid not null default gen_random_uuid() unique,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists calendar_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'custom',
  event_date date not null default current_date,
  start_time time not null default '08:00',
  end_time time not null default '09:00',
  repeat_rule text not null default 'none' check (repeat_rule in ('none','daily','weekly')),
  reminder_minutes integer not null default 30,
  notes text not null default '',
  color text not null default 'green',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists push_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists notification_deliveries (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id bigint not null references calendar_events(id) on delete cascade,
  occurrence_key text not null,
  created_at timestamptz not null default now(),
  unique(event_id, occurrence_key)
);

alter table calendar_settings enable row level security;
alter table calendar_events enable row level security;
alter table push_subscriptions enable row level security;
alter table notification_deliveries enable row level security;

drop policy if exists "calendar settings own select" on calendar_settings;
drop policy if exists "calendar settings own insert" on calendar_settings;
drop policy if exists "calendar settings own update" on calendar_settings;
create policy "calendar settings own select" on calendar_settings for select using (auth.uid()=user_id);
create policy "calendar settings own insert" on calendar_settings for insert with check (auth.uid()=user_id);
create policy "calendar settings own update" on calendar_settings for update using (auth.uid()=user_id);

drop policy if exists "calendar events own select" on calendar_events;
drop policy if exists "calendar events own insert" on calendar_events;
drop policy if exists "calendar events own update" on calendar_events;
drop policy if exists "calendar events own delete" on calendar_events;
create policy "calendar events own select" on calendar_events for select using (auth.uid()=user_id);
create policy "calendar events own insert" on calendar_events for insert with check (auth.uid()=user_id);
create policy "calendar events own update" on calendar_events for update using (auth.uid()=user_id);
create policy "calendar events own delete" on calendar_events for delete using (auth.uid()=user_id);

drop policy if exists "push own select" on push_subscriptions;
drop policy if exists "push own insert" on push_subscriptions;
drop policy if exists "push own update" on push_subscriptions;
drop policy if exists "push own delete" on push_subscriptions;
create policy "push own select" on push_subscriptions for select using (auth.uid()=user_id);
create policy "push own insert" on push_subscriptions for insert with check (auth.uid()=user_id);
create policy "push own update" on push_subscriptions for update using (auth.uid()=user_id);
create policy "push own delete" on push_subscriptions for delete using (auth.uid()=user_id);

-- Notification delivery rows are server-managed only.
drop policy if exists "delivery own select" on notification_deliveries;
create policy "delivery own select" on notification_deliveries for select using (auth.uid()=user_id);

create or replace function public.handle_new_calendar_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.calendar_settings(user_id, timezone)
  values(new.id, 'UTC')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_calendar_settings on auth.users;
create trigger on_auth_user_calendar_settings
after insert on auth.users
for each row execute procedure public.handle_new_calendar_settings();

insert into calendar_settings(user_id, timezone)
select id, 'UTC' from auth.users
on conflict (user_id) do nothing;
