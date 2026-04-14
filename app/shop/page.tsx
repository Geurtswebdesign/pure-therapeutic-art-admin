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
import { getCreditPackPurchaseMode } from "@/lib/iap/credit-pack-purchase-mode";
import { getAppLanguage } from "@/lib/i18n/getAppLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getPublicAppMessages } from "@/lib/i18n/publicAppMessages";
import { translateShopCatalogSettings } from "@/lib/i18n/shopCatalogTranslations";
import {
  getPublicCatalogItemsByCategory,
  getPublicShopCatalog,
} from "@/lib/shop/catalog";
import { getActiveTherapistSubscriptionPacks } from "@/lib/users/therapistSubscriptionPacks";
import { getTherapistDirectoryAccessState } from "@/lib/users/therapistDirectoryAccess";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const language = resolveUiLanguage(await getAppLanguage());
  const t = getPublicAppMessages(language);
  const { creditPacks, yearSubscriptionPack } =
    await getAssignmentCreditShopData();
  const user = await getCurrentUser();
  const creditPackPurchaseMode = getCreditPackPurchaseMode();
  const therapistDirectoryAccess = user
    ? await getTherapistDirectoryAccessState(user.id)
    : null;
  const therapistSubscriptionPacks =
    therapistDirectoryAccess?.shouldShowTherapistSubscriptionShopOption
      ? await getActiveTherapistSubscriptionPacks()
      : [];
  const catalog = translateShopCatalogSettings(
    await getPublicShopCatalog(),
    language
  );
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
            language={language}
            title={t.shop.assignmentCreditsTitle}
            href="/shop/credits"
          />
          <p className="max-w-sm text-sm leading-6 text-[#6b5d50]">
            {t.shop.assignmentCreditsDescription}
          </p>
          {previewCreditPacks.length || yearSubscriptionPack ? (
            <div className="space-y-3">
              {previewCreditPacks.length ? (
                <div className="grid grid-cols-3 gap-3">
                  {previewCreditPacks.map((pack) => (
                    <CreditPreviewCard
                      key={pack.id}
                      isLoggedIn={Boolean(user)}
                      language={language}
                      pack={pack}
                      purchaseMode={creditPackPurchaseMode}
                    />
                  ))}
                </div>
              ) : null}
              {yearSubscriptionPack ? (
                <YearSubscriptionPreviewCard
                  isLoggedIn={Boolean(user)}
                  language={language}
                  pack={yearSubscriptionPack}
                  purchaseMode={creditPackPurchaseMode}
                />
              ) : null}
            </div>
          ) : (
            <AssignmentCreditsEmptyState compact language={language} />
          )}
          <SectionFooterLink href="/shop/credits" language={language} />
        </section>

        {therapistSubscriptionPacks.length ? (
          <section className="space-y-4">
            <SectionHeader
              icon={Stethoscope}
              language={language}
              title={t.shop.therapistSubscriptionTitle}
              href="/shop/credits#therapeut-abonnement"
            />
            <p className="max-w-sm text-sm leading-6 text-[#6b5d50]">
              {t.shop.therapistSubscriptionDescription}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {therapistSubscriptionPacks.map((pack) => (
                <TherapistSubscriptionPreviewCard
                  key={pack.id}
                  isLoggedIn={Boolean(user)}
                  language={language}
                  pack={pack}
                  purchaseMode={creditPackPurchaseMode}
                />
              ))}
            </div>
            <SectionFooterLink
              href="/shop/credits#therapeut-abonnement"
              language={language}
            />
          </section>
        ) : null}

        <section className="space-y-4">
          <SectionHeader
            href="/shop/boeken"
            icon={BookOpenText}
            language={language}
            title={t.shop.booksTitle}
          />
          <div className="grid grid-cols-3 gap-3">
            {books.map((item) => (
              <ProductPreviewCard key={item.id} item={item} language={language} />
            ))}
          </div>
          <SectionFooterLink href="/shop/boeken" language={language} />
        </section>

        <section className="space-y-4">
          <SectionHeader
            href="/shop/ebooks"
            icon={Download}
            language={language}
            title={t.shop.ebooksTitle}
          />
          <div className="grid grid-cols-3 gap-3">
            {ebooks.map((item) => (
              <ProductPreviewCard key={item.id} item={item} language={language} />
            ))}
          </div>
          <SectionFooterLink href="/shop/ebooks" language={language} />
        </section>

        <section className="space-y-4">
          <SectionHeader
            href="/shop/spellen"
            icon={Puzzle}
            language={language}
            title={t.shop.gamesTitle}
          />
          <div className="grid grid-cols-3 gap-3">
            {games.map((item) => (
              <ProductPreviewCard key={item.id} item={item} language={language} />
            ))}
          </div>
          <SectionFooterLink href="/shop/spellen" language={language} />
        </section>
      </section>
    </PublicAppShell>
  );
}
