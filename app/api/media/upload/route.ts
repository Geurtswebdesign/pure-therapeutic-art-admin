import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/getAdminUser";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, getUserOrNull } from "@/lib/supabase/server";

export const runtime = "nodejs";

function sanitizePathPrefix(value: string) {
  return value
    .trim()
    .replace(/\\/g, "/")
    .replace(/[^a-zA-Z0-9/_-]/g, "")
    .replace(/\/+/g, "/")
    .replace(/^\/|\/$/g, "");
}

function sanitizeExtension(fileName: string) {
  const rawExtension = fileName.split(".").pop()?.trim().toLowerCase() || "bin";
  const cleanedExtension = rawExtension.replace(/[^a-z0-9]/g, "");
  return cleanedExtension || "bin";
}

function isOwnProfileUpload(pathPrefix: string, userId: string) {
  return (
    pathPrefix === `profiles/${userId}` ||
    pathPrefix.startsWith(`profiles/${userId}/`)
  );
}

async function getAuthorizedUploadPrefix(pathPrefix: string) {
  const sanitizedPrefix = sanitizePathPrefix(pathPrefix);
  if (!sanitizedPrefix) {
    throw new Error("Geen geldige uploadmap opgegeven.");
  }

  const supabase = await createClient();
  const user = await getUserOrNull(supabase);
  if (!user) {
    return {
      error: NextResponse.json(
        { error: "Niet geautoriseerd." },
        { status: 401 }
      ),
      sanitizedPrefix: null,
    };
  }

  if (isOwnProfileUpload(sanitizedPrefix, user.id)) {
    return { error: null, sanitizedPrefix };
  }

  const admin = await getAdminUser();
  if (!admin) {
    return {
      error: NextResponse.json(
        { error: "Je mag alleen je eigen profielfoto uploaden." },
        { status: 403 }
      ),
      sanitizedPrefix: null,
    };
  }

  return { error: null, sanitizedPrefix };
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const pathPrefix = formData.get("pathPrefix");
  const file = formData.get("file");

  if (typeof pathPrefix !== "string" || !pathPrefix.trim()) {
    return NextResponse.json(
      { error: "Geen geldige uploadmap opgegeven." },
      { status: 400 }
    );
  }

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Geen geldig bestand ontvangen." },
      { status: 400 }
    );
  }

  const authResult = await getAuthorizedUploadPrefix(pathPrefix);
  if (authResult.error) {
    return authResult.error;
  }

  const ext = sanitizeExtension(file.name);
  const objectPath = `${authResult.sanitizedPrefix}/${crypto.randomUUID()}.${ext}`;
  const buffer = await file.arrayBuffer();
  const supabaseAdmin = createAdminClient();

  const { error: uploadError } = await supabaseAdmin.storage
    .from("media")
    .upload(objectPath, buffer, {
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message || "Uploaden mislukt." },
      { status: 500 }
    );
  }

  const storagePath = `media/${objectPath}`;
  const { error: insertError } = await supabaseAdmin.from("media_assets").insert({
    file_path: storagePath,
    mime_type: file.type || "application/octet-stream",
    alt_text: null,
  });

  if (insertError) {
    await supabaseAdmin.storage.from("media").remove([objectPath]);
    return NextResponse.json(
      {
        error: insertError.message || "Mediarecord opslaan mislukt.",
      },
      { status: 500 }
    );
  }

  const { data } = supabaseAdmin.storage.from("media").getPublicUrl(objectPath);

  return NextResponse.json({
    url: data.publicUrl,
    filePath: storagePath,
  });
}
