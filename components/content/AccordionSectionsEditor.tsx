"use client";

import ClassicTextEditor from "@/components/content/ClassicTextEditor";
import {
  createAccordionSection,
  type AccordionSection,
} from "@/lib/content/accordionSections";

type Labels = {
  accordionContent: string;
  accordionDescription: string;
  addAccordionItem: string;
  accordionItemTitle: string;
  accordionItemTitlePlaceholder: string;
  accordionEmpty: string;
  removeAccordionItem: string;
};

export default function AccordionSectionsEditor({
  contentItemId,
  sections,
  onChange,
  labels,
}: {
  contentItemId: string;
  sections: AccordionSection[];
  onChange: (sections: AccordionSection[]) => void;
  labels: Labels;
}) {
  function updateSection(
    sectionId: string,
    patch: Partial<Pick<AccordionSection, "title" | "body">>
  ) {
    onChange(
      sections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section
      )
    );
  }

  function removeSection(sectionId: string) {
    onChange(sections.filter((section) => section.id !== sectionId));
  }

  function addSection() {
    onChange([...sections, createAccordionSection()]);
  }

  return (
    <section className="mt-10 border-t border-[#e5dbcf] pt-8">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-stone-950">
            {labels.accordionContent}
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-stone-600">
            {labels.accordionDescription}
          </p>
        </div>

        <button
          type="button"
          onClick={addSection}
          className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-800 hover:bg-stone-50"
        >
          {labels.addAccordionItem}
        </button>
      </div>

      {sections.length ? (
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className="rounded-[1.5rem] border border-[#ddcfbf] bg-white/85 p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="text-xs uppercase tracking-[0.22em] text-stone-500">
                  {labels.accordionContent} {index + 1}
                </div>

                <button
                  type="button"
                  onClick={() => removeSection(section.id)}
                  className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
                >
                  {labels.removeAccordionItem}
                </button>
              </div>

              <label className="mb-4 block space-y-1">
                <span className="block text-xs font-medium uppercase tracking-[0.16em] text-stone-500">
                  {labels.accordionItemTitle}
                </span>
                <input
                  type="text"
                  value={section.title}
                  onChange={(event) =>
                    updateSection(section.id, { title: event.target.value })
                  }
                  placeholder={labels.accordionItemTitlePlaceholder}
                  className="w-full rounded-2xl border border-[#d8c6b8] px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-500"
                />
              </label>

              <ClassicTextEditor
                contentItemId={contentItemId}
                value={section.body}
                onChange={(value) => updateSection(section.id, { body: value })}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.25rem] border border-dashed border-[#d8c6b8] bg-[#faf5ef] px-5 py-6 text-sm text-stone-500">
          {labels.accordionEmpty}
        </div>
      )}
    </section>
  );
}
