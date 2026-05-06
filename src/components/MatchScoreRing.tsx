"use client";

import { scoreRingColor, scoreLabel, scoreColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  score: number;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

export default function MatchScoreRing({ score, size = 80, showLabel = true, className }: Props) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreRingColor(score);
  const label = scoreLabel(score);

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1e2035"
            strokeWidth={8}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold leading-none", scoreColor(score))}
            style={{ fontSize: size * 0.22 }}>
            {score}
          </span>
          <span className="text-gray-500 leading-none" style={{ fontSize: size * 0.12 }}>
            /100
          </span>
        </div>
      </div>
      {showLabel && (
        <span className={cn("text-xs font-medium", scoreColor(score))}>{label}</span>
      )}
    </div>
  );
}
