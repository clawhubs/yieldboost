"use client";

import { useId } from "react";

export default function HeroChart() {
  const chartId = useId().replace(/:/g, "");
  const fillId = `${chartId}-fill`;
  const glowId = `${chartId}-glow`;
  const beamId = `${chartId}-beam`;
  const pathId = `${chartId}-path`;
  const curve =
    "M24 132C48 125 61 114 79 107C97 100 121 105 139 96C157 87 176 71 193 70C210 69 233 75 249 67C265 59 284 46 301 47C317 48 333 57 350 52C367 47 382 31 399 32C416 33 438 44 456 40C474 36 490 20 507 21C525 22 541 30 557 26C573 22 594 10 616 11";

  return (
    <div data-testid="yield-chart" className="relative h-[176px] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-4 top-8 h-20 animate-[chartGlow_4.8s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,rgba(40,224,215,0.28),transparent_68%)] blur-2xl"
        aria-hidden="true"
      />
      <svg
        viewBox="0 0 640 176"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#28e0d7" stopOpacity="0.78" />
            <stop offset="100%" stopColor="#28e0d7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={beamId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#28e0d7" stopOpacity="0" />
            <stop offset="48%" stopColor="#9efff7" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#28e0d7" stopOpacity="0" />
          </linearGradient>
          <filter id={glowId} x="-20%" y="-40%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path id={pathId} d={curve} fill="none" />
        <rect
          className="animate-[chartScan_5.5s_linear_infinite]"
          x="-160"
          y="2"
          width="180"
          height="150"
          fill={`url(#${beamId})`}
          opacity="0.28"
        />
        <path
          d={`${curve}V157H24V132Z`}
          fill={`url(#${fillId})`}
          filter={`url(#${glowId})`}
          opacity="0.6"
          className="animate-[chartFill_3.4s_ease-in-out_infinite]"
        />
        {[36, 78, 120, 162].map((y) => (
          <line
            key={y}
            x1="24"
            y1={y}
            x2="616"
            y2={y}
            stroke="#28e0d7"
            strokeWidth="1"
            strokeDasharray="3 12"
            opacity="0.08"
          />
        ))}
        <path
          d={curve}
          fill="none"
          stroke="#28e0d7"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.08"
        />
        <path
          d={curve}
          fill="none"
          stroke="#3FF3E9"
          strokeWidth="3.5"
          strokeLinecap="round"
          filter={`url(#${glowId})`}
          className="animate-[chartDraw_2.2s_ease-out_both]"
        />
        <path
          d={curve}
          fill="none"
          stroke="#bafffb"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="18 560"
          className="animate-[chartTrace_4.5s_linear_infinite]"
        />
        <line x1="23" y1="129" x2="618" y2="129" stroke="#c6d0d9" strokeDasharray="4 6" strokeOpacity="0.24" />
        <circle cx="24" cy="132" r="5" fill="#3FF3E9" className="animate-[chartPulse_2.2s_ease-in-out_infinite]" />
        <circle cx="616" cy="11" r="6" fill="#A7FFF8" stroke="#3FF3E9" strokeWidth="3" className="animate-[chartPulse_2.2s_ease-in-out_infinite_0.4s]" />
        <circle r="4.5" fill="#ecfffd" stroke="#22ddd0" strokeWidth="2">
          <animateMotion dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1">
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </circle>
      </svg>
      <div className="absolute right-2 top-0 text-[14px] font-semibold text-white">APY</div>
      <div className="absolute left-0 top-[128px] text-[11px] text-white/90">Live wallet</div>
      <div className="absolute right-0 bottom-0 text-[11px] text-[#cfd8e0]">After Optimization</div>
      <style jsx>{`
        @keyframes chartDraw {
          from {
            stroke-dasharray: 0 900;
          }
          to {
            stroke-dasharray: 900 0;
          }
        }

        @keyframes chartTrace {
          from {
            stroke-dashoffset: 620;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes chartScan {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(820px);
          }
        }

        @keyframes chartFill {
          0%,
          100% {
            opacity: 0.44;
          }
          50% {
            opacity: 0.72;
          }
        }

        @keyframes chartGlow {
          0%,
          100% {
            opacity: 0.35;
            transform: translateY(0) scaleX(0.92);
          }
          50% {
            opacity: 0.75;
            transform: translateY(-4px) scaleX(1.06);
          }
        }

        @keyframes chartPulse {
          0%,
          100% {
            opacity: 0.72;
            transform: scale(0.95);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}
