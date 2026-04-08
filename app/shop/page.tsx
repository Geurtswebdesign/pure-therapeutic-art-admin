import { BookOpenText, Coins, Download, Puzzle, Stethoscope } from "lucide-react";
import PublicAppShell from "@/components/public/PublicAppShell";
import {
  AssignmentCreditsEmptyState,
  CreditPreviewCard,
  getAssignmentCreditShopData,
  ProductPreviewCard,
  SectionFooterLink,
  SectionHeader,
  TherapistSubscriptionPreviewCard,
  YearSubscriptionPreviewCard,
} from "@/components/shop/ShopCatalog";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import {
  getPublicCatalogItemsByCategory,
  getPublicShopCatalog,
} from "@/lib/shop/catalog";
import { getActiveTherapistSubscriptionPacks } from "@/lib/users/therapistSubscriptionPacks";
import { getTherapistDirectoryAccessState } from "@/lib/users/therapistDirectoryAccess";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const { creditPacks, yearSubscriptionPack } =
    await getAssignmentCreditShopData();
  const user = await getCurrentUser();
  const therapistDirectoryAccess = user
    ? await getTherapistDirectoryAccessState(user.id)
    : null;
  const therapistSubscriptionPacks =
    therapistDirectoryAccess?.shouldShowTherapistSubscriptionShopOption
      ? await getActiveTherapistSubscriptionPacks()
      : [];
  const catalog = await getPublicShopCatalog();
  const books = getPublicCatalogItemsByCategory(catalog, "boeken");
  const ebooks = getPublicCatalogItemsByCategory(catalog, "ebooks");
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

        {therapistSubscriptionPacks.length ? (
          <section className="space-y-4">
            <SectionHeader
              icon={Stethoscope}
              title="Therapeutenabonnement"
              href="/shop/credits#therapeut-abonnement"
            />
            <p className="max-w-sm text-sm leading-6 text-[#6b5d50]">
              Voor therapeuten met een gratis account die hun profiel zichtbaar
              willen maken in de therapeutenlijst. Zodra het abonnement actief
              is, kun je in je profiel kiezen om openbaar te worden.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {therapistSubscriptionPacks.map((pack) => (
                <TherapistSubscriptionPreviewCard key={pack.id} pack={pack} />
              ))}
            </div>
            <SectionFooterLink href="/shop/credits#therapeut-abonnement" />
          </section>
        ) : null}

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
          <SectionHeader icon={Download} title="E-books" href="/shop/ebooks" />
          <div className="grid grid-cols-3 gap-3">
            {ebooks.map((item) => (
              <ProductPreviewCard key={item.id} item={item} />
            ))}
          </div>
          <SectionFooterLink href="/shop/ebooks" />
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
