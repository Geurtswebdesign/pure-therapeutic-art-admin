"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";

type Props = {
  title: string;
  epubUrl: string;
  backHref: string;
};

type RenditionLocation = {
  start?: {
    displayed?: {
      page?: number;
      total?: number;
    };
  };
};

export default function AccountProductEbookReader({
  title,
  epubUrl,
  backHref,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renditionRef = useRef<any>(null);
  const bookRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageLabel, setPageLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initReader() {
      try {
        setIsLoading(true);
        setError(null);

        const module = await import("epubjs");
        const createBook = (module as any).default ?? module;

        if (!containerRef.current) {
          return;
        }

        const book = createBook(epubUrl);
        const rendition = book.renderTo(containerRef.current, {
          width: "100%",
          height: "72vh",
          spread: "none",
          flow: "scrolled-doc",
        });

        rendition.on("relocated", (location: RenditionLocation) => {
          const current = location.start?.displayed?.page;
          const total = location.start?.displayed?.total;
          if (typeof current === "number" && typeof total === "number") {
            setPageLabel(`Pagina ${current} van ${total}`);
          } else {
            setPageLabel(null);
          }
        });

        await book.ready;
        await rendition.display();

        if (cancelled) {
          rendition.destroy();
          book.destroy?.();
          return;
        }

        bookRef.current = book;
        renditionRef.current = rendition;
        setIsLoading(false);
      } catch (nextError) {
        console.error("[AccountProductEbookReader]", nextError);
        if (!cancelled) {
          setError(
            "Het e-book kon niet worden geopend. Controleer of het EPUB-bestand goed is gekoppeld."
          );
          setIsLoading(false);
        }
      }
    }

    initReader();

    return () => {
      cancelled = true;
      try {
        renditionRef.current?.destroy?.();
      } catch {}
      try {
        bookRef.current?.destroy?.();
      } catch {}
      renditionRef.current = null;
      bookRef.current = null;
    };
  }, [epubUrl]);

  function goPrevious() {
    renditionRef.current?.prev?.();
  }

  function goNext() {
    renditionRef.current?.next?.();
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-[#e5d8ca] bg-white/90 p-4 shadow-sm">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#6f5949]">
            E-book reader
          </p>
          <h2 className="font-serif text-[1.65rem] leading-none text-stone-950">
            {title}
          </h2>
          {pageLabel ? (
            <p className="text-sm text-[#6b5d50]">{pageLabel}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-full border border-[#decfbe] bg-[#fcf6f1] px-4 py-2 text-sm font-medium text-[#8a5f49]"
          >
            Terug naar EBooks
          </Link>
          <button
            type="button"
            onClick={goPrevious}
            className="inline-flex items-center gap-2 rounded-full border border-[#decfbe] bg-white px-4 py-2 text-sm font-medium text-[#8a5f49]"
          >
            <ChevronLeft size={16} strokeWidth={1.8} />
            Vorige
          </button>
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-2 rounded-full border border-[#decfbe] bg-white px-4 py-2 text-sm font-medium text-[#8a5f49]"
          >
            Volgende
            <ChevronRight size={16} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-[#e5d8ca] bg-white/90 p-3 shadow-sm">
        {isLoading ? (
          <div className="flex min-h-[72vh] items-center justify-center gap-3 rounded-[1.2rem] bg-[#faf4ed] text-[#7f5b4a]">
            <LoaderCircle className="animate-spin" size={18} strokeWidth={1.8} />
            E-book wordt geladen...
          </div>
        ) : null}

        {error ? (
          <div className="flex min-h-[32vh] items-center justify-center rounded-[1.2rem] bg-[#faf4ed] px-6 text-center text-sm leading-6 text-[#7f5b4a]">
            {error}
          </div>
        ) : null}

        <div
          ref={containerRef}
          className={`${isLoading || error ? "hidden" : "block"} min-h-[72vh] overflow-hidden rounded-[1.2rem] bg-[#fbf8f2]`}
        />
      </div>
    </section>
  );
}
