import TabsNav from "@/components/analytics/TabsNav";

const tabs = [
  { label: "Overview", href: "/admin/insights/traffic/overview" },
  { label: "Traffic", href: "/admin/insights/traffic/overview" },
  { label: "Publishers", href: "/admin/insights/publishers/pages" },
  { label: "Search Console", href: "/admin/insights/search-console" },
  { label: "eCommerce", href: "/admin/insights/ecommerce" },
  { label: "Realtime", href: "/admin/insights/realtime" },
];

export default function InsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="w-full space-y-6">
      <header className="rounded-lg border bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold">Insights</h1>
        <p className="mt-1 text-sm text-gray-600">
          Bekijk verkeer, pagina-prestaties en marketingbronnen.
        </p>
        <div className="mt-4">
          <TabsNav tabs={tabs} />
        </div>
      </header>

      {children}
    </section>
  );
}
