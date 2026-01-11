export default function UserViewer({
  item,
  translations,
}: {
  item: any;
  translations: any[];
}) {
  const t = translations.find((t) => t.locale === "nl") ?? translations[0];

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">{t?.title}</h1>
      <div className="mt-4 whitespace-pre-wrap">
        {t?.body_richtext}
      </div>
    </div>
  );
}
