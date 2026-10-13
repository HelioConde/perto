-- Applied in Supabase migration history as 20261013091812_perto_profile_content_quality.
-- Production contains zero professional profiles at the time of this change.
alter table public.perto_professionals
  add constraint perto_profile_name_quality
    check (char_length(btrim(display_name, E' \t\n\r')) between 2 and 120),
  add constraint perto_profile_city_quality
    check (char_length(btrim(city, E' \t\n\r')) between 2 and 100),
  add constraint perto_profile_description_quality
    check (char_length(btrim(description, E' \t\n\r')) between 15 and 1200),
  add constraint perto_profile_category_quality
    check (char_length(btrim(category, E' \t\n\r')) between 2 and 100),
  add constraint perto_profile_brazilian_state
    check (state in (
      'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
      'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
    ));
