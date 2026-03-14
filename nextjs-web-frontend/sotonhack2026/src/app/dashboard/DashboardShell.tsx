import { Suspense } from "react";
import StatsPanel from "./StatsPanel";
import StatsPanelSkeleton from "./StatsPanelSkeleton";

export default function DashboardShell() {
  return (
    <Suspense fallback={<StatsPanelSkeleton />}>
      <StatsPanel />
    </Suspense>
  );
}