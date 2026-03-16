import "server-only";

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_SHOP_CATALOG_SETTINGS,
  normalizeShopCatalogSettings,
  SHOP_CATALOG_SETTINGS_KEY,
  type ShopCatalogSettings,
} from "@/lib/shop/catalog-shared";

export * from "@/lib/shop/catalog-shared";

export const getPublicShopCatalog = cache(
  async (): Promise<ShopCatalogSettings> => {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("scope", "global")
        .is("scope_id", null)
        .eq("key", SHOP_CATALOG_SETTINGS_KEY)
        .maybeSingle<{ value: unknown }>();

      return normalizeShopCatalogSettings(data?.value);
    } catch {
      return DEFAULT_SHOP_CATALOG_SETTINGS;
    }
  }
);
