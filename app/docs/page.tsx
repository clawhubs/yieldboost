import Link from "next/link";
import { ArrowRight, BookOpenText, Boxes, CircleHelp, Network, ShieldCheck, Waypoints } from "lucide-react";
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

export default function DocsHomePage() {
  const status = getDocsRuntimeStatus();
  const groups = getDocsNavigation();
  const pages = getAllDocPages(status);

  return (
    <div className="space-y-[10px]">
      <section className="yb-card rounded-[18px] px-5 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="glass-accent inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#22ddd0]">
              <CircleHelp className="h-3.5 w-3.5" />
              Start Here
            </div>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-[30px] font-semibold leading-[1.08] text-white md:text-[40px]">
              Docs that explain the product the same way the app behaves.
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#9daab6]">
              Use this hub to onboard users, brief judges, inspect the 0G proof
              flow, or understand how the Next.js app is wired behind the scenes.
            </p>
          </div>

          <div className="grid gap-[10px] md:grid-cols-2 xl:w-[420px]">
            <div className="yb-soft-card rounded-[16px] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8ea1af]">LLM Mode</p>
              <p className="mt-2 text-[15px] font-medium text-white">{status.llmMode}</p>
            </div>
            <div className="yb-soft-card rounded-[16px] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8ea1af]">Proof Mode</p>
              <p className="mt-2 text-[15px] font-medium text-white">{status.proofMode}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-[10px] md:grid-cols-3">
          <div className="yb-soft-card rounded-[14px] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#8ea1af]">Demo Wallet</p>
            <p className="mt-2 text-[18px] font-semibold text-white break-all">{status.demoWallet}</p>
          </div>
          <div className="yb-soft-card rounded-[14px] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#8ea1af]">Compute Mode</p>
            <p className="mt-2 text-[18px] font-semibold text-[#22ddd0]">{status.computeMode}</p>
          </div>
          <div className="yb-soft-card rounded-[14px] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#8ea1af]">Runtime Store</p>
            <p className="mt-2 text-[18px] font-semibold text-[#61f29f]">{status.runtimeStore}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-[10px] 2xl:grid-cols-[minmax(0,1fr)_320px]">
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
                <h2 className="text-[18px] font-semibold text-white">Runtime Snapshot</h2>
                <p className="mt-1 text-[13px] text-[#8ea1af]">Derived from the current environment</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="glass-inset rounded-[14px] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#8ea1af]">
                  {status.networks.testnet.label}
                </p>
                <p className="mt-2 text-[14px] leading-6 text-white">
                  {status.networks.testnet.storageConfigured
                    ? "Storage-ready testnet path is configured."
                    : "Storage route exists but still needs testnet envs."}
                </p>
              </div>

              <div className="glass-inset rounded-[14px] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#8ea1af]">
                  {status.networks.mainnet.label}
                </p>
                <p className="mt-2 text-[14px] leading-6 text-white">
                  {status.networks.mainnet.enabled
                    ? "Mainnet wallet switching is configured."
                    : "Mainnet remains optional in the current setup."}
                </p>
              </div>
            </div>
          </section>

          <section className="yb-card rounded-[18px] px-5 py-5">
            <h2 className="text-[18px] font-semibold text-white">Featured Reading</h2>
            <div className="mt-4 space-y-3">
              {pages.slice(0, 4).map((page) => (
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
  );
}
