import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Radio } from "lucide-react";
import type L from "leaflet";
import type { Place, Rec, TagId } from "./types";
import { distanceKm, SEED } from "./data/seed";
import { add, getAll, getUpvotedIds, subscribeLive, toggleUpvote, useDB } from "./services/store";
import MapView from "./components/MapView";
import Marquee from "./components/Marquee";
import { NewPlaceForm, PlaceDetail, PlaceList, type SortMode } from "./components/Panel";

type View = { t: "list" } | { t: "place"; id: string } | { t: "adding" };
type SheetSnap = "peek" | "half" | "full";

function readSpotFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const qSpot = params.get("spot");
  if (qSpot) return qSpot;
  const hash = window.location.hash;
  if (hash.startsWith("#spot/")) return decodeURIComponent(hash.slice(6));
  return null;
}

export default function App() {
  const [places, setPlaces] = useState<Place[]>(SEED);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(() => getUpvotedIds());
  const [view, setView] = useState<View>(() => {
    const initialSpot = readSpotFromUrl();
    return initialSpot ? { t: "place", id: initialSpot } : { t: "list" };
  });
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<TagId[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("hype");
  const [pending, setPending] = useState<L.LatLng | null>(null);
  const [error, setError] = useState("");
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>("half");
  const [livePulse, setLivePulse] = useState(false);
  const dragStartY = useRef<number | null>(null);

  const loadData = useCallback(async (isLiveEvent = false) => {
    try {
      const [r, c] = await Promise.all([
        getAll<Rec>("recs"),
        getAll<Omit<Place, "id"> & { id: number }>("places"),
      ]);
      setRecs(r.map((x) => ({ ...x, restaurant_id: String(x.restaurant_id) })));
      setPlaces(() => {
        const seedIds = new Set(SEED.map((item) => item.id));
        const custom = c
          .map((x) => ({
            ...x,
            id: String(x.id).startsWith("c-") ? String(x.id) : "c-" + x.id,
          }))
          .filter((x) => !seedIds.has(x.id));
        return [...SEED, ...custom];
      });
      setUpvotedIds(getUpvotedIds());
      if (isLiveEvent) {
        setLivePulse(true);
        setTimeout(() => setLivePulse(false), 1200);
      }
    } catch (e) {
      setError((e as Error).message + ". Reload to try again.");
    }
  }, []);

  useEffect(() => {
    loadData(false);
    return subscribeLive(() => loadData(true));
  }, [loadData]);

  // Sync URL query param (?spot=...) and document title with selected place
  useEffect(() => {
    const url = new URL(window.location.href);
    if (view.t === "place") {
      if (url.searchParams.get("spot") !== view.id) {
        url.searchParams.set("spot", view.id);
        window.history.pushState({ spot: view.id }, "", url.toString());
      }
      const p = places.find((x) => x.id === view.id);
      document.title = p
        ? `${p.name} — DebSoc Food Map`
        : "DebSoc Food Map — Vellore Survival Guide";
    } else {
      if (url.searchParams.has("spot")) {
        url.searchParams.delete("spot");
        window.history.pushState({}, "", url.toString());
      }
      document.title = "DebSoc Food Map — Vellore Survival Guide";
    }
  }, [view, places]);

  // Listen for browser Back/Forward navigation
  useEffect(() => {
    const onPopState = () => {
      const spot = readSpotFromUrl();
      setView(spot ? { t: "place", id: spot } : { t: "list" });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Automatically collapse mobile bottom sheet to "peek" while picking a map coordinate
  useEffect(() => {
    if (view.t === "adding" && !pending) {
      setSheetSnap("peek");
    } else if (view.t === "adding" && pending) {
      setSheetSnap("full");
    } else if (view.t === "place" && sheetSnap === "peek") {
      setSheetSnap("half");
    }
  }, [view, pending]); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    recs.forEach((r) => (c[r.restaurant_id] = (c[r.restaurant_id] ?? 0) + 1));
    return c;
  }, [recs]);

  const hypeScores = useMemo(() => {
    const h: Record<string, number> = {};
    recs.forEach((r) => {
      h[r.restaurant_id] = (h[r.restaurant_id] ?? 0) + (r.upvotes ?? 1);
    });
    return h;
  }, [recs]);

  const filteredPlaces = useMemo(() => {
    const q = query.trim().toLowerCase();
    return places
      .filter((p) => {
        const pRecs = recs.filter((r) => r.restaurant_id === p.id);
        const combinedTags = new Set<TagId>([
          ...(p.tags ?? []),
          ...pRecs.flatMap((r) => r.tags ?? []),
        ]);

        if (activeTags.length > 0 && !activeTags.every((t) => combinedTags.has(t))) {
          return false;
        }

        if (!q) return true;
        const placeText = `${p.name} ${p.area} ${p.landmark ?? ""} ${(p.tags ?? []).join(" ")}`.toLowerCase();
        if (placeText.includes(q)) return true;

        return pRecs.some(
          (r) =>
            r.dish.toLowerCase().includes(q) ||
            (r.note && r.note.toLowerCase().includes(q)) ||
            (r.author && r.author.toLowerCase().includes(q)),
        );
      })
      .sort((a, b) => {
        if (sortMode === "distance") {
          return distanceKm(a.lat, a.lng) - distanceKm(b.lat, b.lng);
        }
        if (sortMode === "hype") {
          const hDiff = (hypeScores[b.id] ?? 0) - (hypeScores[a.id] ?? 0);
          if (hDiff !== 0) return hDiff;
        }
        const countDiff = (counts[b.id] ?? 0) - (counts[a.id] ?? 0);
        if (countDiff !== 0) return countDiff;
        return a.name.localeCompare(b.name);
      });
  }, [places, recs, counts, hypeScores, query, activeTags, sortMode]);

  const selected = view.t === "place" ? view.id : null;
  const place = places.find((p) => p.id === selected);
  const stopAdding = () => {
    setPending(null);
    setSheetSnap("half");
    setView({ t: "list" });
  };

  const handleToggleTag = (tag: TagId) => {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleUpvote = async (rec: Rec) => {
    const { upvotes } = await toggleUpvote(rec);
    setUpvotedIds(getUpvotedIds());
    setRecs((prev) =>
      prev.map((r) => (String(r.id) === String(rec.id) ? { ...r, upvotes } : r)),
    );
  };

  const handleSurprise = () => {
    const pool = filteredPlaces.length > 0 ? filteredPlaces : places;
    if (!pool.length) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setView({ t: "place", id: pick.id });
  };

  const cycleSnapUp = () =>
    setSheetSnap((s) => (s === "peek" ? "half" : s === "half" ? "full" : "full"));
  const cycleSnapDown = () =>
    setSheetSnap((s) => (s === "full" ? "half" : s === "half" ? "peek" : "peek"));

  const mobileHeightClass =
    sheetSnap === "peek"
      ? "max-md:h-[24dvh]"
      : sheetSnap === "half"
        ? "max-md:h-[56dvh]"
        : "max-md:h-[88dvh]";

  return (
    <div className={`flex h-dvh flex-col overflow-hidden ${view.t === "adding" ? "placing" : ""}`}>
      <Marquee />
      <div className="relative min-h-0 flex-1 md:grid md:grid-cols-[1fr_460px]">
        {/* Map Canvas: Full-screen background on mobile, left pane on desktop */}
        <div className="h-full w-full md:border-r-4 md:border-ink">
          <MapView
            places={filteredPlaces}
            counts={counts}
            selected={selected}
            placing={view.t === "adding"}
            pending={pending}
            onSelect={(id) => {
              setView({ t: "place", id });
              if (sheetSnap === "peek") setSheetSnap("half");
            }}
            onPick={setPending}
          />
        </div>

        {/* Pull-up Bottom Sheet on Mobile / Right Sidebar on Desktop */}
        <aside
          className={`flex flex-col bg-butter transition-[height] duration-300 ease-out max-md:absolute max-md:inset-x-0 max-md:bottom-0 max-md:z-20 max-md:border-t-4 max-md:border-ink max-md:shadow-[0_-6px_0_0_#000] md:min-h-0 ${mobileHeightClass}`}
        >
          {/* Mobile Pull-Up Handle & Snap Controls */}
          <div
            onPointerDown={(e) => {
              dragStartY.current = e.clientY;
            }}
            onPointerUp={(e) => {
              if (dragStartY.current === null) return;
              const dy = e.clientY - dragStartY.current;
              dragStartY.current = null;
              if (dy < -30) cycleSnapUp();
              else if (dy > 30) cycleSnapDown();
            }}
            className="flex touch-none items-center justify-between border-b-4 border-ink bg-ink px-3 py-1.5 text-butter select-none md:hidden"
          >
            <div className="flex items-center gap-1.5">
              {(["peek", "half", "full"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSheetSnap(s)}
                  className={`cursor-pointer border border-butter px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                    sheetSnap === s ? "bg-butter text-black" : "bg-transparent text-butter"
                  }`}
                >
                  {s === "peek" ? "Map" : s === "half" ? "Split" : "Full"}
                </button>
              ))}
            </div>

            <div className="h-1.5 w-12 rounded-full bg-butter/80" />

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={cycleSnapUp}
                aria-label="Expand drawer"
                className="cursor-pointer border border-butter p-0.5 hover:bg-butter hover:text-black"
              >
                <ChevronUp size={14} strokeWidth={3} />
              </button>
              <button
                type="button"
                onClick={cycleSnapDown}
                aria-label="Collapse drawer"
                className="cursor-pointer border border-butter p-0.5 hover:bg-butter hover:text-black"
              >
                <ChevronDown size={14} strokeWidth={3} />
              </button>
            </div>
          </div>

          <header className="border-b-4 border-ink bg-hotpink px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <motion.h1
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="text-3xl leading-none font-extrabold tracking-tight text-white uppercase [text-shadow:3px_3px_0_#000] md:text-4xl"
              >
                Vellore Food Recs
              </motion.h1>
              <span
                className={`inline-flex shrink-0 items-center gap-1 border-2 border-ink px-2 py-0.5 font-mono text-[10px] font-bold uppercase shadow-[2px_2px_0_0_#000] transition-transform ${
                  livePulse ? "scale-110 bg-butter text-black" : useDB ? "bg-lime text-black" : "bg-white text-black"
                }`}
                title={
                  useDB
                    ? "Connected to Supabase Live Sync"
                    : "Demo Mode: synced across tabs in this browser"
                }
              >
                <Radio size={12} className={livePulse ? "animate-ping" : ""} />
                {useDB ? "Live DB" : "Local Sync"}
              </span>
            </div>
            <p className="mt-1 font-mono text-[11px] font-bold text-white max-md:hidden">
              PICK A SPOT. SEE WHAT DEBSOC ORDERS. VOUCH WITH +1.
            </p>
          </header>

          {!useDB && sheetSnap !== "peek" && (
            <div className="border-b-4 border-ink bg-lime px-4 py-1.5 text-xs font-bold">
              DEMO MODE: recs &amp; +1s sync across tabs in this browser. Add Supabase keys to .env to share globally.
            </div>
          )}
          {error && (
            <div className="border-b-4 border-ink bg-chili px-4 py-2 text-sm font-bold text-white">
              {error}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={view.t + (selected ?? "")}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.18 }}
              >
                {view.t === "list" && (
                  <PlaceList
                    places={filteredPlaces}
                    recs={recs}
                    counts={counts}
                    query={query}
                    activeTags={activeTags}
                    sortMode={sortMode}
                    onSortChange={setSortMode}
                    onQueryChange={setQuery}
                    onToggleTag={handleToggleTag}
                    onClearFilters={() => {
                      setQuery("");
                      setActiveTags([]);
                    }}
                    onSelect={(id) => {
                      setView({ t: "place", id });
                      if (sheetSnap === "peek") setSheetSnap("half");
                    }}
                    onAdd={() => setView({ t: "adding" })}
                    onSurprise={handleSurprise}
                  />
                )}
                {view.t === "place" && place && (
                  <PlaceDetail
                    place={place}
                    recs={recs.filter((r) => r.restaurant_id === place.id)}
                    upvotedIds={upvotedIds}
                    onBack={() => setView({ t: "list" })}
                    onUpvote={handleUpvote}
                    onAddRec={async (r) => {
                      const saved = await add("recs", {
                        restaurant_id: place.id,
                        upvotes: 1,
                        ...r,
                      });
                      setRecs((x) => [
                        { ...saved, restaurant_id: place.id, upvotes: 1 } as Rec,
                        ...x,
                      ]);
                    }}
                  />
                )}
                {view.t === "adding" && (
                  <NewPlaceForm
                    hasPoint={!!pending}
                    onCancel={stopAdding}
                    onSave={async (data) => {
                      const row = await add("places", {
                        ...data,
                        lat: pending!.lat,
                        lng: pending!.lng,
                      });
                      const np = { ...row, id: "c-" + row.id } as Place;
                      setPlaces((p) => [...p, np]);
                      setPending(null);
                      setSheetSnap("half");
                      setView({ t: "place", id: np.id });
                    }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </aside>
      </div>
    </div>
  );
}
