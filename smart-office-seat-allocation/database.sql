-- SeatWise DBMS Mini Project - PostgreSQL / Supabase
-- Run the complete script in Supabase > SQL Editor > New query.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  full_name varchar(100) not null,
  email varchar(150) not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.zones (
  id text primary key,
  name varchar(80) not null unique,
  description varchar(200),
  color varchar(20),
  icon varchar(10)
);

create table if not exists public.seats (
  id text primary key,
  seat_number varchar(20) not null unique,
  zone_id text not null references public.zones(id) on update cascade,
  seat_type varchar(30) not null check (seat_type in ('Standard','Window','Quiet','Standing')),
  is_active boolean not null default true
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  seat_id text not null references public.seats(id),
  user_id uuid not null references public.users(id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  purpose varchar(100) not null default 'Focused work',
  status varchar(20) not null default 'confirmed' check (status in ('confirmed','cancelled')),
  created_at timestamptz not null default now(),
  constraint valid_booking_time check (end_time > start_time)
);

create index if not exists idx_seats_zone on public.seats(zone_id);
create index if not exists idx_bookings_seat_time on public.bookings(seat_id,start_time,end_time);
create index if not exists idx_bookings_user on public.bookings(user_id);

insert into public.zones(id,name,description,color,icon) values
('z1','Open Workspace','Open desks for everyday productivity','#eeecff','▦'),
('z2','Quiet Zone','A calm space for focused work','#e7f7f1','◉'),
('z3','Collaboration Hub','Flexible seating for team sessions','#fff1e5','⌘')
on conflict (id) do nothing;

insert into public.seats(id,seat_number,zone_id,seat_type) values
('s1','A-01','z1','Standard'),('s2','A-02','z1','Window'),('s3','A-03','z1','Standard'),('s4','A-04','z1','Standard'),('s5','A-05','z1','Standard'),
('s6','Q-01','z2','Window'),('s7','Q-02','z2','Quiet'),('s8','Q-03','z2','Quiet'),('s9','Q-04','z2','Quiet'),
('s10','C-01','z3','Standing'),('s11','C-02','z3','Standard'),('s12','C-03','z3','Standard')
on conflict (id) do nothing;

-- A transaction-safe function: locks the seat row and checks overlapping reservations.
create or replace function public.book_seat(
  p_seat_id text,
  p_user_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_purpose text default 'Focused work'
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  seat_record public.seats%rowtype;
  new_booking_id uuid;
begin
  if p_end_time <= p_start_time then
    raise exception 'End time must be after start time.';
  end if;

  select * into seat_record from public.seats
  where id = p_seat_id and is_active = true
  for update;

  if not found then raise exception 'Seat not found or inactive.'; end if;

  if exists (
    select 1 from public.bookings
    where seat_id = p_seat_id
      and status = 'confirmed'
      and start_time < p_end_time
      and end_time > p_start_time
  ) then
    raise exception 'This seat has already been booked for that time.';
  end if;

  insert into public.bookings(seat_id,user_id,start_time,end_time,purpose)
  values(p_seat_id,p_user_id,p_start_time,p_end_time,coalesce(p_purpose,'Focused work'))
  returning id into new_booking_id;

  return json_build_object('booking_id',new_booking_id,'status','confirmed');
end;
$$;

-- View for a readable booking report (JOIN across related tables).
create or replace view public.booking_report as
select b.id as booking_id, u.full_name, u.email, s.seat_number,
       z.name as zone_name, s.seat_type, b.start_time, b.end_time,
       b.purpose, b.status
from public.bookings b
join public.users u on u.id=b.user_id
join public.seats s on s.id=b.seat_id
join public.zones z on z.id=s.zone_id;

-- Demo-project access policies. These allow the public anon key to read/write.
-- Use proper Supabase Auth + restrictive RLS policies before any real deployment.
alter table public.users enable row level security;
alter table public.zones enable row level security;
alter table public.seats enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "demo users access" on public.users;
create policy "demo users access" on public.users for all to anon, authenticated using (true) with check (true);
drop policy if exists "demo zones read" on public.zones;
create policy "demo zones read" on public.zones for select to anon, authenticated using (true);
drop policy if exists "demo seats read" on public.seats;
create policy "demo seats read" on public.seats for select to anon, authenticated using (true);
drop policy if exists "demo bookings access" on public.bookings;
create policy "demo bookings access" on public.bookings for all to anon, authenticated using (true) with check (true);
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.users to anon, authenticated;
grant select on public.zones, public.seats to anon, authenticated;
grant select, insert, update on public.bookings to anon, authenticated;
grant execute on function public.book_seat(text,uuid,timestamptz,timestamptz,text) to anon, authenticated;
