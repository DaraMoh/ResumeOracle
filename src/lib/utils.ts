import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSalary(
  min: number | null,
  max: number | null,
  currency = "USD",
  period = "yearly"
): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);

  const suffix = period === "yearly" ? "/yr" : period === "monthly" ? "/mo" : "/hr";

  if (min && max) return `${fmt(min)} – ${fmt(max)}${suffix}`;
  if (min) return `${fmt(min)}+${suffix}`;
  if (max) return `Up to ${fmt(max)}${suffix}`;
  return "Salary not listed";
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

export function scoreRingColor(score: number): string {
  if (score >= 80) return "#34d399";
  if (score >= 60) return "#facc15";
  if (score >= 40) return "#fb923c";
  return "#f87171";
}

export function scoreLabel(score: number): string {
  if (score >= 85) return "Excellent Match";
  if (score >= 70) return "Good Match";
  if (score >= 55) return "Decent Match";
  if (score >= 40) return "Partial Match";
  return "Weak Match";
}
