import TabsNav from "@/components/analytics/TabsNav";

const tabs = [
  { label: "Overview", href: "/admin/insights/publishers/overview" },
  { label: "Page report", href: "/admin/insights/publishers/pages" },
  { label: "Country report", href: "/admin/insights/publishers/countries" },
  { label: "Events", href: "/admin/insights/publishers/events" },
];

export default function PublishersLayout({
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
