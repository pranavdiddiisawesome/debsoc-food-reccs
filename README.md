# DebSoc Food Map

Static site. Deploy the folder on Netlify (drag and drop) or Vercel. No build step.

## Make recs shared across members (Supabase, free)

1. Create a project at supabase.com.
2. Open SQL Editor and run:

```sql
create table recs (
  id bigint generated always as identity primary key,
  restaurant_id text not null,
  dish text not null,
  note text,
  author text,
  created_at timestamptz default now()
);
create table places (
  id bigint generated always as identity primary key,
  name text not null,
  area text,
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz default now()
);
alter table recs enable row level security;
alter table places enable row level security;
create policy "read recs" on recs for select to anon using (true);
create policy "add recs" on recs for insert to anon with check (true);
create policy "read places" on places for select to anon using (true);
create policy "add places" on places for insert to anon with check (true);
```

3. Settings > API: copy the Project URL and the anon public key into `CONFIG` at the top of the script in `index.html`.
4. Redeploy. To delete a bad entry, use Table Editor in Supabase.

Without Supabase the site runs in demo mode and saves only in the visitor's own browser.

## Fix pin locations

Seed coordinates are approximate. Edit `lat` and `lng` in the `SEED` array (right click a spot on Google Maps to copy its coordinates).
