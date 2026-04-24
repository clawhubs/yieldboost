interface BrandLogoProps {
  className?: string;
  iconOnly?: boolean;
}

export default function BrandLogo({
  className = "",
  iconOnly = false,
}: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/*
        YA monogram — Anthropic "AI" style
        Pure HTML text, 100% transparent background, no PNG
        Font: Barlow Condensed Black 900
      */}
      <span
        style={{
          fontFamily: "var(--font-condensed), 'Barlow Condensed', 'Arial Narrow', sans-serif",
          fontWeight: 900,
          fontSize: "30px",
          lineHeight: 1,
          letterSpacing: "-2px",
          color: "white",
          whiteSpace: "nowrap",
          display: "block",
        }}
        aria-label="YA"
      >
        YA
      </span>

      {iconOnly ? null : (
        /*
          Wordmark — Anthropic-style condensed bold uppercase
        */
        <div className="leading-none">
          <p
            style={{
              fontFamily: "var(--font-condensed), 'Barlow Condensed', sans-serif",
              fontWeight: 800,
              fontSize: "15px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "white",
              lineHeight: 1,
            }}
          >
            YiledBoost{" "}
            <span style={{ color: "#1fd8c8" }}>AI</span>
          </p>
        </div>
      )}
    </div>
  );
}
