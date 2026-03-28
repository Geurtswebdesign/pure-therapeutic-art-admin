import { normalizeImages } from "@/lib/content/normalizeHtml";

export default function AccordionBlock({
  items,
}: {
  items: Array<{
    id?: string;
    title: string;
    body: string;
  }>;
}) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <details
          key={item.id || `accordion-${index}`}
          className="rounded-[1.2rem] border border-[#ddcfbf] bg-white/80 shadow-sm"
          open={index === 0}
        >
          <summary className="cursor-pointer px-5 py-4 text-base font-semibold text-stone-900">
            {item.title || `Onderdeel ${index + 1}`}
          </summary>

          {item.body ? (
            <div className="border-t border-[#eadfd4] px-5 py-4">
              <div
                className="prose prose-sm max-w-none prose-headings:text-stone-900 prose-p:text-stone-700 prose-li:text-stone-700 prose-strong:text-stone-900 prose-a:text-stone-900"
                dangerouslySetInnerHTML={{ __html: normalizeImages(item.body) }}
              />
            </div>
          ) : null}
        </details>
      ))}
    </div>
  );
}
