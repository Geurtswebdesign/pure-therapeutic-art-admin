import "server-only";
import { JSDOM } from "jsdom";
import { normalizeLegacyOfficeListsInBody } from "@/lib/content/legacyOfficeLists";
import { buildInAppPdfViewerHref, isPdfHref } from "@/lib/content/pdf-links";

function hasVisibleNodeContent(element: Element): boolean {
  if (element.querySelector("img")) {
    return true;
  }

  const normalizedText = (element.textContent ?? "")
    .replace(/\u00a0/g, " ")
    .trim();

  return normalizedText.length > 0;
}

/**
 * Normalize editor-generated HTML into a strict, public-safe format.
 * Deterministic and server-only.
 */
export function normalizeHtml(input: string): string {
  if (!input) return "";

  try {
    const dom = new JSDOM(input);
    const doc = dom.window.document;
    const body = doc.body;

    normalizeLegacyOfficeListsInBody(body, doc);

    /**
     * 1️⃣ Remove empty paragraphs
     */
    body
      .querySelectorAll<HTMLParagraphElement>("p")
      .forEach((p: HTMLParagraphElement) => {
        if (hasVisibleNodeContent(p)) {
          return;
        }

        const previous = p.previousElementSibling;
        const next = p.nextElementSibling;
        const keepAsSpacer =
          previous !== null &&
          next !== null &&
          hasVisibleNodeContent(previous) &&
          hasVisibleNodeContent(next);

        if (keepAsSpacer) {
          p.replaceChildren(doc.createElement("br"));
          return;
        }

        p.remove();
      });

    /**
     * 2️⃣ Normalize single image figures
     */
    body
      .querySelectorAll<HTMLElement>("figure")
      .forEach((figure: HTMLElement) => {
        const img = figure.querySelector("img");
        if (!img) return;

        const captionEl =
          figure.querySelector(".image-caption") ??
          figure.querySelector("figcaption");

        const newFigure = doc.createElement("figure");
        newFigure.className = "image";

        const alignClass = Array.from(figure.classList).find((cls: string) =>
          cls.startsWith("align")
        );
        if (alignClass) {
          newFigure.classList.add(alignClass);
        }

        const cleanImg = img.cloneNode(true) as HTMLImageElement;
        cleanImg.removeAttribute("style");
        newFigure.appendChild(cleanImg);

        if (captionEl?.textContent?.trim()) {
          const figcaption = doc.createElement("figcaption");
          figcaption.textContent = captionEl.textContent.trim();
          newFigure.appendChild(figcaption);
        }

        figure.replaceWith(newFigure);
      });

    /**
     * 3️⃣ Normalize galleries
     */
    body
      .querySelectorAll<HTMLElement>(".image-gallery")
      .forEach((gallery: HTMLElement) => {
        const images = gallery.querySelectorAll<HTMLImageElement>("img");
        if (!images.length) return;

        const figure = doc.createElement("figure");
        figure.className = "gallery";

        const columns = gallery.getAttribute("data-columns");
        if (columns) {
          figure.setAttribute("data-columns", columns);
        }

        images.forEach((img: HTMLImageElement) => {
          const cleanImg = img.cloneNode(true) as HTMLImageElement;
          cleanImg.removeAttribute("style");
          figure.appendChild(cleanImg);
        });

        gallery.replaceWith(figure);
      });

    /**
     * 4️⃣ Rewrite PDF links to the internal viewer route
     */
    body
      .querySelectorAll<HTMLAnchorElement>("a[href]")
      .forEach((link: HTMLAnchorElement) => {
        const href = link.getAttribute("href")?.trim();
        if (!href || !isPdfHref(href)) {
          return;
        }

        link.setAttribute("href", buildInAppPdfViewerHref(href));
        link.removeAttribute("target");
        link.removeAttribute("download");
        link.removeAttribute("rel");
      });

    return body.innerHTML;
  } catch (error) {
    console.error("normalizeHtml failed, returning original markup", error);
    return input;
  }
}

export function normalizeImages(input: string): string {
  return normalizeHtml(input);
}
