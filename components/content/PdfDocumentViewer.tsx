"use client";

import { useEffect, useRef, useState } from "react";

type PdfJsDocument = {
  destroy?: () => Promise<void> | void;
  getPage: (pageNumber: number) => Promise<{
    getViewport: (options: { scale: number }) => { width: number; height: number };
    render: (options: {
      canvasContext: CanvasRenderingContext2D;
      viewport: { width: number; height: number };
      transform?: [number, number, number, number, number, number];
    }) => { promise: Promise<void> };
  }>;
  numPages: number;
};

type PdfJsLibrary = {
  GlobalWorkerOptions: {
    workerSrc: string;
  };
  getDocument: (src: { url: string; withCredentials: boolean } | string) => {
    destroy?: () => Promise<void> | void;
    promise: Promise<PdfJsDocument>;
  };
};

declare global {
  interface Window {
    pdfjsLib?: PdfJsLibrary;
  }
}

const PDF_JS_SCRIPT_SRC =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDF_JS_WORKER_SRC =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const MIN_ZOOM_LEVEL = 0.75;
const MAX_ZOOM_LEVEL = 3;
const ZOOM_STEP = 0.25;

function clampZoomLevel(value: number) {
  return Math.min(MAX_ZOOM_LEVEL, Math.max(MIN_ZOOM_LEVEL, value));
}

function loadPdfJs() {
  return new Promise<PdfJsLibrary>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("PDF.js is alleen beschikbaar in de browser."));
      return;
    }

    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-pdfjs-loader="true"]'
    );

    const handleLoad = () => {
      if (window.pdfjsLib) {
        resolve(window.pdfjsLib);
        return;
      }

      reject(new Error("PDF.js kon niet geladen worden."));
    };

    const handleError = () => {
      reject(new Error("PDF.js script laden mislukt."));
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = PDF_JS_SCRIPT_SRC;
    script.async = true;
    script.dataset.pdfjsLoader = "true";
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    document.head.appendChild(script);
  });
}

export default function PdfDocumentViewer({
  src,
  loadingLabel,
  errorLabel,
  zoomOutLabel,
  zoomInLabel,
  zoomResetLabel,
}: {
  src: string;
  loadingLabel: string;
  errorLabel: string;
  zoomOutLabel: string;
  zoomInLabel: string;
  zoomResetLabel: string;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRefs = useRef<Array<HTMLCanvasElement | null>>([]);
  const pdfDocumentRef = useRef<PdfJsDocument | null>(null);
  const loadingTaskRef = useRef<{ destroy?: () => Promise<void> | void } | null>(
    null
  );
  const renderRunRef = useRef(0);
  const [pageCount, setPageCount] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    const updateWidth = () => {
      const nextWidth = Math.floor(element.clientWidth);
      setContainerWidth((currentWidth) =>
        currentWidth === nextWidth ? currentWidth : nextWidth
      );
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setPageCount(0);
    canvasRefs.current = [];

    const previousDocument = pdfDocumentRef.current;
    const previousTask = loadingTaskRef.current;
    pdfDocumentRef.current = null;
    loadingTaskRef.current = null;

    void previousDocument?.destroy?.();
    void previousTask?.destroy?.();

    async function load() {
      try {
        const pdfjs = await loadPdfJs();
        pdfjs.GlobalWorkerOptions.workerSrc = PDF_JS_WORKER_SRC;

        const loadingTask = pdfjs.getDocument({
          url: src,
          withCredentials: false,
        });

        loadingTaskRef.current = loadingTask;

        const pdfDocument = await loadingTask.promise;
        if (cancelled) {
          void pdfDocument.destroy?.();
          return;
        }

        pdfDocumentRef.current = pdfDocument;
        setPageCount(pdfDocument.numPages);
      } catch (error) {
        console.error("PDF laden mislukt", error);
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    if (pageCount === 0 || containerWidth === 0) {
      return;
    }

    const pdfDocument = pdfDocumentRef.current;
    if (!pdfDocument) {
      return;
    }
    const activeDocument: PdfJsDocument = pdfDocument;

    let cancelled = false;
    const currentRun = renderRunRef.current + 1;
    renderRunRef.current = currentRun;
    setStatus("loading");

    async function renderAllPages() {
      try {
        for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
          if (cancelled || renderRunRef.current !== currentRun) {
            return;
          }

          const page = await activeDocument.getPage(pageIndex + 1);
          const baseViewport = page.getViewport({ scale: 1 });
          const cssScale = (containerWidth / baseViewport.width) * zoomLevel;
          const viewport = page.getViewport({ scale: cssScale });
          const outputScale = window.devicePixelRatio || 1;
          const canvas = canvasRefs.current[pageIndex];
          const context = canvas?.getContext("2d", { alpha: false });

          if (!canvas || !context) {
            continue;
          }

          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;

          context.setTransform(1, 0, 0, 1, 0, 0);
          context.clearRect(0, 0, canvas.width, canvas.height);

          await page.render({
            canvasContext: context,
            viewport,
            transform:
              outputScale === 1
                ? undefined
                : [outputScale, 0, 0, outputScale, 0, 0],
          }).promise;
        }

        if (!cancelled && renderRunRef.current === currentRun) {
          setStatus("ready");
        }
      } catch (error) {
        console.error("PDF renderen mislukt", error);
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    void renderAllPages();

    return () => {
      cancelled = true;
    };
  }, [containerWidth, pageCount, zoomLevel]);

  return (
    <div ref={wrapperRef} className="w-full">
      <div className="mb-4 flex items-center justify-end gap-2">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-lg text-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => setZoomLevel((current) => clampZoomLevel(current - ZOOM_STEP))}
          aria-label={zoomOutLabel}
          disabled={zoomLevel <= MIN_ZOOM_LEVEL}
        >
          -
        </button>
        <button
          type="button"
          className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => setZoomLevel(1)}
          aria-label={zoomResetLabel}
          disabled={Math.abs(zoomLevel - 1) < 0.01}
        >
          {Math.round(zoomLevel * 100)}%
        </button>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-lg text-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => setZoomLevel((current) => clampZoomLevel(current + ZOOM_STEP))}
          aria-label={zoomInLabel}
          disabled={zoomLevel >= MAX_ZOOM_LEVEL}
        >
          +
        </button>
      </div>

      {status === "loading" ? (
        <div className="rounded-[1.25rem] border border-stone-200 bg-white px-5 py-6 text-sm text-stone-600">
          {loadingLabel}
        </div>
      ) : null}

      {status === "error" ? (
        <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-700">
          {errorLabel}
        </div>
      ) : null}

      <div
        className={`space-y-4 overflow-x-auto pb-1 ${status === "ready" ? "block" : "hidden"}`}
        aria-live="polite"
        style={{ touchAction: "pan-x pan-y pinch-zoom" }}
      >
        {Array.from({ length: pageCount }).map((_, pageIndex) => (
          <div
            key={`pdf-page-${pageIndex + 1}`}
            className="min-w-fit overflow-hidden rounded-[1.25rem] border border-stone-200 bg-white shadow-sm"
          >
            <canvas
              ref={(node) => {
                canvasRefs.current[pageIndex] = node;
              }}
              className="block h-auto max-w-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
