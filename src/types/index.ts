export type TagId = "late-night" | "budget" | "veg" | "non-veg" | "hangout";

export type PriceTier = "₹" | "₹₹" | "₹₹₹";

export interface TagMeta {
  id: TagId;
  label: string;
  emoji: string;
  color: string;
}

export const TAGS: TagMeta[] = [
  { id: "late-night", label: "Late Night", emoji: "🌙", color: "bg-violet text-white" },
  { id: "budget", label: "Broke < ₹150", emoji: "💸", color: "bg-lime text-black" },
  { id: "veg", label: "Veg Friendly", emoji: "🥦", color: "bg-cyan text-black" },
  { id: "non-veg", label: "Meat / Biryani", emoji: "🍗", color: "bg-chili text-white" },
  { id: "hangout", label: "AC / Hangout", emoji: "❄️", color: "bg-butter text-black" },
];

export interface Place {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
  price?: PriceTier;
  tags?: TagId[];
  landmark?: string;
}

export interface Rec {
  id: string | number;
  restaurant_id: string;
  dish: string;
  note?: string;
  author?: string;
  tags?: TagId[];
  upvotes?: number;
  created_at?: string;
}
