import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/getAdminUser";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  EBOOK_STORAGE_BUCKET,
  encodePrivateEbookReference,
} from "@/lib/shop/ebook-storage";

export const runtime = "nodejs";

function isValidEpub(file: File) {
  return (
    file.name.toLowerCase().endsWith(".epub") ||
    file.type === "application/epub+zip"
  );
}

async function ensureSecureEbookBucket() {
  const supabase = createAdminClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  const hasBucket = (buckets ?? []).some(
    (bucket) => bucket.name === EBOOK_STORAGE_BUCKET
  );

  if (hasBucket) {
    return;
  }

  await supabase.storage.createBucket(EBOOK_STORAGE_BUCKET, {
    public: false,
    fileSizeLimit: "100MB",
    allowedMimeTypes: ["application/epub+zip"],
  });
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 401 });
  }

  const formData = await request.formData();
  const productId = formData.get("productId");
  const file = formData.get("file");

  if (typeof productId !== "string" || !productId.trim()) {
    return NextResponse.json(
      { error: "Geen geldig product opgegeven." },
      { status: 400 }
    );
  }

  if (!(file instanceof File) || !isValidEpub(file)) {
    return NextResponse.json(
      { error: "Upload hier alleen een EPUB-bestand." },
      { status: 400 }
    );
  }

  await ensureSecureEbookBucket();

  const ext = file.name.split(".").pop()?.toLowerCase() || "epub";
  const objectPath = `products/${productId}/${crypto.randomUUID()}.${ext}`;
  const buffer = await file.arrayBuffer();
  const supabase = createAdminClient();

  const { error } = await supabase.storage
    .from(EBOOK_STORAGE_BUCKET)
    .upload(objectPath, buffer, {
      contentType: "application/epub+zip",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    return NextResponse.json(
      { error: error.message || "EPUB uploaden mislukt." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    reference: encodePrivateEbookReference(objectPath),
  });
}
