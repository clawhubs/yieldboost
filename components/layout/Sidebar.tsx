"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  ChartNoAxesCombined,
  Clock3,
  Copy,
  Disc3,
  GitBranch,
  Globe,
  Grid2X2,
  House,
  Image,
  Package2,
  Settings2,
  Star,
  Wallet2,
  Boxes,
  BriefcaseBusiness,
  MessageCircleMore,
  Zap,
} from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";

interface NavigationItem {
  href: string;
  label: string;
  icon: typeof House;
  badge?: string;
}

const navigation: NavigationItem[] = [
  { href: "/", label: "Dashboard", icon: House },
  { href: "/agent", label: "Boost", icon: Zap, badge: "HOT" },
  { href: "/portfolio", label: "Portfolio", icon: BriefcaseBusiness },
  { href: "/strategies", label: "Strategies", icon: Boxes },
  { href: "/opportunities", label: "Opportunities", icon: Package2 },
  { href: "/history", label: "History", icon: Clock3 },
  { href: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { href: "/watchlist", label: "Watchlist", icon: Star, badge: "NEW" },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

const socialIcons = [Globe, MessageCircleMore, GitBranch, Grid2X2, Image];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      data-testid="sidebar"
      className="w-full border-b border-[#141b22] bg-[#05090d] px-[10px] py-[10px] md:sticky md:top-0 md:h-screen md:w-[242px] md:flex-none md:overflow-y-auto md:border-b-0 md:border-r"
    >
      <div className="min-h-0">
        <div className="rounded-[18px] border border-[#172028] bg-[linear-gradient(180deg,#0a1117_0%,#060a0f_100%)] px-4 py-4">
          <BrandLogo />
          <p className="mt-2.5 text-[12px] text-[#c9d2db]">AI Agent for DeFi Growth</p>
        </div>

        <nav className="mt-4 flex gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
          {navigation.map(({ href, icon: Icon, label, badge }) => {
            const active = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                data-testid={`nav-${label.toLowerCase()}`}
                className={`flex min-w-fit items-center gap-3 rounded-[14px] border px-4 py-[11px] text-[13px] font-medium transition md:min-w-0 ${
                  active
                    ? "border-[#0ea89a] bg-[linear-gradient(180deg,rgba(0,201,177,0.18),rgba(0,130,116,0.12))] text-white shadow-[inset_0_0_0_1px_rgba(0,201,177,0.18)]"
                    : "border-transparent text-[#f4f7fb] hover:border-[#182028] hover:bg-[#0a1117]"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-[#1fd8c8]" : "text-[#f4f7fb]"}`} />
                <span>{label}</span>
                {badge ? (
                  <span className="ml-auto rounded-full border border-[#12453f] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#25d6c6]">
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-4 space-y-3 border-t border-[#121920] pt-4 md:mt-4">
        <div className="rounded-[18px] border border-[#1b232c] bg-[linear-gradient(180deg,#0b1218_0%,#0a0f14_100%)] p-4">
          <div className="flex items-center gap-2 text-[13px] font-medium text-white">
            <span className="inline-flex h-3 w-3 rounded-full bg-[#35d56e] shadow-[0_0_14px_rgba(53,213,110,0.55)]" />
            Account
          </div>
          <div className="mt-1 pl-5 text-[12px] text-[#35d56e]">Connected</div>

          <div className="mt-4 flex items-center justify-between rounded-[12px] border border-[#1a232b] px-3 py-3 text-[13px] text-[#d8e0e8]">
            <div className="flex items-center gap-3">
              <Wallet2 className="h-4 w-4 text-[#d8e0e8]" />
              <span>0x7eF3...8e21</span>
            </div>
            <Copy className="h-3.5 w-3.5 text-[#9ca9b6]" />
          </div>

          <div className="mt-4 flex items-center gap-3 text-[13px] text-[#e5edf5]">
            <Gift className="h-4 w-4 text-[#f3a441]" />
            <span>Refer friends → Earn YA0G</span>
          </div>

          <div className="mt-4">
            <p className="text-[14px] text-[#27de6b]">15 YA0G</p>
            <p className="mt-1 text-[13px] text-[#d9e2ea]">pending rewards</p>
          </div>

          <button
            type="button"
            data-testid="claim-rewards"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-[11px] bg-[linear-gradient(180deg,#1fd7ce_0%,#11b7bf_100%)] px-4 py-3 text-[14px] font-medium text-[#081116]"
          >
            Claim Now
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {socialIcons.map((Icon, index) => (
            <button
              key={index}
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#1d252e] bg-[#070c11] text-[#d8e0e8]"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        <div className="px-2">
          <p className="text-[12px] text-[#9daab6]">Powered by</p>
          <div className="mt-1 flex items-center gap-2 text-[14px] font-semibold text-white">
            <Disc3 className="h-4 w-4 text-[#1fd8c8]" />
            0G Chain
          </div>
        </div>
      </div>
    </aside>
  );
}

function Gift({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 10V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M5 12H19V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V12Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4 8.5C4 7.94772 4.44772 7.5 5 7.5H19C19.5523 7.5 20 7.94772 20 8.5V11C20 11.5523 19.5523 12 19 12H5C4.44772 12 4 11.5523 4 11V8.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 7.5H9.8C8.2536 7.5 7 6.2464 7 4.7C7 4.3134 7.3134 4 7.7 4C9.7068 4 11.4546 5.09321 12 7.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 7.5H14.2C15.7464 7.5 17 6.2464 17 4.7C17 4.3134 16.6866 4 16.3 4C14.2932 4 12.5454 5.09321 12 7.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}
