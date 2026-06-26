const STORAGE_ROUTE_MARKERS = [
  "/storage/v1/object/public/",
  "/storage/v1/object/sign/",
  "/storage/v1/object/authenticated/",
] as const;

function getCurrentSupabaseOrigin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) return null;

  try {
    return new URL(supabaseUrl).origin;
  } catch {
    return null;
  }
}

export function resolveCurrentSupabaseStorageUrl(
  value: string | null | undefined
) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const currentOrigin = getCurrentSupabaseOrigin();
  if (!currentOrigin) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const marker = STORAGE_ROUTE_MARKERS.find((candidate) =>
      url.pathname.includes(candidate)
    );

    if (!marker || url.origin === currentOrigin) {
      return trimmed;
    }

    return `${currentOrigin}${url.pathname}${url.search}${url.hash}`;
  } catch {
    return trimmed;
  }
}
