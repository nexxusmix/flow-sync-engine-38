import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function SquadBrainPage() {
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-80px)] w-full relative rounded-xl overflow-hidden border border-white/5">
        <iframe
          src="https://squad-brain.vercel.app"
          className="w-full h-full border-0"
          title="Squad Brain — Neural Command Center"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
        />
      </div>
    </DashboardLayout>
  );
}
