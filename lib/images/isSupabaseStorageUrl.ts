export function isSupabaseStorageUrl(src: string | null | undefined): boolean {
  if (!src) {
    return false;
  }

  try {
    const url = new URL(src);
    const configuredSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const configuredHost = configuredSupabaseUrl
      ? new URL(configuredSupabaseUrl).hostname
      : null;

    return (
      url.protocol === "https:" &&
      Boolean(configuredHost) &&
      url.hostname === configuredHost &&
      url.pathname.startsWith("/storage/v1/object/public/")
    );
  } catch {
    return false;
  }
}
