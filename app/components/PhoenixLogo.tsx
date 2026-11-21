"use client";
import { useId } from "react";

export default function PhoenixLogo({ size = 40, className = "" }: { size?: number; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const wingGrad = `pf-wing-${uid}`;
  const coreGrad = `pf-core-${uid}`;
  const bgGrad = `pf-bg-${uid}`;
  const glowFilter = `pf-glow-${uid}`;

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative grid shrink-0 place-items-center rounded-xl border border-amber-400/30 shadow-[0_0_24px_-4px_rgba(249,115,22,0.55)] ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full rounded-xl"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={bgGrad} x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e1136" />
            <stop offset="52%" stopColor="#120c28" />
            <stop offset="100%" stopColor="#261022" />
          </linearGradient>
          <linearGradient id={wingGrad} x1="8" y1="14" x2="56" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="35%" stopColor="#fb923c" />
            <stop offset="70%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id={coreGrad} x1="32" y1="8" x2="32" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
          <filter id={glowFilter} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Rounded cosmic badge backdrop */}
        <rect width="64" height="64" rx="14" fill={`url(#${bgGrad})`} />
        <circle cx="32" cy="30" r="20" fill={`url(#${wingGrad})`} opacity="0.14" />

        <g filter={`url(#${glowFilter})`}>
          {/* Outer sweeping phoenix wings */}
          <path
            d="M32 37C24 33 14 27 9 16C15 18 20 20 25 25C19 23 14 24 11 28C16 29 21 31 26 35C21 35 17 37 15 41C21 40 26 40 31 43L32 37Z"
            fill={`url(#${wingGrad})`}
          />
          <path
            d="M32 37C40 33 50 27 55 16C49 18 44 20 39 25C45 23 50 24 53 28C48 29 43 31 38 35C43 35 47 37 49 41C43 40 38 40 33 43L32 37Z"
            fill={`url(#${wingGrad})`}
          />

          {/* Secondary inner wing plumes for flow depth */}
          <path
            d="M31 31C25 26 20 20 18 12C23 16 27 21 31 26V31Z"
            fill="#fde047"
            opacity="0.88"
          />
          <path
            d="M33 31C39 26 44 20 46 12C41 16 37 21 33 26V31Z"
            fill="#fde047"
            opacity="0.88"
          />

          {/* Rising phoenix head, crest & flowing tail flame */}
          <path
            d="M32 10C34.4 13.4 35.6 16.5 34.4 19.6C36.4 18.7 37.5 17.5 38.4 16.2C38.6 19.5 36.8 22.3 34.6 24.4C35.8 28.8 35.6 34.8 33.4 42.2C35.2 46.2 35.6 50.6 32 55C28.4 50.6 28.8 46.2 30.6 42.2C28.4 34.8 28.2 28.8 29.4 24.4C27.2 22.3 25.4 19.5 25.6 16.2C26.5 17.5 27.6 18.7 29.6 19.6C28.4 16.5 29.6 13.4 32 10Z"
            fill={`url(#${coreGrad})`}
          />

          {/* Radiant ember accent at heart */}
          <circle cx="32" cy="28" r="2.2" fill="#fffbeb" />
        </g>
      </svg>
    </div>
  );
}
