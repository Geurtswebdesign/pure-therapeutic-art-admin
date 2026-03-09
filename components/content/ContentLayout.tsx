import PublicAppShell from "@/components/public/PublicAppShell";

export default function ContentLayout({
  children,
  isPreview,
}: {
  children: React.ReactNode;
  isPreview?: boolean;
}) {
  return (
    <PublicAppShell activeTab="home" subtitle="Rust, groei en troost">
      <div className="space-y-8">
        {isPreview ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
            Previewmodus: concepthoud zichtbaar voor admins.
          </div>
        ) : null}

        {children}
      </div>
    </PublicAppShell>
  );
}
