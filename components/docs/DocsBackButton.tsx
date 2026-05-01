"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface DocsBackButtonProps {
  label?: string;
}

export default function DocsBackButton({
  label = "Back",
}: DocsBackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="glass-inset inline-flex items-center gap-2 rounded-[12px] px-4 py-3 text-[13px] font-medium text-[#d8e1e8] transition hover:border-[rgba(0,201,177,0.25)] hover:text-white"
    >
      <ArrowLeft className="h-4 w-4 text-[#22ddd0]" />
      {label}
    </button>
  );
}
