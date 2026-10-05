"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  CircleGauge,
  QrCode,
  ScanLine,
  ShieldCheck,
  Users,
} from "lucide-react";
import { CollegeDonut } from "@/components/charts/CollegeDonut";
import { CumulativeAreaChart } from "@/components/charts/CumulativeAreaChart";
import { DayOverviewChart } from "@/components/charts/DayOverviewChart";
import { SlotHeatmap } from "@/components/charts/SlotHeatmap";
import { SlotProgressBar } from "@/components/dashboard/SlotProgressBar";
import { LiveFeed } from "@/components/dashboard/LiveFeed";
import type { AdminOverview as AdminOverviewData } from "@/server/data";

const METRICS = [
  {
    key: "guests",
    label: "Active participants",
    icon: Users,
    color: "text-blue-700 bg-blue-50",
  },
  {
    key: "assigned",
    label: "QR assigned",
    icon: QrCode,
    color: "text-purple-700 bg-purple-50",
  },
  {
    key: "verifiedMeals",
    label: "Meals verified",
    icon: BadgeCheck,
    color: "text-green-700 bg-green-50",
  },
  {
    key: "scanAttempts",
    label: "Scan attempts",
    icon: ScanLine,
    color: "text-orange-700 bg-orange-50",
  },
  {
    key: "availableQrs",
    label: "QR available",
    icon: CircleGauge,
    color: "text-cyan-700 bg-cyan-50",
  },
  {
    key: "activeVolunteers",
    label: "Active staff",
    icon: ShieldCheck,
    color: "text-pink-700 bg-pink-50",
  },
] as const;

const REFRESH_INTERVAL_MS = 30_000;

export function AdminOverview({ data }: { data: AdminOverviewData }) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState !== "visible" || isRefreshing) return;
      startRefresh(() => router.refresh());
    };
    const interval = window.setInterval(refreshIfVisible, REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [isRefreshing, router]);

  const liveFeed = data.recent.map((item) => ({
    id: item.id,
    type: item.successful
      ? ("SCAN_SUCCESS" as const)
      : ("SCAN_FAILED" as const),
    guestName: item.guestName,
    college: `Handled by ${item.volunteerName}`,
    mealName: item.slotTitle,
    timestamp: item.createdAt,
    reason: item.reason ?? undefined,
  }));
  const goToActivityPage = (page: number) => {
    router.push(`/admin?activityPage=${page}`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {METRICS.map(({ key, label, icon: Icon, color }) => (
          <div
            key={key}
            className="rounded-3xl border border-[var(--color-surface-variant)] bg-white p-4 shadow-sm"
          >
            <div
              className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ${color}`}
            >
              <Icon size={20} />
            </div>
            <p className="text-2xl font-black">
              {data.totals[key].toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-on-surface-variant)]">
              {label}
            </p>
          </div>
        ))}
      </div>

      <SlotProgressBar
        slotName={
          data.activeSlot
            ? `${data.activeSlot.dayLabel} · ${data.activeSlot.title}`
            : "No active food slot"
        }
        served={data.activeSlot?.served ?? 0}
        total={data.activeSlot?.total ?? data.totals.guests}
        isActive={Boolean(data.activeSlot)}
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <DayOverviewChart data={data.dayOverview} />
        <SlotHeatmap data={data.heatmap} />
        <CumulativeAreaChart data={data.cumulativeData} />
        <CollegeDonut data={data.collegeData} />
      </div>

      <section className="rounded-3xl border border-[var(--color-surface-variant)] bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-black">
              Volunteer performance
            </h2>
            <p className="text-xs text-[var(--color-on-surface-variant)]">
              Every attempt is counted; verified means food was successfully
              approved.
            </p>
          </div>
          <span
            aria-live="polite"
            className="rounded-full bg-green-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-green-700"
          >
            {isRefreshing ? "Refreshing…" : "Auto refresh · 30 sec"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-[var(--color-on-surface-variant)]">
              <tr>
                <th className="pb-3">Staff member</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Scanned</th>
                <th className="pb-3">Verified</th>
                <th className="pb-3">Success</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.volunteerPerformance.map((member) => {
                const success = member.scanned
                  ? Math.round((member.verified / member.scanned) * 100)
                  : 0;
                return (
                  <tr
                    key={member.id}
                    className="border-t border-[var(--color-surface-variant)]"
                  >
                    <td className="py-3 font-bold">{member.name}</td>
                    <td className="py-3">{member.role}</td>
                    <td className="py-3">{member.scanned}</td>
                    <td className="py-3 font-bold text-green-700">
                      {member.verified}
                    </td>
                    <td className="py-3">{success}%</td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-bold ${member.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                      >
                        {member.active ? "ACTIVE" : "DISABLED"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-black">
          Live verification activity
        </h2>
        <LiveFeed items={liveFeed} pageSize={10} />
      </section>
    </div>
  );
}
