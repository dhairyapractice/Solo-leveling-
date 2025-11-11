-- Enable RLS and add policies for application tables
-- Adjust table names if your schema uses a different casing or schema

-- Profiles
alter table profiles enable row level security;
drop policy if exists "Profiles are viewable by owner" on profiles;
drop policy if exists "Profiles are insertable by owner" on profiles;
drop policy if exists "Profiles are updatable by owner" on profiles;

create policy "Profiles are viewable by owner"
  on profiles for select
  using (user_id = auth.uid());

create policy "Profiles are insertable by owner"
  on profiles for insert
  with check (user_id = auth.uid());

create policy "Profiles are updatable by owner"
  on profiles for update
  using (user_id = auth.uid());

-- Quests
alter table quests enable row level security;
drop policy if exists "Quests are viewable by owner" on quests;
drop policy if exists "Quests are modifiable by owner" on quests;
drop policy if exists "Quests are insertable by owner" on quests;

create policy "Quests are viewable by owner"
  on quests for select
  using (user_id = auth.uid());

create policy "Quests are insertable by owner"
  on quests for insert
  with check (user_id = auth.uid());

create policy "Quests are modifiable by owner"
  on quests for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Status Categories
alter table status_categories enable row level security;
drop policy if exists "Categories are viewable by owner" on status_categories;
drop policy if exists "Categories are modifiable by owner" on status_categories;
drop policy if exists "Categories are insertable by owner" on status_categories;

create policy "Categories are viewable by owner"
  on status_categories for select
  using (user_id = auth.uid());

create policy "Categories are insertable by owner"
  on status_categories for insert
  with check (user_id = auth.uid());

create policy "Categories are modifiable by owner"
  on status_categories for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Goals
alter table goals enable row level security;
drop policy if exists "Goals are viewable by owner" on goals;
drop policy if exists "Goals are modifiable by owner" on goals;
drop policy if exists "Goals are insertable by owner" on goals;

create policy "Goals are viewable by owner"
  on goals for select
  using (user_id = auth.uid());

create policy "Goals are insertable by owner"
  on goals for insert
  with check (user_id = auth.uid());

create policy "Goals are modifiable by owner"
  on goals for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Boss Battles
alter table boss_battles enable row level security;
drop policy if exists "Battles are viewable by owner" on boss_battles;
drop policy if exists "Battles are modifiable by owner" on boss_battles;
drop policy if exists "Battles are insertable by owner" on boss_battles;

create policy "Battles are viewable by owner"
  on boss_battles for select
  using (user_id = auth.uid());

create policy "Battles are insertable by owner"
  on boss_battles for insert
  with check (user_id = auth.uid());

create policy "Battles are modifiable by owner"
  on boss_battles for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Shop Items
alter table shop_items enable row level security;
drop policy if exists "Shop items are viewable by owner" on shop_items;
drop policy if exists "Shop items are modifiable by owner" on shop_items;
drop policy if exists "Shop items are insertable by owner" on shop_items;

create policy "Shop items are viewable by owner"
  on shop_items for select
  using (user_id = auth.uid());

create policy "Shop items are insertable by owner"
  on shop_items for insert
  with check (user_id = auth.uid());

create policy "Shop items are modifiable by owner"
  on shop_items for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Badges
alter table badges enable row level security;
drop policy if exists "Badges are viewable by owner" on badges;
drop policy if exists "Badges are modifiable by owner" on badges;
drop policy if exists "Badges are insertable by owner" on badges;

create policy "Badges are viewable by owner"
  on badges for select
  using (user_id = auth.uid());

create policy "Badges are insertable by owner"
  on badges for insert
  with check (user_id = auth.uid());

create policy "Badges are modifiable by owner"
  on badges for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- User Badges (earned)
alter table user_badges enable row level security;
drop policy if exists "User badges are viewable by owner" on user_badges;
drop policy if exists "User badges are modifiable by owner" on user_badges;
drop policy if exists "User badges are insertable by owner" on user_badges;

create policy "User badges are viewable by owner"
  on user_badges for select
  using (user_id = auth.uid());

create policy "User badges are insertable by owner"
  on user_badges for insert
  with check (user_id = auth.uid());

create policy "User badges are modifiable by owner"
  on user_badges for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Storage: create bucket and policies for images
insert into storage.buckets (id, name, public)
values ('hunter-assets', 'hunter-assets', true)
on conflict (id) do nothing;

-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Allow public read from hunter-assets
drop policy if exists "Public read for hunter-assets" on storage.objects;
create policy "Public read for hunter-assets"
  on storage.objects for select
  using (bucket_id = 'hunter-assets');

-- Allow authenticated users to upload/manage their own files in hunter-assets
drop policy if exists "Users can upload to hunter-assets" on storage.objects;
drop policy if exists "Users can update own files in hunter-assets" on storage.objects;

create policy "Users can upload to hunter-assets"
  on storage.objects for insert
  with check (
    bucket_id = 'hunter-assets' and auth.role() = 'authenticated'
  );

create policy "Users can update own files in hunter-assets"
  on storage.objects for update
  using (
    bucket_id = 'hunter-assets' and auth.role() = 'authenticated'
  )
  with check (
    bucket_id = 'hunter-assets' and auth.role() = 'authenticated'
  );

-- Optional: allow owners to delete their files
drop policy if exists "Users can delete own files in hunter-assets" on storage.objects;
create policy "Users can delete own files in hunter-assets"
  on storage.objects for delete
  using (bucket_id = 'hunter-assets' and auth.role() = 'authenticated');


