import PublicAppShell from "@/components/public/PublicAppShell";

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicAppShell activeTab="home" subtitle="Rust, groei en troost">
      {children}
    </PublicAppShell>
  );
}
