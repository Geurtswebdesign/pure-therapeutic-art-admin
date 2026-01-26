"use client";

import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
};

/**
 * Draft-only paragraph block.
 *
 * NOTE: This component does not persist.
 * Saving must be handled by the parent “save-all” flow.
 */
export default function ParagraphBlock({
  value,
  onChange,
  placeholder = "Begin met schrijven…",
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Autosize (WordPress-achtig)
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full resize-none bg-transparent outline-none text-base leading-relaxed"
    />
  );
}
