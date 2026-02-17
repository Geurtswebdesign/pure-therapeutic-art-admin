export default function PreviewButton({
  slug,
  locale,
  fullWidth = false,
}: {
  slug: string;
  locale: string;
  fullWidth?: boolean;
}) {
  return (
    <a
      href={`/${locale}/${slug}?preview=1`}
      target="_blank"
      className={[
        "rounded bg-yellow-100 px-3 py-2 text-sm text-yellow-800 hover:bg-yellow-200",
        fullWidth && "block w-full text-center",
      ].join(" ")}
    >
      🔍 Preview
    </a>
  );
}