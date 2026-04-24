export default function SkeletonDashboard() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="surface-panel shimmer min-h-[360px] rounded-[28px]" />
        <div className="surface-panel shimmer min-h-[360px] rounded-[28px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="surface-panel shimmer h-32 rounded-[24px]"
          />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="surface-panel shimmer min-h-[320px] rounded-[28px]" />
        <div className="surface-panel shimmer min-h-[320px] rounded-[28px]" />
      </div>
    </div>
  );
}
