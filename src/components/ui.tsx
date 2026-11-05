import { motion, type HTMLMotionProps } from "framer-motion";
import clsx from "clsx";

const COLORS = ["bg-hotpink", "bg-lime", "bg-cyan", "bg-violet text-white", "bg-chili text-white", "bg-butter"];
export const colorFor = (s: string) => COLORS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];

export function Btn({ className, ...p }: HTMLMotionProps<"button">) {
  return (
    <motion.button
      whileHover={{ y: -3, x: -3, boxShadow: "7px 7px 0 0 #000" }}
      whileTap={{ y: 4, x: 4, boxShadow: "0px 0px 0 0 #000" }}
      transition={{ type: "spring", stiffness: 500, damping: 20 }}
      className={clsx(
        "cursor-pointer border-4 border-ink px-4 py-2 font-extrabold uppercase shadow-brutal disabled:opacity-60",
        className ?? "bg-lime",
      )}
      {...p}
    />
  );
}

export const field =
  "w-full border-4 border-ink bg-white px-3 py-2 font-semibold outline-none focus:bg-butter focus:shadow-brutal transition-shadow";

