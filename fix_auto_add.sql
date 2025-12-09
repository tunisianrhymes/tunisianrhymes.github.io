-- 1. Explicit Permissions (Fixes "Permisson Denied" errors silently)
grant all on table public.missing_words to postgres, anon, authenticated, service_role;
grant all on table public.words to postgres, anon, authenticated, service_role;
grant usage, select on sequence public.words_id_seq to postgres, anon, authenticated, service_role;

-- 2. Update Function to be more robust
create or replace function promote_missing_word()
returns trigger as $$
begin
  -- Logic: If attempts >= 4, promote it.
  if NEW.attempts >= 4 then
    -- Insert into words if not exists
    insert into public.words (word, syllables)
    values (NEW.word, 0)
    on conflict (word) do nothing;
    
    -- Delete from missing_words so it doesn't get processed again
    delete from public.missing_words where word = NEW.word;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

-- 3. Drop and Recreate Trigger to handle INSERT + UPDATE
drop trigger if exists on_missing_word_threshold on public.missing_words;

create trigger on_missing_word_threshold
  after insert or update on public.missing_words
  for each row
  execute procedure promote_missing_word();
