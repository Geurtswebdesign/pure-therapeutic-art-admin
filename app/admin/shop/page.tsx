import Link from "next/link";
import Image from "next/image";
import DeleteShopItemButton from "@/components/admin/shop/DeleteShopItemButton";
import { getShopCatalogSettings } from "@/lib/settings/actions";
import {
  getAllCatalogItems,
  getCatalogItemPath,
  getCatalogStatusLabel,
  isCatalogItemPublic,
} from "@/lib/shop/catalog";
import { getAdminAreaUrl } from "@/lib/site/urls";

function formatPrice(value: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export default async function AdminShopPage() {
  const settings = await getShopCatalogSettings();
  const items = getAllCatalogItems(settings);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Shop</h1>
          <p className="text-sm text-gray-600">
            Beheer hier de shop-items voor boeken, e-books en spellen.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={getAdminAreaUrl("/shop/new")}
            className="rounded border border-[#2271b1] px-4 py-2 text-sm font-medium text-[#2271b1] hover:bg-[#eef6fb]"
          >
            Nieuw product
          </Link>
          <Link
            href="/shop"
            className="rounded bg-[#2271b1] px-4 py-2 text-sm font-medium text-white hover:bg-[#135e96]"
          >
            Bekijk shop
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded border bg-white">
        <table className="min-w-full divide-y divide-stone-200 text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-[0.16em] text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Afbeelding</th>
              <th className="px-4 py-3 font-medium">Titel</th>
              <th className="px-4 py-3 font-medium">Categorie</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Prijs</th>
              <th className="px-4 py-3 font-medium">Link</th>
              <th className="px-4 py-3 font-medium">Acties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {items.map((item) => (
              <tr key={item.id} className="align-top">
                <td className="px-4 py-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded border bg-stone-100">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.imageAlt || item.title}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-stone-500">
                        Geen afbeelding
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="font-medium text-stone-900">{item.title}</div>
                  <div className="mt-1 text-xs text-stone-500">
                    {item.id} • {item.format}
                  </div>
                </td>
                <td className="px-4 py-4 text-stone-700">{item.category}</td>
                <td className="px-4 py-4 text-stone-700">
                  {getCatalogStatusLabel(item.status)}
                </td>
                <td className="px-4 py-4 text-stone-700">
                  {formatPrice(item.price)}
                </td>
                <td className="px-4 py-4 text-stone-700">
                  {item.href ? "Externe productlink" : "Nog geen productlink"}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={getAdminAreaUrl(`/shop/${item.id}`)}
                      className="text-[#2271b1] hover:underline"
                    >
                      Bewerken
                    </Link>
                    {isCatalogItemPublic(item) ? (
                      <Link
                        href={getCatalogItemPath(item)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-stone-600 hover:underline"
                      >
                        Bekijk
                      </Link>
                    ) : (
                      <span className="text-stone-400">Niet zichtbaar</span>
                    )}
                    <DeleteShopItemButton itemId={item.id} title={item.title} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
