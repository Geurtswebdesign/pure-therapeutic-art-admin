import TitleField from "./TitleField";
import ClassicTextEditor from "./ClassicTextEditor";

type Props = {
  contentItemId: string;
  title: string;
  body: string;
  onChange: (patch: { title?: string; body?: string }) => void;
};

export default function EditorCanvas({
  contentItemId,
  title,
  body,
  onChange,
}: Props) {
  return (
    <main className="flex-1 p-10">
      <TitleField value={title} onChange={(v) => onChange({ title: v })} />

      <ClassicTextEditor
        contentItemId={contentItemId}
        value={body}
        onChange={(v) => onChange({ body: v })}
      />
    </main>
  );
}
