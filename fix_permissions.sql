-- Run this in Supabase SQL Editor to fix permissions

-- 1. Drop existing policies to avoid conflicts
drop policy if exists "Anyone can insert/update missing words" on public.missing_words;
drop policy if exists "Anyone can insert words" on public.words;
drop policy if exists "Public words are viewable by everyone" on public.words;

-- 2. Create Explicit Permissive Policies
-- Allow ANYONE (including anonymous) to insert/update/select from missing_words
create policy "Enable all access for missing_words"
on public.missing_words
for all
using (true)
with check (true);

-- Allow reading words (already there usually, but ensuring it)
create policy "Enable read access for words"
on public.words
for select
using (true);

-- Allow inserting into words (for the auto-add trigger)
create policy "Enable insert access for words"
on public.words
for insert
with check (true);
