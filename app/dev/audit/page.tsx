import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import DevAuditLinkPatch from "@/components/dev/DevAuditLinkPatch";
import JudgePage, {
  dynamic,
  revalidate,
} from "@/app/(workspace)/judge/page";

export { dynamic, revalidate };

export default async function DeveloperAuditPage() {
  return (
    <>
      <DevAuditLinkPatch />
      <div className="px-[10px] pt-[10px] md:px-[10px] md:pt-[10px]">
        <Link
          href="/dev"
          className="inline-flex items-center gap-2 rounded-full border border-[#1ee6b5]/20 bg-[#07141f]/85 px-3 py-2 text-sm font-medium text-[#dff7f3] transition hover:border-[#1ee6b5]/40 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to store
        </Link>
      </div>
      <JudgePage />
    </>
  );
}
