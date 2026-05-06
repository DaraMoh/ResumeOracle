"use client";

import { cn } from "@/lib/utils";

type Variant = "default" | "matched" | "missing" | "tech" | "tool" | "lang";

const variantStyles: Record<Variant, string> = {
  default: "bg-gray-800 text-gray-300 border-gray-700",
  matched: "bg-emerald-900/40 text-emerald-300 border-emerald-700",
  missing: "bg-red-900/30 text-red-300 border-red-800",
  tech: "bg-brand-900/50 text-brand-300 border-brand-700",
  tool: "bg-purple-900/40 text-purple-300 border-purple-700",
  lang: "bg-cyan-900/40 text-cyan-300 border-cyan-700",
};

export default function SkillBadge({
  skill,
  variant = "default",
}: {
  skill: string;
  variant?: Variant;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
        variantStyles[variant]
      )}
    >
      {skill}
    </span>
  );
}
