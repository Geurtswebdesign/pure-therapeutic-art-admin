export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f0ebf5]">
      <main className="mx-auto w-full max-w-[1440px] px-3 py-5 sm:px-6 sm:py-8 lg:px-10">
        {children}
      </main>
    </div>
  );
}
