import MediaLibraryClient from "@/components/admin/media/MediaLibraryClient";

type PageProps = {
  searchParams: Promise<{
    tab?: string;
  }>;
};

export default async function AdminMediaPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Media</h1>
      </div>

      <MediaLibraryClient initialTab={tab === "upload" ? "upload" : "library"} />
    </div>
  );
}
