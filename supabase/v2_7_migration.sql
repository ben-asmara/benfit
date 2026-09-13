-- BenFit V2.7 Personalized Profile migration

alter table profiles
  add column if not exists username text,
  add column if not exists display_name text,
  add column if not exists avatar text not null default 'bolt',
  add column if not exists bio text not null default '';

create unique index if not exists profiles_username_unique
on profiles (lower(username))
where username is not null and username <> '';
