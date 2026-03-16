import ShopCatalogSettingsForm from "@/components/admin/settings/ShopCatalogSettingsForm";
import { getShopCatalogSettings } from "@/lib/settings/actions";

export default async function SettingsShopPage() {
  const settings = await getShopCatalogSettings();

  return (
    <section className="space-y-6">
      <header className="rounded-lg border bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold">Shopcontent</h1>
        <p className="mt-1 text-sm text-gray-600">
          Bewerk hier de teksten, prijzen, links en status van boeken en
          spellen die in de shop zichtbaar zijn.
        </p>
      </header>

      <ShopCatalogSettingsForm initialValues={settings} />
    </section>
  );
}
