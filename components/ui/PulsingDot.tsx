interface PulsingDotProps {
  color?: string;
  size?: number;
}

export default function PulsingDot({
  color = "#61f29f",
  size = 8,
}: PulsingDotProps) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      <span
        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70"
        style={{ backgroundColor: color }}
      />
      <span
        className="relative inline-flex rounded-full"
        style={{ width: size, height: size, backgroundColor: color }}
      />
    </span>
  );
}
