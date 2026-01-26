export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      {children}
    </main>
  );
}
