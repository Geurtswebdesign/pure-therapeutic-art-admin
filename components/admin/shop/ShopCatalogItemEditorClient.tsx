"use client";

import { useState } from "react";
import { saveShopCatalogItem } from "@/lib/settings/actions";
import type { CatalogItem } from "@/lib/shop/catalog-shared";
import ShopEditorCanvas from "@/components/admin/shop/ShopEditorCanvas";
import ShopMetadataSidebar from "@/components/admin/shop/ShopMetadataSidebar";

type Props = {
  item: CatalogItem;
};

type DraftState = {
  title: string;
  body: string;
  imageUrl: string;
  imageAlt: string;
  introTitle: string;
  introText: string;
  descriptionTitle: string;
  detailsTitle: string;
  purchaseTitle: string;
  purchaseDescription: string;
  purchaseButtonLabel: string;
  developmentStateLabel: string;
  unavailablePriceLabel: string;
  developmentCalloutLabel: string;
  developmentPurchaseText: string;
  developmentNotice: string;
  description: string;
  details: string[];
  format: string;
  tag: string;
  price: number;
  href: string;
  contentSlug: string;
  epubUrl: string;
  status: CatalogItem["status"];
};

export default function ShopCatalogItemEditorClient({ item }: Props) {
  const [draft, setDraft] = useState<DraftState>({
    title: item.title,
    body: item.body,
    imageUrl: item.imageUrl ?? "",
    imageAlt: item.imageAlt ?? "",
    introTitle: item.introTitle,
    introText: item.introText,
    descriptionTitle: item.descriptionTitle,
    detailsTitle: item.detailsTitle,
    purchaseTitle: item.purchaseTitle,
    purchaseDescription: item.purchaseDescription,
    purchaseButtonLabel: item.purchaseButtonLabel,
    developmentStateLabel: item.developmentStateLabel,
    unavailablePriceLabel: item.unavailablePriceLabel,
    developmentCalloutLabel: item.developmentCalloutLabel,
    developmentPurchaseText: item.developmentPurchaseText,
    developmentNotice: item.developmentNotice,
    description: item.description,
    details: item.details,
    format: item.format,
    tag: item.tag,
    price: item.price,
    href: item.href ?? "",
    contentSlug: item.contentSlug ?? "",
    epubUrl: item.epubUrl ?? "",
    status: item.status ?? "concept",
  });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onDraftChange(patch: Partial<DraftState>) {
    setDraft((current) => ({ ...current, ...patch }));
    setDirty(true);
    setSuccess(false);
    setError(null);
  }

  async function onSaveAll() {
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      await saveShopCatalogItem(item.id, {
        ...item,
        ...draft,
        href: draft.href,
        contentSlug: draft.contentSlug,
        epubUrl: draft.epubUrl,
        status: draft.status,
      });
      setDirty(false);
      setSuccess(true);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Opslaan mislukt."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex">
      <ShopEditorCanvas
        itemId={item.id}
        title={draft.title}
        body={draft.body}
        description={draft.description}
        introTitle={draft.introTitle}
        introText={draft.introText}
        descriptionTitle={draft.descriptionTitle}
        detailsTitle={draft.detailsTitle}
        details={draft.details}
        purchaseTitle={draft.purchaseTitle}
        purchaseDescription={draft.purchaseDescription}
        onChange={onDraftChange}
      />

      <ShopMetadataSidebar
        item={item}
        draft={draft}
        dirty={dirty}
        saving={saving}
        success={success}
        error={error}
        onDraftChange={onDraftChange}
        onSaveAll={onSaveAll}
      />
    </div>
  );
}
