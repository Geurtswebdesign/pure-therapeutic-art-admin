"use client";

import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Node } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import type { DOMOutputSpec } from "@tiptap/pm/model";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { uploadImageClient } from "@/lib/content/uploadClient";

type UploadedImage = {
  alt: string;
  src: string;
};

type Props = {
  contentItemId: string;
  value: string;
  onChange: (value: string) => void;
  height?: number;
};

function normalizeEditorValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "<p></p>") {
    return "";
  }

  return value;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function buildImageHtml(image: UploadedImage, caption = "") {
  const captionHtml = caption.trim()
    ? `<figcaption>${escapeHtml(caption.trim())}</figcaption>`
    : "";

  return `<figure class="image aligncenter"><img src="${escapeAttribute(image.src)}" alt="${escapeAttribute(image.alt)}" />${captionHtml}</figure><p></p>`;
}

function buildGalleryHtml(images: UploadedImage[], columns = 3) {
  if (!images.length) {
    return "";
  }

  const imageHtml = images
    .map(
      (image) =>
        `<img src="${escapeAttribute(image.src)}" alt="${escapeAttribute(image.alt)}" />`
    )
    .join("");

  return `<figure class="gallery" data-columns="${columns}">${imageHtml}</figure><p></p>`;
}

const FigureImage = Node.create({
  name: "figureImage",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (element) =>
          element.querySelector("img")?.getAttribute("src") ?? "",
      },
      alt: {
        default: "",
        parseHTML: (element) =>
          element.querySelector("img")?.getAttribute("alt") ?? "",
      },
      caption: {
        default: "",
        parseHTML: (element) =>
          element.querySelector("figcaption")?.textContent?.trim() ?? "",
      },
      align: {
        default: "aligncenter",
        parseHTML: (element) => {
          const alignClass = Array.from(element.classList).find((className) =>
            className.startsWith("align")
          );

          return alignClass ?? "aligncenter";
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure",
        getAttrs: (element) =>
          element instanceof HTMLElement &&
          element.classList.contains("image")
            ? null
            : false,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const classes = ["image"];
    if (typeof HTMLAttributes.align === "string" && HTMLAttributes.align.trim()) {
      classes.push(HTMLAttributes.align.trim());
    }

    const content: DOMOutputSpec[] = [
      [
        "img",
        {
          src: HTMLAttributes.src,
          alt: HTMLAttributes.alt || "",
        },
      ],
    ];

    if (typeof HTMLAttributes.caption === "string" && HTMLAttributes.caption.trim()) {
      content.push(["figcaption", {}, HTMLAttributes.caption]);
    }

    return ["figure", { class: classes.join(" ") }, ...content];
  },
});

const ImageGallery = Node.create({
  name: "imageGallery",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      columns: {
        default: 3,
        parseHTML: (element) => {
          const rawValue =
            element.getAttribute("data-columns") ??
            element.querySelector("[data-columns]")?.getAttribute("data-columns") ??
            "3";
          const numericValue = Number(rawValue);

          return Number.isFinite(numericValue) && numericValue > 0
            ? numericValue
            : 3;
        },
      },
      images: {
        default: [] as UploadedImage[],
        parseHTML: (element) =>
          Array.from(element.querySelectorAll("img"))
            .map((image) => ({
              src: image.getAttribute("src") ?? "",
              alt: image.getAttribute("alt") ?? "",
            }))
            .filter((image) => image.src),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure",
        getAttrs: (element) =>
          element instanceof HTMLElement &&
          element.classList.contains("gallery")
            ? null
            : false,
      },
      {
        tag: "div",
        getAttrs: (element) =>
          element instanceof HTMLElement &&
          element.classList.contains("image-gallery")
            ? null
            : false,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const images = Array.isArray(HTMLAttributes.images)
      ? (HTMLAttributes.images as UploadedImage[]).filter(
          (image) => typeof image?.src === "string" && image.src.trim()
        )
      : [];

    const content: DOMOutputSpec[] = images.map((image) => [
      "img",
      {
        src: image.src,
        alt: image.alt || "",
      },
    ]);

    return [
      "figure",
      {
        class: "gallery",
        "data-columns": String(HTMLAttributes.columns || 3),
      },
      ...content,
    ];
  },
});

function ToolbarButton({
  active = false,
  children,
  disabled = false,
  onClick,
}: {
  active?: boolean;
  children: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="classic-text-editor__button"
      data-active={active ? "true" : "false"}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function getCurrentFormat(editor: Editor | null) {
  if (!editor) return "paragraph";
  if (editor.isActive("heading", { level: 2 })) return "h2";
  if (editor.isActive("heading", { level: 3 })) return "h3";
  if (editor.isActive("heading", { level: 4 })) return "h4";
  return "paragraph";
}

export default function ClassicTextEditor({
  contentItemId,
  value,
  onChange,
  height = 400,
}: Props) {
  const safeValue = value || "";
  const containerRef = useRef<HTMLDivElement | null>(null);
  const latestValueRef = useRef(safeValue);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [sourceValue, setSourceValue] = useState(safeValue);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Underline,
      Link.configure({
        autolink: true,
        openOnClick: false,
        protocols: ["http", "https", "mailto", "tel"],
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Image,
      FigureImage,
      ImageGallery,
    ],
    editorProps: {
      attributes: {
        class: "classic-text-editor__content",
      },
    },
    content: safeValue,
    onUpdate: ({ editor: currentEditor }) => {
      const nextValue = normalizeEditorValue(currentEditor.getHTML());
      latestValueRef.current = nextValue;
      setSourceValue(nextValue);
      onChange(nextValue);
    },
  });

  useEffect(() => {
    const nextValue = safeValue;
    setSourceValue(nextValue);

    if (!editor) {
      latestValueRef.current = nextValue;
      return;
    }

    if (nextValue === latestValueRef.current) {
      return;
    }

    latestValueRef.current = nextValue;

    if (!isSourceMode) {
      editor.commands.setContent(nextValue, { emitUpdate: false });
    }
  }, [editor, isSourceMode, safeValue]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const container = containerRef.current;
      const isEditorFullscreen =
        container !== null && document.fullscreenElement === container;

      setIsFullscreen(isEditorFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  function updateSourceValue(nextValue: string) {
    latestValueRef.current = nextValue;
    setSourceValue(nextValue);
    onChange(nextValue);
  }

  async function toggleFullscreen() {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement === container) {
      await document.exitFullscreen();
      return;
    }

    await container.requestFullscreen();
  }

  function applyFormat(nextFormat: string) {
    if (!editor) return;

    const chain = editor.chain().focus();

    switch (nextFormat) {
      case "h2":
        chain.toggleHeading({ level: 2 }).run();
        break;
      case "h3":
        chain.toggleHeading({ level: 3 }).run();
        break;
      case "h4":
        chain.toggleHeading({ level: 4 }).run();
        break;
      default:
        chain.setParagraph().run();
        break;
    }
  }

  function toggleSourceMode() {
    if (!editor) {
      setIsSourceMode((currentValue) => !currentValue);
      return;
    }

    if (isSourceMode) {
      editor.commands.setContent(sourceValue, { emitUpdate: false });
      latestValueRef.current = sourceValue;
    } else {
      const nextValue = normalizeEditorValue(editor.getHTML());
      latestValueRef.current = nextValue;
      setSourceValue(nextValue);
    }

    setIsSourceMode((currentValue) => !currentValue);
  }

  function handleSourceChange(event: ChangeEvent<HTMLTextAreaElement>) {
    updateSourceValue(event.target.value);
  }

  function handleSetLink() {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href ?? "";
    const nextUrl = window.prompt("Voer de link in", previousUrl);

    if (nextUrl === null) {
      return;
    }

    const trimmedUrl = nextUrl.trim();

    if (!trimmedUrl) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    const normalizedUrl =
      trimmedUrl.startsWith("http://") ||
      trimmedUrl.startsWith("https://") ||
      trimmedUrl.startsWith("/") ||
      trimmedUrl.startsWith("mailto:") ||
      trimmedUrl.startsWith("tel:")
        ? trimmedUrl
        : `https://${trimmedUrl}`;

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: normalizedUrl })
      .run();
  }

  async function pickFiles(options: { multiple: boolean }) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = options.multiple;

    return new Promise<File[]>((resolve) => {
      input.onchange = () => {
        resolve(input.files ? Array.from(input.files) : []);
      };

      input.click();
    });
  }

  async function uploadImages(files: File[]) {
    const uploaded: UploadedImage[] = [];

    for (const file of files) {
      const src = await uploadImageClient(file, contentItemId);
      uploaded.push({
        src,
        alt: "",
      });
    }

    return uploaded;
  }

  function insertImageMarkup(image: UploadedImage, caption = "") {
    if (isSourceMode || !editor) {
      updateSourceValue(`${sourceValue}${buildImageHtml(image, caption)}`);
      return;
    }

    editor
      .chain()
      .focus()
      .insertContent([
        {
          type: "figureImage",
          attrs: {
            src: image.src,
            alt: image.alt,
            caption,
            align: "aligncenter",
          },
        },
        {
          type: "paragraph",
        },
      ])
      .run();
  }

  function insertGalleryMarkup(images: UploadedImage[]) {
    if (!images.length) {
      return;
    }

    if (isSourceMode || !editor) {
      updateSourceValue(`${sourceValue}${buildGalleryHtml(images)}`);
      return;
    }

    editor
      .chain()
      .focus()
      .insertContent([
        {
          type: "imageGallery",
          attrs: {
            columns: 3,
            images,
          },
        },
        {
          type: "paragraph",
        },
      ])
      .run();
  }

  async function handleSingleImageUpload() {
    setError(null);

    try {
      setIsUploading(true);
      const files = await pickFiles({ multiple: false });
      if (!files.length) return;

      const [image] = await uploadImages(files);
      const caption = window.prompt("Bijschrift (optioneel)", "") ?? "";
      insertImageMarkup(image, caption);
    } catch (uploadError) {
      console.error("Single image upload failed", uploadError);
      setError("Afbeelding uploaden mislukt.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleGalleryUpload() {
    setError(null);

    try {
      setIsUploading(true);
      const files = await pickFiles({ multiple: true });
      if (!files.length) return;

      const uploadedImages = await uploadImages(files);
      insertGalleryMarkup(uploadedImages);
    } catch (uploadError) {
      console.error("Gallery upload failed", uploadError);
      setError("Galerij uploaden mislukt.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className="classic-text-editor"
      data-fullscreen={isFullscreen ? "true" : "false"}
    >
      <div className="classic-text-editor__toolbar">
        <div className="classic-text-editor__group">
          <select
            className="classic-text-editor__select"
            disabled={!editor || isSourceMode}
            value={getCurrentFormat(editor)}
            onChange={(event) => applyFormat(event.target.value)}
          >
            <option value="paragraph">Paragraaf</option>
            <option value="h2">Kop 2</option>
            <option value="h3">Kop 3</option>
            <option value="h4">Kop 4</option>
          </select>
        </div>

        <div className="classic-text-editor__group">
          <ToolbarButton
            active={editor?.isActive("bold")}
            disabled={!editor || isSourceMode}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            Vet
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("italic")}
            disabled={!editor || isSourceMode}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            Cursief
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("underline")}
            disabled={!editor || isSourceMode}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            Onderstrepen
          </ToolbarButton>
        </div>

        <div className="classic-text-editor__group">
          <ToolbarButton
            active={editor?.isActive({ textAlign: "left" })}
            disabled={!editor || isSourceMode}
            onClick={() => editor?.chain().focus().setTextAlign("left").run()}
          >
            Links
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive({ textAlign: "center" })}
            disabled={!editor || isSourceMode}
            onClick={() => editor?.chain().focus().setTextAlign("center").run()}
          >
            Midden
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive({ textAlign: "right" })}
            disabled={!editor || isSourceMode}
            onClick={() => editor?.chain().focus().setTextAlign("right").run()}
          >
            Rechts
          </ToolbarButton>
        </div>

        <div className="classic-text-editor__group">
          <ToolbarButton
            active={editor?.isActive("bulletList")}
            disabled={!editor || isSourceMode}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            Lijst
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("orderedList")}
            disabled={!editor || isSourceMode}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            Nummering
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("link")}
            disabled={!editor || isUploading}
            onClick={handleSetLink}
          >
            Link
          </ToolbarButton>
        </div>

        <div className="classic-text-editor__group">
          <ToolbarButton
            disabled={isUploading}
            onClick={handleSingleImageUpload}
          >
            {isUploading ? "Uploaden..." : "Media toevoegen"}
          </ToolbarButton>
          <ToolbarButton
            disabled={isUploading}
            onClick={handleGalleryUpload}
          >
            Galerij
          </ToolbarButton>
        </div>

        <div className="classic-text-editor__group classic-text-editor__group--end">
          <ToolbarButton
            active={isSourceMode}
            disabled={false}
            onClick={toggleSourceMode}
          >
            HTML
          </ToolbarButton>
          <ToolbarButton
            active={isFullscreen}
            disabled={false}
            onClick={() => {
              void toggleFullscreen();
            }}
          >
            Volledig scherm
          </ToolbarButton>
        </div>
      </div>

      {error ? (
        <div className="classic-text-editor__error">{error}</div>
      ) : null}

      <div
        className="classic-text-editor__surface"
        style={{ minHeight: `${height}px` }}
      >
        {isSourceMode ? (
          <textarea
            value={sourceValue}
            className="classic-text-editor__source"
            onChange={handleSourceChange}
            style={{ minHeight: `${height}px` }}
          />
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>
    </div>
  );
}
