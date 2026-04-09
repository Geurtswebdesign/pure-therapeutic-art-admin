import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeSupabaseStorageUrl } from "@/lib/images/supabaseStorageUrl";
import {
  DEFAULT_CUSTOMIZER_SETTINGS,
  DEFAULT_GENERAL_SETTINGS,
} from "@/lib/settings/types";

type PublicBranding = {
  logoUrl: string | null;
  siteName: string;
};

type PublicHeaderContext = {
  categorySlug?: string | null;
  route?: string | null;
  page?: string | null;
};

type PublicHeaderOverride = {
  logoUrl: string | null;
  logoAlt: string | null;
  subtitle: string | null;
};

type PublicSplashSettings = {
  imageUrl: string | null;
  slogan: string;
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

export const getPublicBranding = cache(async (): Promise<PublicBranding> => {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("scope", "global")
      .is("scope_id", null)
      .eq("key", "general")
      .maybeSingle<{ value: unknown }>();

    const value = asObject(data?.value);

    return {
      logoUrl: normalizeSupabaseStorageUrl(asString(value?.logoUrl, "")) || null,
      siteName: asString(value?.siteName, DEFAULT_GENERAL_SETTINGS.siteName),
    };
  } catch {
    return {
      logoUrl: DEFAULT_GENERAL_SETTINGS.logoUrl || null,
      siteName: DEFAULT_GENERAL_SETTINGS.siteName,
    };
  }
});

export const getPublicSplashSettings = cache(
  async (): Promise<PublicSplashSettings> => {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("scope", "global")
        .is("scope_id", null)
        .eq("key", "customizer")
        .maybeSingle<{ value: unknown }>();

      const value = asObject(data?.value);

      return {
        imageUrl:
          normalizeSupabaseStorageUrl(
            asString(
              value?.splashImageUrl,
              DEFAULT_CUSTOMIZER_SETTINGS.splashImageUrl
            )
          ) || null,
        slogan: asString(
          value?.splashSlogan,
          DEFAULT_CUSTOMIZER_SETTINGS.splashSlogan
        ),
      };
    } catch {
      return {
        imageUrl: DEFAULT_CUSTOMIZER_SETTINGS.splashImageUrl || null,
        slogan: DEFAULT_CUSTOMIZER_SETTINGS.splashSlogan,
      };
    }
  }
);

export const getPublicHeaderOverride = cache(
  async (context: PublicHeaderContext): Promise<PublicHeaderOverride | null> => {
    try {
      const supabase = createAdminClient();
      const [headersRes, rulesRes, fallbackRes] = await Promise.all([
        supabase
          .from("customizer_headers")
          .select("id, logo_url, logo_alt, subtitle, is_active")
          .eq("is_active", true),
        supabase
          .from("customizer_header_rules")
          .select("header_id, target_type, target_value"),
        supabase
          .from("app_settings")
          .select("value")
          .eq("scope", "global")
          .is("scope_id", null)
          .eq("key", "customizer_header_fallback")
          .maybeSingle<{ value: unknown }>(),
      ]);

      const headers = new Map(
        (headersRes.data ?? []).map((row) => [
          row.id as string,
          {
            logoUrl:
              normalizeSupabaseStorageUrl((row.logo_url as string) || null) ||
              null,
            logoAlt: (row.logo_alt as string) || null,
            subtitle: (row.subtitle as string) || null,
          },
        ])
      );
      if (!headers.size) return null;

      const rules = rulesRes.data ?? [];
      const chooseHeaderId = () => {
        if (context.categorySlug) {
          if (context.route) {
            const routeCategoryHit = rules.find(
              (r) =>
                r.target_type === "route" &&
                r.target_value === `${context.route}:category:${context.categorySlug}`
            );
            if (routeCategoryHit?.header_id) return routeCategoryHit.header_id as string;
          }
          const categoryAsRouteHit = rules.find(
            (r) =>
              r.target_type === "route" &&
              r.target_value === `category:${context.categorySlug}`
          );
          if (categoryAsRouteHit?.header_id) return categoryAsRouteHit.header_id as string;

          const hit = rules.find(
            (r) =>
              r.target_type === "category" &&
              r.target_value === context.categorySlug
          );
          if (hit?.header_id) return hit.header_id as string;
        }
        if (context.route) {
          const hit = rules.find(
            (r) =>
              r.target_type === "route" &&
              r.target_value === context.route
          );
          if (hit?.header_id) return hit.header_id as string;
        }
        if (context.page) {
          const hit = rules.find(
            (r) =>
              r.target_type === "page" &&
              r.target_value === context.page
          );
          if (hit?.header_id) return hit.header_id as string;
        }
        const fallback = asObject(fallbackRes.data?.value)?.headerId;
        return typeof fallback === "string" ? fallback : null;
      };

      const headerId = chooseHeaderId();
      if (!headerId) return null;
      return headers.get(headerId) ?? null;
    } catch {
      return null;
    }
  }
);
