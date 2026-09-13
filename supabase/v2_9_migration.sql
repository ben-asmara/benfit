-- BenFit V2.9 multi-user personal goals
alter table profiles
  add column if not exists age integer,
  add column if not exists sex text not null default 'male',
  add column if not exists height_cm numeric,
  add column if not exists start_weight_kg numeric,
  add column if not exists activity_level text not null default 'moderate',
  add column if not exists goal_type text not null default 'lose';

alter table profiles drop constraint if exists profiles_goal_type_check;
alter table profiles add constraint profiles_goal_type_check check (goal_type in ('lose','maintain','gain'));

alter table profiles drop constraint if exists profiles_activity_level_check;
alter table profiles add constraint profiles_activity_level_check check (activity_level in ('sedentary','light','moderate','very_active'));
