import type { ReactNode } from "react";
import DocsTableOfContents from "@/components/docs/DocsTableOfContents";

interface DocsShellProps {
  children: ReactNode;
  toc?: Array<{
    id: string;
    title: string;
  }>;
}

export default function DocsShell({
  children,
  toc = [],
}: DocsShellProps) {
  return (
    <div className="grid gap-[10px] 2xl:grid-cols-[minmax(0,1fr)_260px]">
      <div className="min-w-0">{children}</div>
      <DocsTableOfContents items={toc} />
    </div>
  );
}
