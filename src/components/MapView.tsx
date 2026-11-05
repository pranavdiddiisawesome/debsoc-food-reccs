import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Place } from "../types";

interface Props {
  places: Place[];
  counts: Record<string, number>;
  selected: string | null;
  placing: boolean;
  pending: L.LatLng | null;
  onSelect: (id: string) => void;
  onPick: (ll: L.LatLng) => void;
}

const pinHtml = (n: number, sel: boolean) => {
  const bg = sel ? "#ff007f" : n ? "#ffe600" : "#00f0ff";
  const color = sel ? "#fff" : "#000";
  return `<div style="width:40px;height:40px;background:${bg};color:${color};border:4px solid #000;box-shadow:4px 4px 0 #000;display:grid;place-items:center;font:800 16px 'Bricolage Grotesque';transform:rotate(${sel ? 0 : -6}deg) scale(${sel ? 1.25 : 1});transition:transform .25s cubic-bezier(.3,1.8,.5,1)">${n}</div>`;
};

export default function MapView({ places, counts, selected, placing, pending, onSelect, onPick }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<Record<string, L.Marker>>({});
  const pendingMarker = useRef<L.Marker | null>(null);
  const cb = useRef({ onSelect, onPick, placing });
  cb.current = { onSelect, onPick, placing };

  useEffect(() => {
    const m = L.map(el.current!).setView([12.945, 79.138], 13);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    }).addTo(m);
    m.on("click", (e) => cb.current.placing && cb.current.onPick(e.latlng));
    map.current = m;
    return () => {
      m.remove();
      markers.current = {};
    };
  }, []);

  useEffect(() => {
    const m = map.current!;
    const activeIds = new Set(places.map((p) => p.id));

    for (const [id, mk] of Object.entries(markers.current)) {
      if (!activeIds.has(id)) {
        mk.remove();
        delete markers.current[id];
      }
    }

    places.forEach((p) => {
      const icon = L.divIcon({
        className: "brutal-pin",
        html: pinHtml(counts[p.id] ?? 0, selected === p.id),
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
      const ex = markers.current[p.id];
      if (ex) ex.setIcon(icon);
      else {
        const mk = L.marker([p.lat, p.lng], { icon, title: p.name }).addTo(m);
        mk.on("click", () => cb.current.onSelect(p.id));
        markers.current[p.id] = mk;
      }
    });
  }, [places, counts, selected]);

  useEffect(() => {
    const p = places.find((x) => x.id === selected);
    if (p) map.current!.flyTo([p.lat, p.lng], Math.max(map.current!.getZoom(), 15), { duration: 0.7 });
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    pendingMarker.current?.remove();
    pendingMarker.current = pending ? L.marker(pending).addTo(map.current!) : null;
  }, [pending]);

  return <div ref={el} className="h-full w-full" aria-label="Map of Vellore restaurants" />;
}
