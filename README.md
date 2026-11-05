# DebSoc Food Map

Vite + React + TypeScript + Tailwind. Run `npm run dev` locally. Deploy on Netlify/Vercel with build command `npm run build` and output dir `dist` (`vercel.json` and `public/_redirects` are pre-configured). The original single-file prototype is kept as `index.prototype.html`.

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
  tags text[] default '{}',
  upvotes int default 1,
  created_at timestamptz default now()
);
create table places (
  id bigint generated always as identity primary key,
  name text not null,
  area text,
  landmark text,
  price text default '₹₹',
  tags text[] default '{}',
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz default now()
);
alter table recs enable row level security;
alter table places enable row level security;
create policy "read recs" on recs for select to anon using (true);
create policy "add recs" on recs for insert to anon with check (true);
create policy "upvote recs" on recs for update to anon using (true) with check (true);
create policy "read places" on places for select to anon using (true);
create policy "add places" on places for insert to anon with check (true);

-- Enable live real-time sync across connected browsers
alter publication supabase_realtime add table recs, places;
```

3. Settings > API: copy the Project URL and anon public key into a `.env` file (see `.env.example`) as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Redeploy. To delete a bad entry, use Table Editor in Supabase.

Without Supabase the site runs in demo mode and saves in the visitor's own browser (with live sync across open tabs).

## Fix pin locations

Seed coordinates are approximate. Edit `lat` and `lng` in `src/data/seed.ts` (right click a spot on Google Maps to copy its coordinates).
