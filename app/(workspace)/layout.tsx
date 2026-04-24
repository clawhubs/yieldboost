import type { ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen md:flex md:h-screen">
      <Sidebar />
      <main className="relative min-w-0 flex-1 overflow-x-hidden md:h-screen md:overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
