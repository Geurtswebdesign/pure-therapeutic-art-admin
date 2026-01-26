import "server-only";
import { JSDOM } from "jsdom";

/**
 * Normalize editor-generated HTML into a strict, public-safe format.
 * Deterministic and server-only.
 */
export function normalizeHtml(input: string): string {
  if (!input) return "";

  const dom = new JSDOM(input);
  const doc = dom.window.document;
  const body = doc.body;

  /**
   * 1️⃣ Remove empty paragraphs
   */
  body
    .querySelectorAll<HTMLParagraphElement>("p")
    .forEach((p: HTMLParagraphElement) => {
    const hasText = p.textContent?.trim();
    const hasImage = p.querySelector("img");

    if (!hasText && !hasImage) {
      p.remove();
    }
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

  return body.innerHTML;
}

export function normalizeImages(input: string): string {
  return normalizeHtml(input);
}
