export default function ContentLayout({
  children,
  isPreview,
}: {
  children: React.ReactNode;
  isPreview?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f2ea_0%,#fcfaf7_18%,#ffffff_52%,#f4efe7_100%)]">
      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {isPreview ? (
          <div className="mb-8 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
            Previewmodus: concepthoud zichtbaar voor admins.
          </div>
        ) : null}

        {children}
      </main>
    </div>
  );
}
