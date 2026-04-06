"use client";

import React from "react";

interface ArcGaugeProps {
  value: number; // 0–100
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export default function ArcGauge({
  value,
  size = 120,
  strokeWidth = 9,
  label,
}: ArcGaugeProps) {
  const radius        = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const arcLength     = circumference * 0.75; // 270° arc
  const offset        = arcLength - (value / 100) * arcLength;

  /* Accent colour for the dot indicator only — keeps the arc monochromatic */
  const accentDot =
    value < 33 ? "#ef4444" : value < 66 ? "#f59e0b" : "#10b981";

  return (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{ width: size, height: size * 0.88 }}
    >
      {/* SVG arcs */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative"
        style={{ transform: "rotate(-225deg)" }}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />

        {/* Progress arc — always #0a0a0a */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#0a0a0a"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>

      {/* Centre overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="flex items-baseline gap-0.5" style={{ transform: "translateY(3px)" }}>
          <span className="text-[28px] font-extrabold text-[#0a0a0a] tracking-tight leading-none">
            {value}
          </span>
          <span className="text-sm font-bold text-gray-400 leading-none">%</span>
        </div>

        {label && (
          <div className="mt-1.5 flex items-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: accentDot }}
            />
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
              {label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
