import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getPublicEbookProductBySlug,
  userOwnsEbookProduct,
} from "@/lib/shop/ebook-products";
import { parseEbookAssetReference } from "@/lib/shop/ebook-storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Niet ingelogd", { status: 401 });
  }

  const { slug } = await context.params;
  const item = await getPublicEbookProductBySlug(slug);
  if (!item) {
    return new NextResponse("Niet gevonden", { status: 404 });
  }

  const hasAccess = await userOwnsEbookProduct(user.id, item);
  if (!hasAccess) {
    return new NextResponse("Geen toegang", { status: 403 });
  }

  const asset = parseEbookAssetReference(item.epubUrl);
  if (!asset) {
    return new NextResponse("Geen leesbaar e-book gekoppeld", { status: 404 });
  }

  if (/^https?:\/\//i.test(item.epubUrl ?? "")) {
    const response = await fetch(item.epubUrl!, {
      cache: "no-store",
    });

    if (!response.ok) {
      return new NextResponse("Bestand niet beschikbaar", { status: 404 });
    }

    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/epub+zip",
        "Content-Disposition": `inline; filename="${slug}.epub"`,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(asset.bucket)
    .download(asset.path);

  if (error || !data) {
    return new NextResponse("Bestand niet beschikbaar", { status: 404 });
  }

  const buffer = await data.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": data.type || "application/epub+zip",
      "Content-Disposition": `inline; filename="${slug}.epub"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
