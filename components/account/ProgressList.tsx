import Link from "next/link";

type ProgressListItemView = {
  id: string;
  title: string;
  href: string | null;
  categoryGroup?: string | null;
  categoriesText: string;
  statusText: string;
  metaText: string;
  noteText?: string | null;
};

export default function ProgressList({
  title,
  emptyText,
  items,
  groupByCategory = false,
  groupItemLabelSingular = "item",
  groupItemLabelPlural = "items",
}: {
  title: string;
  emptyText: string;
  items: ProgressListItemView[];
  groupByCategory?: boolean;
  groupItemLabelSingular?: string;
  groupItemLabelPlural?: string;
}) {
  const groupedItems = groupByCategory
    ? Array.from(
        items.reduce((groups, item) => {
          const groupKey = item.categoryGroup?.trim() || "Geen categorie";
          const currentItems = groups.get(groupKey) ?? [];
          currentItems.push(item);
          groups.set(groupKey, currentItems);
          return groups;
        }, new Map<string, ProgressListItemView[]>())
      ).sort(([left], [right]) => left.localeCompare(right, "nl"))
    : [];

  function renderItem(item: ProgressListItemView) {
    const content = (
      <>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-medium text-stone-900">{item.title}</div>
            <div className="mt-1 text-xs text-stone-500">{item.categoriesText}</div>
          </div>
          <span className="rounded-full bg-[#f7f0e9] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-700">
            {item.statusText}
          </span>
        </div>

        <div className="mt-2 text-xs text-stone-500">{item.metaText}</div>

        {item.noteText ? (
          <p className="mt-2 text-sm leading-6 text-stone-600">{item.noteText}</p>
        ) : null}
      </>
    );

    return item.href ? (
      <Link
        key={item.id}
        href={item.href}
        className="block rounded-xl border border-[#eadfd4] bg-[#fcf8f4] px-4 py-3 transition hover:border-[#d8c6b8]"
      >
        {content}
      </Link>
    ) : (
      <div
        key={item.id}
        className="rounded-xl border border-[#eadfd4] bg-[#fcf8f4] px-4 py-3"
      >
        {content}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white px-4 py-4">
      <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
        {title}
      </h4>

      {items.length ? (
        groupByCategory ? (
          <div className="mt-4 space-y-3">
            {groupedItems.map(([category, categoryItems]) => (
              <details
                key={category}
                className="group overflow-hidden rounded-xl border border-[#eadfd4] bg-[#fcf8f4]"
              >
                <summary className="flex list-none items-center justify-between gap-3 px-4 py-3 text-left marker:hidden">
                  <div className="min-w-0">
                    <div className="font-medium text-stone-900">{category}</div>
                    <div className="mt-1 text-xs text-stone-500">
                      {categoryItems.length}{" "}
                      {categoryItems.length === 1
                        ? groupItemLabelSingular
                        : groupItemLabelPlural}
                    </div>
                  </div>
                  <span className="relative block h-4 w-4 shrink-0">
                    <span className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-stone-400" />
                    <span className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-stone-400 transition group-open:opacity-0" />
                  </span>
                </summary>

                <div className="space-y-3 border-t border-[#eadfd4] bg-white/60 px-3 py-3">
                  {categoryItems.map((item) => renderItem(item))}
                </div>
              </details>
            ))}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {items.map((item) => renderItem(item))}
          </div>
        )
      ) : (
        <p className="mt-3 text-sm leading-6 text-stone-500">{emptyText}</p>
      )}
    </div>
  );
}
