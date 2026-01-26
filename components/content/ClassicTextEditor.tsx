"use client";

import dynamic from "next/dynamic";
import { uploadImageClient } from "@/lib/content/uploadClient";

const TinyEditor = dynamic(
  () => import("@tinymce/tinymce-react").then((m) => m.Editor),
  { ssr: false }
);

/**
 * Minimale editor interface
 * (alleen wat we daadwerkelijk gebruiken)
 */
type TinyEditorInstance = {
  ui: {
    registry: {
      addButton: (
        name: string,
        config: {
          text: string;
          onAction: () => void;
        }
      ) => void;
    };
  };
  insertContent: (html: string) => void;
  selection: {
    select: (node: Node) => void;
  };
  on: (event: string, callback: (e: MouseEvent) => void) => void;
};

type Props = {
  contentItemId: string;
  value: string;
  onChange: (value: string) => void;
};

export default function ClassicTextEditor({
  contentItemId,
  value,
  onChange,
}: Props) {
  const safeValue = value || "";

  return (
    <TinyEditor
      apiKey={process.env.NEXT_PUBLIC_TINYMCE_KEY}
      value={safeValue}
      init={{
        height: 400,
        menubar: false,
        branding: false,

        plugins: ["lists", "link", "code", "fullscreen"],

        toolbar:
          "undo redo | formatselect | bold italic underline | " +
          "alignleft aligncenter alignright | bullist numlist | " +
          "link mediaUpload galleryUpload | code fullscreen",

        forced_root_block: "p",

        extended_valid_elements:
          "figure[class],figcaption[class]" +
          "p[class|data-caption],img[src|alt|width|height|style]",

        valid_children: "+body[figure],+figure[figcaption]",

        object_resizing: false,
        remove_trailing_brs: false,

        setup: (editor: TinyEditorInstance) => {
          editor.ui.registry.addButton("mediaUpload", {
            text: "Media toevoegen",
            onAction: () => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";

              input.onchange = async () => {
                if (!input.files?.length) return;

                const file = input.files[0];
                const url = await uploadImageClient(file, contentItemId);

                editor.insertContent(`
                  <figure class="image aligncenter">
                    <img src="${url}" alt="" />
                    <figcaption>Bijschrift (optioneel)</figcaption>
                  </figure>
                `);
              };

              input.click();
            },
          });

          editor.on("click", (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            if (target?.classList.contains("image-caption")) {
              editor.selection.select(target);
            }
          });

          editor.ui.registry.addButton("galleryUpload", {
            text: "Galerij",
            onAction: () => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.multiple = true;

              input.onchange = async () => {
                if (!input.files?.length) return;

                const files = Array.from(input.files);
                let html = `<div class="image-gallery" data-columns="3">`;

                for (const file of files) {
                  const url = await uploadImageClient(file, contentItemId);
                  html += `
                    <figure class="gallery" data-columns="3">
                      <img src="${url}" alt="" />
                      <figcaption>Bijschrift (optioneel)</figcaption>
                    </figure>
                  `;
                }

                html += `</div><p></p>`;
                editor.insertContent(html);
              };

              input.click();
            },
          });
        },
      }}
      onEditorChange={(content: string) => {
        onChange(content); // draft-only, parent zet dirty=true
      }}
    />
  );
}
