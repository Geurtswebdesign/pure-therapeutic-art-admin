import { notFound } from "next/navigation";
import ShopCatalogItemEditorClient from "@/components/admin/shop/ShopCatalogItemEditorClient";
import { getShopCatalogSettings } from "@/lib/settings/actions";
import { getCatalogItemById } from "@/lib/shop/catalog";

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

  return <ShopCatalogItemEditorClient item={item} />;
}
