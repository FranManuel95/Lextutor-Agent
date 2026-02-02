do $$ 
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'messages' and column_name = 'audio_path') then
        alter table "messages" add column "audio_path" text;
    end if;

    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'messages' and column_name = 'transcript') then
        alter table "messages" add column "transcript" text;
    end if;
end $$;
