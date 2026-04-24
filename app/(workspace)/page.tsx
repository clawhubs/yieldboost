import { Suspense } from "react";
import DashboardView from "@/components/dashboard/DashboardView";
import SkeletonDashboard from "@/components/ui/SkeletonDashboard";

export default function HomePage() {
  return (
    <Suspense fallback={<SkeletonDashboard />}>
      <DashboardView />
    </Suspense>
  );
}
