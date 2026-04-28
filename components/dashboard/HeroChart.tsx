export default function HeroChart() {
  return (
    <div data-testid="yield-chart" className="relative h-[176px]">
      <svg
        viewBox="0 0 640 176"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#28e0d7" stopOpacity="0.78" />
            <stop offset="100%" stopColor="#28e0d7" stopOpacity="0" />
          </linearGradient>
          <filter id="heroGlow" x="-20%" y="-40%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M0 120 Q 160 60 320 100 T 640 80"
          fill="url(#heroFill)"
          filter="url(#heroGlow)"
          opacity="0.6"
        />
        <path
          d="M0 120 Q 160 60 320 100 T 640 80"
          fill="none"
          stroke="#28e0d7"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line x1="0" y1="120" x2="640" y2="120" stroke="#28e0d7" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
        <circle cx="24" cy="132" r="5" fill="#3FF3E9" />
        <circle cx="616" cy="11" r="6" fill="#A7FFF8" stroke="#3FF3E9" strokeWidth="3" />
      </svg>
      <div className="absolute right-2 top-0 text-[14px] font-semibold text-white">APY</div>
      <div className="absolute left-0 top-[128px] text-[11px] text-white/90">Today</div>
      <div className="absolute left-0 bottom-0 text-[11px] text-[#cfd8e0]">Today</div>
      <div className="absolute right-0 bottom-0 text-[11px] text-[#cfd8e0]">After Optimization</div>
    </div>
  );
}
