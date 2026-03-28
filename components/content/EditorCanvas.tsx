import TitleField from "./TitleField";
import ClassicTextEditor from "./ClassicTextEditor";
import AccordionSectionsEditor from "./AccordionSectionsEditor";
import type { AccordionSection } from "@/lib/content/accordionSections";
import { getAppMessages } from "@/lib/i18n/appMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";

type Props = {
  contentItemId: string;
  title: string;
  body: string;
  accordionSections: AccordionSection[];
  language: UiLanguage;
  onChange: (patch: {
    title?: string;
    body?: string;
    accordion_sections?: AccordionSection[];
  }) => void;
};

export default function EditorCanvas({
  contentItemId,
  title,
  body,
  accordionSections,
  language,
  onChange,
}: Props) {
  const t = getAppMessages(language).metadata;

  return (
    <main className="min-w-0 px-6 py-8 xl:px-10 xl:py-10">
      <TitleField value={title} onChange={(v) => onChange({ title: v })} />

      <ClassicTextEditor
        contentItemId={contentItemId}
        value={body}
        onChange={(v) => onChange({ body: v })}
      />

      <AccordionSectionsEditor
        contentItemId={contentItemId}
        sections={accordionSections}
        onChange={(sections) => onChange({ accordion_sections: sections })}
        labels={{
          accordionContent: t.accordionContent,
          accordionDescription: t.accordionDescription,
          addAccordionItem: t.addAccordionItem,
          accordionItemTitle: t.accordionItemTitle,
          accordionItemTitlePlaceholder: t.accordionItemTitlePlaceholder,
          accordionEmpty: t.accordionEmpty,
          removeAccordionItem: t.removeAccordionItem,
        }}
      />
    </main>
  );
}
