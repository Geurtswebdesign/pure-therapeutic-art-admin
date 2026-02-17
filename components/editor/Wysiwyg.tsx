
// Legacy/bridge WYSIWYG component.
// Used as an abstraction layer while migrating to block-based editor.
// Do not extend without reviewing new editor architecture.

"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

export default function Wysiwyg({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    immediatelyRender: false, // ✅ essentieel bij SSR
    editorProps: {
      attributes: {
        class:
          "min-h-[320px] bg-white border border-gray-300 rounded p-3 focus:outline-none",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Synchroniseer content bij locale switch
  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(value || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          className="px-2 py-1 border rounded"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          type="button"
          className="px-2 py-1 border rounded"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>
        <button
          type="button"
          className="px-2 py-1 border rounded"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
