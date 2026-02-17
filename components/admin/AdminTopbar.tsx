export default function AdminTopbar({
  actions,
}: {
  actions?: React.ReactNode;
}) {
  return (
    <header className="h-12 bg-[#1d2327] border-b flex items-center px-6">
      <div className="flex-1" />

      <div className="flex items-center gap-3 text-white">
        {actions}
      </div>
    </header>
  );
}
