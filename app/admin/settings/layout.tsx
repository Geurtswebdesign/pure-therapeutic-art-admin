import type { ReactNode } from "react";
import SettingsTabs from "@/components/admin/settings/SettingsTabs";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-gray-600">
          Platform-, security- en infrastructuurinstellingen.
        </p>
      </header>
      <SettingsTabs />
      <div>{children}</div>
    </section>
  );
}
