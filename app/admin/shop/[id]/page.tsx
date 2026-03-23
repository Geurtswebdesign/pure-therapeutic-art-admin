import Link from "next/link";
import { notFound } from "next/navigation";
import DeleteShopItemButton from "@/components/admin/shop/DeleteShopItemButton";
import ShopCatalogItemEditorClient from "@/components/admin/shop/ShopCatalogItemEditorClient";
import { getShopCatalogSettings } from "@/lib/settings/actions";
import { getCatalogItemById } from "@/lib/shop/catalog";
import { getAdminAreaUrl } from "@/lib/site/urls";

export default async function AdminShopItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const settings = await getShopCatalogSettings();
  const item = getCatalogItemById(settings, id);

  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href={getAdminAreaUrl("/shop")}
          className="text-sm text-[#2271b1] hover:underline"
        >
          Terug naar shop
        </Link>
        <DeleteShopItemButton
          itemId={item.id}
          title={item.title}
          redirectTo={getAdminAreaUrl("/shop")}
          className="rounded border border-red-200 px-3 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <ShopCatalogItemEditorClient item={item} />
    </div>
  );
}
