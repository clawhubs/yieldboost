"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setOpenIndex((prev) => (prev === index ? null : index));
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={item.q}
            className="rounded-2xl border border-[rgba(0,201,177,0.10)] bg-[rgba(0,201,177,0.03)] transition-all duration-300"
          >
            <button
              type="button"
              onClick={() => toggle(index)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
            >
              <h3 className="text-[14px] font-bold leading-6 text-white">{item.q}</h3>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[#72f3c7] transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-4 pb-4 text-[14px] leading-7 text-[#c8dae6]">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
