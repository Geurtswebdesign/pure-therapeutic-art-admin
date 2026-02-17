// AdminChrome wraps all admin pages and enforces consistent layout,
// navigation and future admin-only UI extensions.

import Link from "next/link";
import LogoutButton from "@/components/admin/LogoutButton";

export default function AdminChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Topbar (WP-like) */}
      <div className="h-12 bg-[#1d2327] text-white flex items-center justify-between px-4">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold">Pure Therapeutic ART</span>
          <Link className="opacity-90 hover:opacity-100" href="/content">Content</Link>
          <Link className="opacity-90 hover:opacity-100" href="/admin/users">Users</Link>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="opacity-80">Admin</span>
          <LogoutButton />
        </div>
      </div>

      <div className="flex">
        {/* Sidebar (WP-like) */}
        <aside className="w-45 bg-[#1d2327] text-white min-h-[calc(100vh-3rem)]">
          <nav className="p-3 text-sm space-y-1">
            <div className="pt-3 mt-3 border-t border-white/10 text-white/70 text-xs px-3">
              Beheer
            </div>
            <Link className="block px-3 py-2 rounded hover:bg-white/10" href="/admin">
              Dashboard
            </Link>
            <Link className="block px-3 py-2 rounded hover:bg-white/10" href="/content">
              Content
            </Link>
            <Link className="block px-3 py-2 rounded hover:bg-white/10" href="/admin/users">
              Users
            </Link>
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
