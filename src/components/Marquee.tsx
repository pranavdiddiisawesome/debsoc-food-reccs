const TEXT = [
  "DEBSOC EATS", "VELLORE SURVIVAL GUIDE", "ORDER THE BIRYANI", "ADD YOUR REC",
  "NO BAD TAKES (ONLY SPICY ONES)", "2AM HUNGER IS REAL",
];

export default function Marquee() {
  const items = [...TEXT, ...TEXT].map((t, i) => (
    <span key={i} className="mx-4 flex items-center gap-8 whitespace-nowrap">
      {t} <span className="text-hotpink">✶</span>
    </span>
  ));
  return (
    <div className="overflow-hidden border-b-4 border-ink bg-ink py-1.5 font-mono text-sm text-butter">
      <div className="flex w-max animate-marquee">{items}{items}</div>
    </div>
  );
}

