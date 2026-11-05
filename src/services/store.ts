import { SEED_RECS } from "../data/seed";
import type { Rec } from "../types";

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const useDB = !!(URL && KEY);
type Table = "recs" | "places";
const lsKey = (t: Table) => (t === "recs" ? "debsoc_recs_v1" : "debsoc_places_v1");
const UPVOTED_KEY = "debsoc_upvoted_v1";
const SEED_UPVOTES_KEY = "debsoc_seed_upvotes_v1";

const headers = {
  apikey: KEY ?? "",
  Authorization: "Bearer " + (KEY ?? ""),
  "Content-Type": "application/json",
};

const channel =
  typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("debsoc_live_sync") : null;

function notifyPeers() {
  channel?.postMessage({ ts: Date.now() });
}

export function getUpvotedIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(UPVOTED_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function getSeedUpvoteOverrides(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(SEED_UPVOTES_KEY) || "{}");
  } catch {
    return {};
  }
}

export async function getAll<T>(table: Table): Promise<T[]> {
  if (useDB) {
    const r = await fetch(`${URL}/rest/v1/${table}?select=*&order=created_at.desc`, { headers });
    if (!r.ok) throw new Error("Could not load " + table);
    const data: T[] = await r.json();
    if (table === "recs") {
      const existingIds = new Set((data as unknown as Rec[]).map((x) => String(x.id)));
      const overrides = getSeedUpvoteOverrides();
      const mergedSeeds = SEED_RECS.filter((s) => !existingIds.has(String(s.id))).map((s) => ({
        ...s,
        upvotes: overrides[String(s.id)] ?? s.upvotes ?? 1,
      }));
      return [...(data as unknown as Rec[]), ...mergedSeeds] as unknown as T[];
    }
    return data;
  }
  const stored: T[] = JSON.parse(localStorage.getItem(lsKey(table)) || "[]");
  if (table === "recs") {
    const overrides = getSeedUpvoteOverrides();
    const existingIds = new Set((stored as unknown as Rec[]).map((r) => String(r.id)));
    const mergedSeeds = SEED_RECS.filter((s) => !existingIds.has(String(s.id))).map((s) => ({
      ...s,
      upvotes: overrides[String(s.id)] ?? s.upvotes ?? 1,
    }));
    return [...(stored as unknown as Rec[]), ...mergedSeeds] as unknown as T[];
  }
  return stored;
}

export async function add<T extends object>(
  table: Table,
  row: T,
): Promise<T & { id: string | number }> {
  if (useDB) {
    const r = await fetch(`${URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify(row),
    });
    if (!r.ok) throw new Error("Could not save. Try again.");
    const saved = (await r.json())[0];
    notifyPeers();
    return saved;
  }
  const all = JSON.parse(localStorage.getItem(lsKey(table)) || "[]");
  const saved = { ...row, id: Date.now(), created_at: new Date().toISOString() };
  all.unshift(saved);
  localStorage.setItem(lsKey(table), JSON.stringify(all));
  notifyPeers();
  return saved;
}

export async function toggleUpvote(rec: Rec): Promise<{ upvotes: number; active: boolean }> {
  const idStr = String(rec.id);
  const upvoted = getUpvotedIds();
  const already = upvoted.has(idStr);
  const nextCount = Math.max(0, (rec.upvotes ?? 0) + (already ? -1 : 1));

  if (already) upvoted.delete(idStr);
  else upvoted.add(idStr);
  localStorage.setItem(UPVOTED_KEY, JSON.stringify([...upvoted]));

  if (idStr.startsWith("seed-")) {
    const overrides = getSeedUpvoteOverrides();
    overrides[idStr] = nextCount;
    localStorage.setItem(SEED_UPVOTES_KEY, JSON.stringify(overrides));
  } else if (useDB) {
    await fetch(`${URL}/rest/v1/recs?id=eq.${encodeURIComponent(idStr)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ upvotes: nextCount }),
    });
  } else {
    const all: Rec[] = JSON.parse(localStorage.getItem(lsKey("recs")) || "[]");
    const updated = all.map((r) => (String(r.id) === idStr ? { ...r, upvotes: nextCount } : r));
    localStorage.setItem(lsKey("recs"), JSON.stringify(updated));
  }

  notifyPeers();
  return { upvotes: nextCount, active: !already };
}

/**
 * Subscribes to live updates across browser tabs (BroadcastChannel + storage)
 * and Supabase Realtime WebSocket + focus/visibility sync when Supabase is connected.
 */
export function subscribeLive(onUpdate: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (!e.key || e.key.startsWith("debsoc_")) onUpdate();
  };
  const onBroadcast = () => onUpdate();
  const onFocus = () => {
    if (document.visibilityState === "visible") onUpdate();
  };

  window.addEventListener("storage", onStorage);
  document.addEventListener("visibilitychange", onFocus);
  channel?.addEventListener("message", onBroadcast);

  let ws: WebSocket | null = null;
  let hb: ReturnType<typeof setInterval> | null = null;
  let poll: ReturnType<typeof setInterval> | null = null;

  if (useDB && URL && KEY) {
    try {
      const wsUrl =
        URL.replace(/^http/, "ws").replace(/\/$/, "") +
        `/realtime/v1/websocket?apikey=${encodeURIComponent(KEY)}&vsn=1.0.0`;
      ws = new WebSocket(wsUrl);
      ws.addEventListener("open", () => {
        ws?.send(
          JSON.stringify({
            topic: "realtime:public",
            event: "phx_join",
            payload: {
              config: {
                postgres_changes: [{ event: "*", schema: "public" }],
              },
            },
            ref: "1",
          }),
        );
        hb = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: "hb" }),
            );
          }
        }, 25000);
      });
      ws.addEventListener("message", (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.event === "postgres_changes" || msg.event === "INSERT" || msg.event === "UPDATE") {
            onUpdate();
          }
        } catch {
          // ignore malformed frames
        }
      });
    } catch {
      // fallback to polling below
    }
    poll = setInterval(() => {
      if (document.visibilityState === "visible") onUpdate();
    }, 15000);
  }

  return () => {
    window.removeEventListener("storage", onStorage);
    document.removeEventListener("visibilitychange", onFocus);
    channel?.removeEventListener("message", onBroadcast);
    if (hb) clearInterval(hb);
    if (poll) clearInterval(poll);
    ws?.close();
  };
}
