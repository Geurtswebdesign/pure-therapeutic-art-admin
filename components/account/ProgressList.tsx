import Link from "next/link";

type ProgressListItemView = {
  id: string;
  title: string;
  href: string | null;
  categoriesText: string;
  statusText: string;
  metaText: string;
  noteText?: string | null;
};

export default function ProgressList({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: ProgressListItemView[];
}) {
  return (
    <div className="rounded-xl bg-white px-4 py-4">
      <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
        {title}
      </h4>

      {items.length ? (
        <div className="mt-4 space-y-3">
          {items.map((item) => {
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
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {item.noteText}
                  </p>
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
          })}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-stone-500">{emptyText}</p>
      )}
    </div>
  );
}
