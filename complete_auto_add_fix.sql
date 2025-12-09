-- 1. FORCE Enable RLS (Just in case)
alter table public.missing_words enable row level security;
alter table public.words enable row level security;

-- 2. DROP EXISTING POLICIES (Clear the slate)
drop policy if exists "Enable all access for missing_words" on public.missing_words;
drop policy if exists "Anyone can insert/update missing words" on public.missing_words;
drop policy if exists "Enable insert access for words" on public.words;

-- 3. CREATE PERMISSIVE POLICIES (Essential for RLS)
create policy "Allow Anon Insert/Update Missing"
  on public.missing_words
  for all
  using (true)
  with check (true);

create policy "Allow Anon Insert Words"
  on public.words
  for insert
  with check (true);

-- 4. GRANT PERMISSIONS (Essential for Table Access)
grant all on table public.missing_words to postgres, anon, authenticated, service_role;
grant all on table public.words to postgres, anon, authenticated, service_role;
grant usage, select on sequence public.words_id_seq to postgres, anon, authenticated, service_role;

-- 5. REFRESH TRIGGER
create or replace function promote_missing_word()
returns trigger as $$
begin
  if NEW.attempts >= 4 then
    insert into public.words (word, syllables)
    values (NEW.word, 0)
    on conflict (word) do nothing;
    delete from public.missing_words where word = NEW.word;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_missing_word_threshold on public.missing_words;

create trigger on_missing_word_threshold
  after insert or update on public.missing_words
  for each row
  execute procedure promote_missing_word();
