export async function uploadMediaAssetClient(
  file: File,
  pathPrefix: string
) {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("pathPrefix", pathPrefix);

  const response = await fetch("/api/media/upload", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: string; url?: string }
    | null;

  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error || "Uploaden mislukt.");
  }

  return payload.url;
}

export async function uploadImageClient(
  file: File,
  contentItemId: string
) {
  return uploadMediaAssetClient(file, contentItemId);
}
