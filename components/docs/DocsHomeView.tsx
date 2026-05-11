import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  Boxes,
  CircleDollarSign,
  CircleHelp,
  Network,
  ShieldCheck,
  Vault,
  Wallet,
  Waypoints,
} from "lucide-react";
import DocsShell from "@/components/docs/DocsShell";
import {
  getAllDocPages,
  getDocsNavigation,
  getDocsRuntimeStatus,
  type DocNavGroup,
} from "@/lib/docs/content";

const categoryIcons = {
  "Product Fundamentals": BookOpenText,
  "Optimization Flow": Waypoints,
  "Platform & Trust": ShieldCheck,
  "Technical Reference": Boxes,
} satisfies Record<DocNavGroup["title"], typeof BookOpenText>;

export default function DocsHomeView() {
  const status = getDocsRuntimeStatus();
  const groups = getDocsNavigation();
  const pages = getAllDocPages(status);

  return (
    <DocsShell>
      <div className="space-y-[10px]">
        <section className="yb-card rounded-[18px] px-5 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="glass-accent inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#22ddd0]">
                <CircleHelp className="h-3.5 w-3.5" />
                Start Here
              </div>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-[30px] font-semibold leading-[1.08] text-white md:text-[40px]">
                What YieldBoost AI sells, protects, and proves.
              </h2>
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#9daab6]">
                This page is the fastest plain-English map of the project. YieldBoost helps users grow idle
                balances, sells security as APIs and SDK wrappers, and publicly challenges hackers through the
                vault and anti-sybil surfaces.
              </p>
            </div>

            <div className="grid gap-[10px] md:grid-cols-2 xl:w-[420px]">
              <div className="yb-soft-card rounded-[16px] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#8ea1af]">For Users</p>
                <p className="mt-2 text-[15px] font-medium text-white">1-click optimize turns idle wallets into proof-backed yield routes.</p>
              </div>
              <div className="yb-soft-card rounded-[16px] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#8ea1af]">For Builders</p>
                <p className="mt-2 text-[15px] font-medium text-white">Marketplace APIs and SDK wrappers turn the security stack into revenue products.</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-[10px] md:grid-cols-3">
            <div className="yb-soft-card rounded-[14px] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#8ea1af]">Money Story</p>
              <p className="mt-2 text-[18px] font-semibold text-white">Yield + API Revenue</p>
              <p className="mt-2 text-[14px] leading-6 text-[#9daab6]">Users chase yield. Developers buy security modules. Protocol tier unlocks the full stack.</p>
            </div>
            <div className="yb-soft-card rounded-[14px] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#8ea1af]">Trust Story</p>
              <p className="mt-2 text-[18px] font-semibold text-[#22ddd0]">9-layer proof path</p>
              <p className="mt-2 text-[14px] leading-6 text-[#9daab6]">TEE, ZK, 0G Storage, and ProofRegistry turn claims into evidence judges can inspect.</p>
            </div>
            <div className="yb-soft-card rounded-[14px] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#8ea1af]">Attack Story</p>
              <p className="mt-2 text-[18px] font-semibold text-[#61f29f]">Vault + Faucet</p>
              <p className="mt-2 text-[14px] leading-6 text-[#9daab6]">The vault challenges hackers. The faucet demonstrates anti-sybil defense in a live onboarding flow.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-[10px] md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Open Judge Mode",
              body: "Fastest proof view for jurors. See the latest wallet snapshot, tx trail, and verification status.",
              href: "/judge",
              icon: ShieldCheck,
            },
            {
              title: "Open 1-Click Optimize",
              body: "Best path to show the live user story: wallet in, better route out, proof attached.",
              href: "/agent",
              icon: Wallet,
            },
            {
              title: "Open API Marketplace",
              body: "Best path to show how YieldBoost security is sold as modular APIs and SDK wrappers.",
              href: "/dev/marketplace",
              icon: CircleDollarSign,
            },
            {
              title: "Open Vault Challenge",
              body: "Best path to show the public security challenge and why the protection model matters.",
              href: "/vault",
              icon: Vault,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="yb-card rounded-[18px] px-5 py-5 transition hover:border-[rgba(0,201,177,0.2)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[rgba(0,201,177,0.18)] bg-[rgba(0,201,177,0.08)] text-[#22ddd0]">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="mt-4 text-[18px] font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-[14px] leading-6 text-[#9daab6]">{item.body}</p>
                <div className="mt-4 inline-flex items-center gap-2 text-[13px] font-medium text-[#22ddd0]">
                  Open
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            );
          })}
        </section>

        <section className="grid gap-[10px] xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-[10px]">
            {groups.map((group) => {
              const Icon = categoryIcons[group.title as keyof typeof categoryIcons] ?? BookOpenText;

              return (
                <section key={group.title} className="yb-card rounded-[18px] px-5 py-5">
                  <div className="flex items-center gap-3">
                    <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-[20px] font-semibold text-white">{group.title}</h2>
                      <p className="mt-1 text-[13px] text-[#8ea1af]">
                        {group.items.length} pages
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="yb-soft-card rounded-[16px] px-4 py-4 transition hover:border-[rgba(0,201,177,0.2)]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-[16px] font-semibold text-white">{item.label}</h3>
                          <ArrowRight className="h-4 w-4 text-[#22ddd0]" />
                        </div>
                        <p className="mt-2 text-[14px] leading-6 text-[#9daab6]">
                          {item.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <aside className="space-y-[10px]">
            <section className="yb-card rounded-[18px] px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
                  <Network className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[18px] font-semibold text-white">Why this matters</h2>
                  <p className="mt-1 text-[13px] text-[#8ea1af]">Short version for judges and partners</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="glass-inset rounded-[14px] px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#8ea1af]">Why users care</p>
                  <p className="mt-2 text-[14px] leading-6 text-white">
                    They want more yield without blindly trusting a black-box recommendation.
                  </p>
                </div>

                <div className="glass-inset rounded-[14px] px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#8ea1af]">Why developers care</p>
                  <p className="mt-2 text-[14px] leading-6 text-white">
                    They can buy only the security layer they need instead of rebuilding anti-sybil, proof, and verification from scratch.
                  </p>
                </div>

                <div className="glass-inset rounded-[14px] px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#8ea1af]">Why hackers care</p>
                  <p className="mt-2 text-[14px] leading-6 text-white">
                    The vault turns the security claim into a live challenge, not just a marketing promise.
                  </p>
                </div>
              </div>
            </section>

            <section className="yb-card rounded-[18px] px-5 py-5">
              <h2 className="text-[18px] font-semibold text-white">Read This First</h2>
              <div className="mt-4 space-y-3">
                {pages.filter((page) => ["overview", "why-yieldboost-ai", "how-1-click-works", "proof-and-verification"].includes(page.slug)).map((page) => (
                  <Link
                    key={page.href}
                    href={page.href}
                    className="glass-inset block rounded-[14px] px-4 py-4 transition hover:border-[rgba(0,201,177,0.2)]"
                  >
                    <p className="text-[15px] font-semibold text-white">{page.label}</p>
                    <p className="mt-2 text-[13px] leading-6 text-[#9daab6]">{page.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </DocsShell>
  );
}
