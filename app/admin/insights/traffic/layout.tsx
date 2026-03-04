import TabsNav from "@/components/analytics/TabsNav";

const tabs = [
  { label: "Overview", href: "/admin/insights/traffic/overview" },
  { label: "Technology", href: "/admin/insights/traffic/technology" },
  { label: "Campaigns", href: "/admin/insights/traffic/campaigns" },
  { label: "Source / medium", href: "/admin/insights/traffic/sources" },
  { label: "Social", href: "/admin/insights/traffic/social" },
  { label: "AI Traffic", href: "/admin/insights/traffic/ai" },
];

export default function TrafficLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <TabsNav tabs={tabs} />

      {children}
    </div>
  );
}
