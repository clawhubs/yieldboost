function LoadingCard({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`yb-card animate-pulse rounded-[18px] px-5 py-5 ${className}`}>
      <div className="h-4 w-28 rounded-full bg-[rgba(34,221,208,0.12)]" />
      <div className="mt-4 h-8 w-56 rounded-[12px] bg-[rgba(255,255,255,0.08)]" />
      <div className="mt-3 h-4 w-full rounded-[10px] bg-[rgba(255,255,255,0.05)]" />
      <div className="mt-2 h-4 w-4/5 rounded-[10px] bg-[rgba(255,255,255,0.05)]" />
    </div>
  );
}

export default function WorkspaceLoading() {
  return (
    <section className="space-y-[10px] p-[10px]">
      <div className="yb-card animate-pulse rounded-[18px] px-5 py-5">
        <div className="flex flex-col gap-5">
          <div>
            <div className="h-4 w-24 rounded-full bg-[rgba(34,221,208,0.12)]" />
            <div className="mt-4 h-10 w-[320px] max-w-full rounded-[14px] bg-[rgba(255,255,255,0.08)]" />
            <div className="mt-3 h-4 w-[520px] max-w-full rounded-[10px] bg-[rgba(255,255,255,0.05)]" />
          </div>

          <div className="grid gap-[10px] md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="glass-inset rounded-[16px] px-4 py-4"
              >
                <div className="h-3 w-24 rounded bg-[rgba(255,255,255,0.05)]" />
                <div className="mt-3 h-8 w-28 rounded bg-[rgba(255,255,255,0.08)]" />
                <div className="mt-3 h-4 w-full rounded bg-[rgba(255,255,255,0.04)]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-[10px] xl:grid-cols-[1.2fr_0.8fr]">
        <LoadingCard />
        <LoadingCard />
      </div>

      <div className="grid gap-[10px] xl:grid-cols-3">
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
      </div>
    </section>
  );
}
