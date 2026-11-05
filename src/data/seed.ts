import type { Place, Rec } from "../types";

export const VIT_GATE = { lat: 12.9692, lng: 79.1559 };

export function distanceKm(lat: number, lng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat - VIT_GATE.lat);
  const dLng = toRad(lng - VIT_GATE.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(VIT_GATE.lat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function distanceFromGateKm(lat: number, lng: number): string {
  const km = distanceKm(lat, lng);
  if (km < 0.8) return `${Math.round(km * 1000)}m from VIT Gate`;
  return `${km.toFixed(1)} km from VIT Gate`;
}

/* Coordinates are approximate. Fix any pin by editing lat/lng here. */
export const SEED: Place[] = [
  {
    id: "tara-maa",
    name: "Tara Maa",
    area: "Katpadi",
    lat: 12.9705,
    lng: 79.1385,
    price: "₹",
    tags: ["budget", "non-veg", "late-night"],
    landmark: "Near Katpadi Junction",
  },
  {
    id: "vellore-kitchen",
    name: "Vellore Kitchen",
    area: "Gandhi Road",
    lat: 12.919,
    lng: 79.133,
    price: "₹₹",
    tags: ["non-veg", "hangout", "veg"],
    landmark: "Near CMC Main Campus",
  },
  {
    id: "salt-and-pepper",
    name: "Salt and Pepper",
    area: "Officers Line",
    lat: 12.9255,
    lng: 79.1285,
    price: "₹₹",
    tags: ["hangout", "non-veg", "veg"],
    landmark: "Officers Line Main",
  },
  {
    id: "alankar-virundhu",
    name: "Alankar Virundhu",
    area: "Sathuvachari",
    lat: 12.946,
    lng: 79.148,
    price: "₹₹",
    tags: ["non-veg", "hangout"],
    landmark: "NH 48 Service Road",
  },
  {
    id: "anjappar",
    name: "Anjappar",
    area: "Katpadi Road",
    lat: 12.96,
    lng: 79.14,
    price: "₹₹",
    tags: ["non-veg", "hangout"],
    landmark: "Silk Mill Stop",
  },
  {
    id: "dindigul-thalappakatti",
    name: "Dindigul Thalappakatti",
    area: "Bagayam",
    lat: 12.9335,
    lng: 79.145,
    price: "₹₹₹",
    tags: ["non-veg", "hangout"],
    landmark: "Bagayam High Road",
  },
  {
    id: "saravana-bhavan",
    name: "Saravana Bhavan",
    area: "Gandhi Road",
    lat: 12.9175,
    lng: 79.1315,
    price: "₹",
    tags: ["veg", "budget", "hangout"],
    landmark: "Opposite Vellore Fort",
  },
  {
    id: "ambur-star-biryani",
    name: "Ambur Star Biryani",
    area: "Gandhi Nagar",
    lat: 12.941,
    lng: 79.136,
    price: "₹₹",
    tags: ["non-veg", "budget"],
    landmark: "Green Circle",
  },
  {
    id: "vit-gate-eats",
    name: "VIT Gate Eateries",
    area: "Near VIT main gate",
    lat: 12.969,
    lng: 79.155,
    price: "₹",
    tags: ["budget", "late-night", "veg", "non-veg"],
    landmark: "Right outside Gate 1 & 2",
  },
];

export const SEED_RECS: Rec[] = [
  {
    id: "seed-1",
    restaurant_id: "tara-maa",
    dish: "Chicken Bharta & Rumali Roti",
    note: "Absolute staple after adjudicator briefings. Cheap, rich gravy, hits the spot.",
    author: "Senior Core",
    tags: ["budget", "non-veg"],
    upvotes: 14,
  },
  {
    id: "seed-2",
    restaurant_id: "tara-maa",
    dish: "Egg Tadka + Crispy Chili Babycorn",
    note: "Best budget shareable combo if you are going in a big group.",
    author: "Whip Speaker",
    tags: ["budget", "veg"],
    upvotes: 6,
  },
  {
    id: "seed-3",
    restaurant_id: "vit-gate-eats",
    dish: "Peri Peri Chicken Shawarma + Cold Coffee",
    note: "Best quick bite between debate rounds when you only have 20 mins.",
    author: "Novice Cap",
    tags: ["budget", "late-night", "non-veg"],
    upvotes: 11,
  },
  {
    id: "seed-4",
    restaurant_id: "ambur-star-biryani",
    dish: "Mutton Seeraga Samba Biryani",
    note: "Go before 2 PM or the best cuts run out. Comes with brinjal curry.",
    author: "Biryani Comm",
    tags: ["non-veg"],
    upvotes: 9,
  },
  {
    id: "seed-5",
    restaurant_id: "saravana-bhavan",
    dish: "Ghee Roast Dosa & Filter Coffee",
    note: "Unbeatable morning recovery breakfast after an overnight tournament.",
    author: "Tab Director",
    tags: ["veg", "budget"],
    upvotes: 8,
  },
  {
    id: "seed-6",
    restaurant_id: "vellore-kitchen",
    dish: "Dragon Chicken & Butter Garlic Naan",
    note: "Great AC seating for big club dinners. Book a table on weekends.",
    author: "SecGen",
    tags: ["hangout", "non-veg"],
    upvotes: 7,
  },
  {
    id: "seed-7",
    restaurant_id: "anjappar",
    dish: "Chettinad Pepper Chicken & Parotta",
    note: "Fiery spice level—ask for extra salna.",
    author: "Equity Officer",
    tags: ["non-veg", "hangout"],
    upvotes: 5,
  },
  {
    id: "seed-8",
    restaurant_id: "salt-and-pepper",
    dish: "Sizzling Brownie & Crispy Chicken Burger",
    note: "Chill spot for post-APD debriefs.",
    author: "Treasurer",
    tags: ["hangout"],
    upvotes: 4,
  },
  {
    id: "seed-9",
    restaurant_id: "alankar-virundhu",
    dish: "Nattu Kozhi Biryani & Grill Chicken",
    note: "Huge portions, easily splits between two people.",
    author: "Externals Head",
    tags: ["non-veg"],
    upvotes: 5,
  },
  {
    id: "seed-10",
    restaurant_id: "dindigul-thalappakatti",
    dish: "Thalappakatti Mutton Biryani + Jigarthanda",
    note: "Pricey for student budget, save it for when your team breaks to finals.",
    author: "President",
    tags: ["non-veg", "hangout"],
    upvotes: 6,
  },
];
