export default function JudgeLoading() {
  return (
    <section className="space-y-[10px] p-[10px]">
      <div className="yb-card animate-pulse rounded-[18px] px-5 py-5">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center">
            <div className="h-7 w-32 rounded-full bg-[rgba(34,221,208,0.12)]" />
            <div className="mt-4 h-10 w-[320px] max-w-full rounded-[14px] bg-[rgba(255,255,255,0.08)]" />
            <div className="mt-4 h-5 w-[620px] max-w-full rounded-[12px] bg-[rgba(255,255,255,0.05)]" />
            <div className="mt-2 h-5 w-[540px] max-w-full rounded-[12px] bg-[rgba(255,255,255,0.05)]" />
          </div>
        </div>
      </div>

      <div className="yb-card animate-pulse rounded-[18px] px-5 py-5">
        <div className="h-7 w-56 rounded-[12px] bg-[rgba(255,255,255,0.08)]" />
        <div className="mt-2 h-4 w-80 rounded-[10px] bg-[rgba(255,255,255,0.05)]" />

        <div className="mt-4 grid gap-[10px] md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="glass-inset rounded-[14px] px-4 py-4"
            >
              <div className="h-3 w-24 rounded bg-[rgba(255,255,255,0.05)]" />
              <div className="mt-3 h-7 w-32 rounded bg-[rgba(255,255,255,0.08)]" />
              <div className="mt-3 h-4 w-full rounded bg-[rgba(255,255,255,0.04)]" />
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-[10px] xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="glass-inset rounded-[16px] px-4 py-4">
            <div className="h-4 w-40 rounded bg-[rgba(255,255,255,0.08)]" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-4 rounded bg-[rgba(255,255,255,0.04)]"
                />
              ))}
            </div>
          </div>

          <div className="glass-inset rounded-[16px] px-4 py-4">
            <div className="h-4 w-36 rounded bg-[rgba(255,255,255,0.08)]" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[12px] border border-[rgba(255,255,255,0.06)] px-3 py-3"
                >
                  <div className="h-3 w-24 rounded bg-[rgba(255,255,255,0.05)]" />
                  <div className="mt-3 h-4 w-full rounded bg-[rgba(255,255,255,0.04)]" />
                  <div className="mt-2 h-4 w-5/6 rounded bg-[rgba(255,255,255,0.04)]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
