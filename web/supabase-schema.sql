-- ── GYMS ────────────────────────────────────────────────────────────────────
create table gyms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  phone text,
  subscription_status text not null default 'trial' check (subscription_status in ('active','trial','expired')),
  created_at timestamptz default now()
);

-- ── PROFILES ─────────────────────────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  name text,
  role text not null default 'member' check (role in ('super_admin','gym_admin','staff','member')),
  gym_id uuid references gyms(id) on delete set null,
  date_of_birth date,
  gender text check (gender in ('male','female','other')),
  created_at timestamptz default now()
);

-- Auto-create profile on new user signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, phone)
  values (new.id, new.phone);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── MEMBERSHIPS ──────────────────────────────────────────────────────────────
create table memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  gym_id uuid not null references gyms(id) on delete cascade,
  plan_name text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'active' check (status in ('active','expired','cancelled')),
  created_at timestamptz default now()
);

-- ── SCANS ────────────────────────────────────────────────────────────────────
create table scans (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references profiles(id) on delete cascade,
  gym_id uuid references gyms(id) on delete set null,
  scanned_by uuid references profiles(id) on delete set null,
  height_cm numeric not null,
  -- app measurements
  scan_height numeric, scan_shoulders numeric,
  scan_chest numeric, scan_waist numeric,
  scan_hips numeric, scan_bicep numeric,
  scan_thigh numeric, scan_inseam numeric,
  -- tape measurements (filled in after scan)
  tape_shoulders numeric, tape_chest numeric,
  tape_waist numeric, tape_hips numeric,
  tape_bicep numeric, tape_thigh numeric,
  tape_inseam numeric,
  -- meta
  quality text,
  front_frames int, side_frames int, diagonal_frames int,
  has_3views boolean default false,
  created_at timestamptz default now()
);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table gyms enable row level security;
alter table memberships enable row level security;
alter table scans enable row level security;

-- Profiles: users can read/update their own profile
create policy "own profile" on profiles for all using (auth.uid() = id);

-- Staff/admin can read profiles in their gym
create policy "gym staff can read members" on profiles for select
  using (
    gym_id = (select gym_id from profiles where id = auth.uid())
    and (select role from profiles where id = auth.uid()) in ('gym_admin','staff','super_admin')
  );

-- Gyms: gym_admin and super_admin can manage
create policy "gym admin manages gym" on gyms for all
  using ((select role from profiles where id = auth.uid()) in ('gym_admin','super_admin'));

create policy "staff reads own gym" on gyms for select
  using (id = (select gym_id from profiles where id = auth.uid()));

-- Memberships: gym staff can manage, members can read their own
create policy "own memberships" on memberships for select using (user_id = auth.uid());
create policy "staff manages memberships" on memberships for all
  using ((select role from profiles where id = auth.uid()) in ('gym_admin','staff','super_admin'));

-- Scans: subject can read their own, staff can read/write for their gym
create policy "own scans" on scans for select using (subject_id = auth.uid());
create policy "staff manages scans" on scans for all
  using ((select role from profiles where id = auth.uid()) in ('gym_admin','staff','super_admin'));
