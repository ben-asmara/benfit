alter table profiles
  add column if not exists step_goal integer not null default 10000;

alter table profiles
  drop constraint if exists profiles_step_goal_check;

alter table profiles
  add constraint profiles_step_goal_check
  check (step_goal between 1000 and 50000);
