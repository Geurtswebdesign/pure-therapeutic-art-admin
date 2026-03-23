import { BookOpenText, Coins, Puzzle } from "lucide-react";
import PublicAppShell from "@/components/public/PublicAppShell";
import {
  AssignmentCreditsEmptyState,
  CreditPreviewCard,
  getAssignmentCreditShopData,
  ProductPreviewCard,
  SectionFooterLink,
  SectionHeader,
  YearSubscriptionPreviewCard,
} from "@/components/shop/ShopCatalog";
import {
  getPublicCatalogItemsByCategory,
  getPublicShopCatalog,
} from "@/lib/shop/catalog";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const { creditPacks, yearSubscriptionPack } =
    await getAssignmentCreditShopData();
  const catalog = await getPublicShopCatalog();
  const books = getPublicCatalogItemsByCategory(catalog, "boeken");
  const games = getPublicCatalogItemsByCategory(catalog, "spellen");
  const previewCreditPacks = creditPacks.slice(0, 3);

  return (
    <PublicAppShell activeTab="shop">
      <section className="space-y-8">
        <section className="space-y-4">
          <SectionHeader
            icon={Coins}
            title="Opdrachtcredits"
            href="/shop/credits"
          />
          <p className="max-w-sm text-sm leading-6 text-[#6b5d50]">
            Hier tonen we de actieve opdrachtpakketten en het jaarabonnement
            voor opdrachten. Daarmee speel je opdrachten vrij of krijg je een
            jaar lang volledige toegang.
          </p>
          {previewCreditPacks.length || yearSubscriptionPack ? (
            <div className="space-y-3">
              {previewCreditPacks.length ? (
                <div className="grid grid-cols-3 gap-3">
                  {previewCreditPacks.map((pack) => (
                    <CreditPreviewCard key={pack.id} pack={pack} />
                  ))}
                </div>
              ) : null}
              {yearSubscriptionPack ? (
                <YearSubscriptionPreviewCard pack={yearSubscriptionPack} />
              ) : null}
            </div>
          ) : (
            <AssignmentCreditsEmptyState compact />
          )}
          <SectionFooterLink href="/shop/credits" />
        </section>

        <section className="space-y-4">
          <SectionHeader icon={BookOpenText} title="Boeken" href="/shop/boeken" />
          <div className="grid grid-cols-3 gap-3">
            {books.map((item) => (
              <ProductPreviewCard key={item.id} item={item} />
            ))}
          </div>
          <SectionFooterLink href="/shop/boeken" />
        </section>

        <section className="space-y-4">
          <SectionHeader icon={Puzzle} title="Spellen" href="/shop/spellen" />
          <div className="grid grid-cols-3 gap-3">
            {games.map((item) => (
              <ProductPreviewCard key={item.id} item={item} />
            ))}
          </div>
          <SectionFooterLink href="/shop/spellen" />
        </section>
      </section>
    </PublicAppShell>
  );
}
