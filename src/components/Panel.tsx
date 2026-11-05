import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Dices,
  ExternalLink,
  Flame,
  Link2,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  X,
} from "lucide-react";
import { TAGS, type Place, type PriceTier, type Rec, type TagId } from "../types";
import { distanceFromGateKm } from "../data/seed";
import { Btn, colorFor, field } from "./ui";

const spring = { type: "spring", stiffness: 400, damping: 28 } as const;
const PRICES: PriceTier[] = ["₹", "₹₹", "₹₹₹"];

export type SortMode = "hype" | "distance" | "recs";

export function TagBadge({ id, small = false }: { id: TagId; small?: boolean }) {
  const t = TAGS.find((x) => x.id === id);
  if (!t) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 border-2 border-ink font-mono font-bold uppercase ${t.color} ${
        small ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs shadow-[2px_2px_0_0_#000]"
      }`}
    >
      <span>{t.emoji}</span> {t.label}
    </span>
  );
}

export function TagPicker({
  selected,
  onChange,
}: {
  selected: TagId[];
  onChange: (next: TagId[]) => void;
}) {
  const toggle = (id: TagId) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <div className="flex flex-wrap gap-1.5">
      {TAGS.map((t) => {
        const active = selected.includes(t.id);
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => toggle(t.id)}
            className={`cursor-pointer border-2 border-ink px-2 py-1 font-mono text-xs font-bold uppercase transition-transform ${
              active
                ? `${t.color} -translate-y-0.5 shadow-[3px_3px_0_0_#000]`
                : "bg-white/80 text-black opacity-75 hover:opacity-100"
            }`}
          >
            {t.emoji} {t.label} {active ? "✓" : ""}
          </button>
        );
      })}
    </div>
  );
}

export function PlaceList({
  places,
  recs,
  counts,
  query,
  activeTags,
  sortMode,
  onSortChange,
  onQueryChange,
  onToggleTag,
  onClearFilters,
  onSelect,
  onAdd,
  onSurprise,
}: {
  places: Place[];
  recs: Rec[];
  counts: Record<string, number>;
  query: string;
  activeTags: TagId[];
  sortMode: SortMode;
  onSortChange: (m: SortMode) => void;
  onQueryChange: (q: string) => void;
  onToggleTag: (t: TagId) => void;
  onClearFilters: () => void;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onSurprise: () => void;
}) {
  const q = query.trim().toLowerCase();

  return (
    <div className="p-4">
      {/* Search + Surprise + Add Place */}
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" size={18} />
          <input
            className={field + " pr-8 pl-10"}
            placeholder="Search spot, dish (biryani, shawarma), or area..."
            aria-label="Search restaurants and dishes"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer border-2 border-ink bg-white p-0.5 hover:bg-hotpink hover:text-white"
              aria-label="Clear search"
            >
              <X size={14} strokeWidth={3} />
            </button>
          )}
        </div>
        <Btn
          className="bg-cyan px-3 text-black"
          onClick={onSurprise}
          aria-label="Pick a random spot"
          title="Can't decide? Roll a random spot!"
        >
          <Dices size={20} strokeWidth={3} />
        </Btn>
        <Btn
          className="bg-hotpink px-3 text-white"
          onClick={onAdd}
          aria-label="Add a place"
          title="Add a new restaurant"
        >
          <Plus size={20} strokeWidth={4} />
        </Btn>
      </div>

      {/* Quick Filter Chips */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {TAGS.map((t) => {
          const active = activeTags.includes(t.id);
          return (
            <motion.button
              key={t.id}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => onToggleTag(t.id)}
              className={`cursor-pointer border-2 border-ink px-2.5 py-1 font-mono text-xs font-bold uppercase transition-all ${
                active
                  ? `${t.color} -translate-x-0.5 -translate-y-0.5 shadow-[3px_3px_0_0_#000]`
                  : "bg-white text-black hover:bg-white/90"
              }`}
            >
              {t.emoji} {t.label}
            </motion.button>
          );
        })}
        {(activeTags.length > 0 || q) && (
          <button
            type="button"
            onClick={onClearFilters}
            className="cursor-pointer border-2 border-ink bg-ink px-2 py-1 font-mono text-xs font-bold text-butter uppercase"
          >
            Reset ✕
          </button>
        )}
      </div>

      {/* Sort Bar */}
      <div className="mb-4 flex items-center justify-between border-2 border-ink bg-white px-2.5 py-1.5 font-mono text-xs">
        <span className="font-bold uppercase">Sort ({places.length}):</span>
        <div className="flex gap-1">
          {(
            [
              ["hype", "🔥 Top Vouched"],
              ["distance", "📍 Nearest Gate"],
              ["recs", "📋 Most Recs"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onSortChange(id)}
              className={`cursor-pointer border-2 border-ink px-2 py-0.5 font-bold uppercase ${
                sortMode === id ? "bg-butter text-black shadow-[2px_2px_0_0_#000]" : "bg-transparent"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {places.length === 0 ? (
        <div className="border-4 border-dashed border-ink bg-white p-6 text-center">
          <p className="text-lg font-extrabold uppercase">No spots match that filter!</p>
          <p className="mt-1 font-mono text-xs">Try clearing a tag or add a new spot to the map.</p>
        </div>
      ) : (
        <ul className="grid gap-3">
          <AnimatePresence initial={false}>
            {places.map((p, i) => {
              const n = counts[p.id] ?? 0;
              const placeRecs = recs
                .filter((r) => r.restaurant_id === p.id)
                .sort((a, b) => (b.upvotes ?? 0) - (a.upvotes ?? 0));
              const totalUpvotes = placeRecs.reduce((sum, r) => sum + (r.upvotes ?? 0), 0);
              const topDish = placeRecs[0];
              const matchedDish =
                q.length > 1
                  ? placeRecs.find(
                      (r) =>
                        r.dish.toLowerCase().includes(q) ||
                        (r.note && r.note.toLowerCase().includes(q)),
                    )
                  : undefined;

              return (
                <motion.li
                  key={p.id}
                  layout
                  initial={{ opacity: 0, x: 40, rotate: 2 }}
                  animate={{ opacity: 1, x: 0, rotate: i % 2 ? 0.4 : -0.4 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ ...spring, delay: i * 0.03 }}
                  whileHover={{ x: -4, y: -4, rotate: 0, boxShadow: "8px 8px 0 0 #000" }}
                  whileTap={{ x: 2, y: 2, boxShadow: "0 0 0 0 #000" }}
                  tabIndex={0}
                  role="button"
                  onClick={() => onSelect(p.id)}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(p.id))
                  }
                  className={`cursor-pointer border-4 border-ink p-3 shadow-brutal ${colorFor(p.name)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <b className="text-lg leading-tight font-extrabold uppercase">{p.name}</b>
                        {p.price && (
                          <span className="border-2 border-ink bg-white px-1.5 py-0.2 font-mono text-xs font-bold text-black">
                            {p.price}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-xs">
                        <span>{p.area}</span>
                        <span>•</span>
                        <span className="underline decoration-dotted">
                          {distanceFromGateKm(p.lat, p.lng)}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={`border-3 border-ink px-2 py-0.5 font-mono text-xs font-bold ${
                          n ? "bg-butter text-black" : "bg-white text-black"
                        }`}
                      >
                        {n} {n === 1 ? "REC" : "RECS"}
                      </span>
                      {totalUpvotes > 0 && (
                        <span className="inline-flex items-center gap-0.5 border-2 border-ink bg-ink px-1.5 py-0.5 font-mono text-[11px] font-bold text-butter">
                          🔥 +{totalUpvotes}
                        </span>
                      )}
                    </div>
                  </div>

                  {p.tags && p.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.tags.map((t) => (
                        <TagBadge key={t} id={t} small />
                      ))}
                    </div>
                  )}

                  {matchedDish ? (
                    <div className="mt-2 border-2 border-ink bg-butter px-2 py-1 font-mono text-xs font-bold text-black">
                      🍽️ Matches dish: <span className="underline">{matchedDish.dish}</span>
                    </div>
                  ) : (
                    topDish && (
                      <div className="mt-2 flex items-center justify-between gap-2 border-2 border-ink bg-white/95 px-2 py-1 font-mono text-xs text-black">
                        <span className="truncate">
                          🏆 <b>Must order:</b> {topDish.dish}
                        </span>
                        <span className="shrink-0 font-bold">+{topDish.upvotes ?? 1}</span>
                      </div>
                    )
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

export function PlaceDetail({
  place,
  recs,
  upvotedIds,
  onBack,
  onAddRec,
  onUpvote,
}: {
  place: Place;
  recs: Rec[];
  upvotedIds: Set<string>;
  onBack: () => void;
  onAddRec: (r: { dish: string; note: string; author: string; tags: TagId[] }) => Promise<void>;
  onUpvote: (rec: Rec) => void;
}) {
  const [dish, setDish] = useState("");
  const [note, setNote] = useState("");
  const [author, setAuthor] = useState(localStorage.getItem("debsoc_name") || "");
  const [tags, setTags] = useState<TagId[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const sortedRecs = [...recs].sort((a, b) => (b.upvotes ?? 0) - (a.upvotes ?? 0));
  const topDish = sortedRecs[0];

  const shareUrl = `${window.location.origin}${window.location.pathname}?spot=${encodeURIComponent(
    place.id,
  )}`;

  const shareMessage = [
    `🍽️ *${place.name}* (${place.area}${place.price ? ` • ${place.price}` : ""})`,
    `📍 ${distanceFromGateKm(place.lat, place.lng)}`,
    topDish ? `🏆 DebSoc Top Pick: *${topDish.dish}* (+${topDish.upvotes ?? 1})` : "",
    `👉 View all recs: ${shareUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dish.trim()) return setMsg("Enter a dish name!");
    setBusy(true);
    setMsg("");
    try {
      localStorage.setItem("debsoc_name", author.trim());
      await onAddRec({
        dish: dish.trim(),
        note: note.trim(),
        author: author.trim() || "A DebSoc member",
        tags,
      });
      setDish("");
      setNote("");
      setTags([]);
    } catch (err) {
      setMsg((err as Error).message);
    }
    setBusy(false);
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Btn className="flex items-center gap-1.5 bg-white px-3 py-1.5 text-xs" onClick={onBack}>
          <ArrowLeft size={15} strokeWidth={4} /> All spots
        </Btn>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex cursor-pointer items-center gap-1 border-3 border-ink bg-butter px-2.5 py-1.5 font-mono text-xs font-extrabold text-black uppercase shadow-[3px_3px_0_0_#000] transition-transform hover:-translate-y-0.5"
            title="Copy direct link to this spot"
          >
            {copied ? <Check size={13} strokeWidth={3} /> : <Link2 size={13} strokeWidth={3} />}
            {copied ? "Copied!" : "Link"}
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 border-3 border-ink bg-lime px-2.5 py-1.5 font-mono text-xs font-extrabold text-black uppercase shadow-[3px_3px_0_0_#000] transition-transform hover:-translate-y-0.5"
            title="Share spot summary on WhatsApp"
          >
            <MessageCircle size={13} strokeWidth={3} /> WhatsApp
          </a>
          <a
            href={gmapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 border-3 border-ink bg-cyan px-2.5 py-1.5 font-mono text-xs font-extrabold text-black uppercase shadow-[3px_3px_0_0_#000] transition-transform hover:-translate-y-0.5"
            title="Open in Google Maps"
          >
            <MapPin size={13} strokeWidth={3} /> Map <ExternalLink size={12} />
          </a>
        </div>
      </div>

      <motion.div
        initial={{ scale: 0.9, rotate: -2 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={spring}
        className={`border-4 border-ink p-3 shadow-brutal ${colorFor(place.name)}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl leading-none font-extrabold uppercase">{place.name}</h2>
          {place.price && (
            <span className="border-2 border-ink bg-white px-2 py-0.5 font-mono text-sm font-extrabold text-black">
              {place.price}
            </span>
          )}
        </div>
        <p className="mt-1 font-mono text-xs font-bold">
          {place.area} {place.landmark ? `• ${place.landmark}` : ""} •{" "}
          {distanceFromGateKm(place.lat, place.lng)}
        </p>
        {place.tags && place.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {place.tags.map((t) => (
              <TagBadge key={t} id={t} />
            ))}
          </div>
        )}
      </motion.div>

      <div className="mt-5 mb-2 flex items-center justify-between">
        <h3 className="font-mono text-xs font-extrabold uppercase">
          DebSoc Consensus ({sortedRecs.length})
        </h3>
        <span className="font-mono text-[11px] font-bold">Tap +1 to vouch</span>
      </div>

      {!sortedRecs.length && (
        <p className="mb-5 border-4 border-dashed border-ink bg-white p-4 font-bold">
          No recs yet. Drop the first take below!
        </p>
      )}

      <div className="grid gap-3">
        {sortedRecs.map((r, i) => {
          const isUpvoted = upvotedIds.has(String(r.id));
          const count = r.upvotes ?? 0;
          return (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: i * 0.04 }}
              className="border-4 border-ink bg-white p-3 shadow-brutal"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="inline-block -rotate-1 border-2 border-ink bg-butter px-2 py-0.5 text-base font-extrabold text-black">
                  {i === 0 && count >= 5 ? "👑 " : ""}
                  {r.dish}
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.85 }}
                  onClick={() => onUpvote(r)}
                  aria-label={`Upvote ${r.dish}`}
                  className={`flex shrink-0 cursor-pointer items-center gap-1 border-3 border-ink px-2.5 py-1 font-mono text-xs font-extrabold shadow-[3px_3px_0_0_#000] transition-colors ${
                    isUpvoted ? "bg-hotpink text-white" : "bg-lime text-black hover:bg-butter"
                  }`}
                >
                  <Flame size={14} className={isUpvoted ? "fill-white" : "fill-black"} />
                  <span>+1</span>
                  <span className="ml-0.5 border-l-2 border-current pl-1.5">{count}</span>
                </motion.button>
              </div>

              {r.note && <p className="mt-2 text-sm font-semibold">{r.note}</p>}

              {r.tags && r.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.tags.map((t) => (
                    <TagBadge key={t} id={t} small />
                  ))}
                </div>
              )}

              <p className="mt-2 font-mono text-[11px] text-neutral-700">
                vouched by <b>{r.author || "a DebSoc member"}</b>
              </p>
            </motion.div>
          );
        })}
      </div>

      <form
        onSubmit={submit}
        className="mt-6 grid gap-3 border-4 border-ink bg-cyan p-4 shadow-brutal-lg"
      >
        <h3 className="text-xl font-extrabold uppercase">Add a food rec</h3>
        <input
          className={field}
          required
          maxLength={80}
          placeholder="Dish, e.g. Chicken 65 or Ghee Roast"
          value={dish}
          onChange={(e) => setDish(e.target.value)}
        />
        <textarea
          className={field}
          maxLength={300}
          rows={2}
          placeholder="Why it slaps, approx price, what to avoid..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div>
          <span className="mb-1 block font-mono text-xs font-bold uppercase">Dish Vibes / Tags</span>
          <TagPicker selected={tags} onChange={setTags} />
        </div>
        <input
          className={field}
          maxLength={40}
          placeholder="Your name / batch"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        {msg && (
          <p role="status" className="font-bold text-chili">
            {msg}
          </p>
        )}
        <Btn type="submit" disabled={busy} className="bg-hotpink text-white">
          {busy ? "Saving..." : "Post Rec 🔥"}
        </Btn>
      </form>
    </div>
  );
}

export function NewPlaceForm({
  hasPoint,
  onSave,
  onCancel,
}: {
  hasPoint: boolean;
  onSave: (data: {
    name: string;
    area: string;
    landmark: string;
    price: PriceTier;
    tags: TagId[];
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [price, setPrice] = useState<PriceTier>("₹₹");
  const [tags, setTags] = useState<TagId[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setMsg("Enter a restaurant name!");
    setBusy(true);
    try {
      await onSave({
        name: name.trim(),
        area: area.trim(),
        landmark: landmark.trim(),
        price,
        tags,
      });
    } catch (err) {
      setMsg((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="mb-3 inline-block -rotate-1 border-4 border-ink bg-hotpink px-3 py-1 text-3xl font-extrabold text-white uppercase shadow-brutal">
        Add a place
      </h2>
      {!hasPoint ? (
        <motion.p
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="mb-4 border-4 border-ink bg-butter p-3 font-bold"
        >
          👆 Click anywhere on the map to drop the restaurant pin.
        </motion.p>
      ) : (
        <form
          onSubmit={submit}
          className="mb-4 grid gap-3 border-4 border-ink bg-lime p-4 shadow-brutal-lg"
        >
          <input
            className={field}
            required
            maxLength={60}
            placeholder="Restaurant name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className={field}
            maxLength={60}
            placeholder="Area, e.g. Katpadi or Gandhi Nagar"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
          <input
            className={field}
            maxLength={80}
            placeholder="Landmark, e.g. Opp. Gate 2 or Near SJT"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
          />
          <div>
            <span className="mb-1 block font-mono text-xs font-bold uppercase">Price Damage</span>
            <div className="flex gap-2">
              {PRICES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrice(p)}
                  className={`flex-1 cursor-pointer border-3 border-ink py-1.5 font-mono font-extrabold ${
                    price === p ? "bg-hotpink text-white shadow-[3px_3px_0_0_#000]" : "bg-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1 block font-mono text-xs font-bold uppercase">Spot Tags</span>
            <TagPicker selected={tags} onChange={setTags} />
          </div>
          {msg && (
            <p role="status" className="font-bold text-chili">
              {msg}
            </p>
          )}
          <Btn type="submit" disabled={busy} className="bg-hotpink text-white">
            Save Place
          </Btn>
        </form>
      )}
      <Btn className="bg-white" onClick={onCancel}>
        Cancel
      </Btn>
    </div>
  );
}
