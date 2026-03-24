export async function uploadPrivateEbookAssetClient(
  file: File,
  productId: string
) {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("productId", productId);

  const response = await fetch("/api/admin/ebooks/upload", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as
    | { reference?: string; error?: string }
    | null;

  if (!response.ok || !payload?.reference) {
    throw new Error(payload?.error || "EPUB uploaden mislukt.");
  }

  return payload.reference;
}
