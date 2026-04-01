type ListTag = "ol" | "ul";
const LEADING_LIST_MARKER_PATTERN = /^[\s\u00a0]*[§•▪■●\-–—]+[\s\u00a0]+/;

function normalizeWhitespace(value: string) {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function roundIndent(value: number) {
  return Math.round(value * 10) / 10;
}

function isLegacyOfficeListElement(element: Element) {
  const style = element.getAttribute("style") ?? "";
  if (/mso-list:/i.test(style)) {
    return true;
  }

  return Boolean(element.querySelector('[style*="mso-list: Ignore"]'));
}

function getLegacyOfficeListIndent(element: Element) {
  const style = element.getAttribute("style") ?? "";
  const marginMatch = style.match(/margin-left:\s*(-?\d+(?:\.\d+)?)(pt|px)?/i);

  if (marginMatch) {
    const numericValue = Number(marginMatch[1]);
    if (!Number.isFinite(numericValue)) {
      return 0;
    }

    const unit = (marginMatch[2] ?? "pt").toLowerCase();
    return roundIndent(unit === "px" ? numericValue * 0.75 : numericValue);
  }

  const levelMatch = style.match(/level(\d+)/i);
  if (levelMatch) {
    const numericLevel = Number(levelMatch[1]);
    if (Number.isFinite(numericLevel) && numericLevel > 1) {
      return roundIndent((numericLevel - 1) * 18);
    }
  }

  return 0;
}

function getLegacyOfficeListTag(element: Element): ListTag {
  const marker = element.querySelector('[style*="mso-list: Ignore"]');
  const markerText = normalizeWhitespace(marker?.textContent ?? "").replace(/\s+/g, "");

  if (/^(\d+[\.\)]|[a-zA-Z][\.\)])$/.test(markerText)) {
    return "ol";
  }

  return "ul";
}

function removeCommentNodes(root: Element) {
  const stack: Element[] = [root];

  while (stack.length) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    for (const child of Array.from(current.childNodes)) {
      if (child.nodeType === 8) {
        child.parentNode?.removeChild(child);
        continue;
      }

      if (child.nodeType === 1) {
        stack.push(child as Element);
      }
    }
  }
}

function stripOfficeAttributes(root: Element) {
  for (const element of [root, ...Array.from(root.querySelectorAll("*"))]) {
    element.removeAttribute("class");
    element.removeAttribute("lang");
    element.removeAttribute("style");
  }
}

function pruneEmptyInlineElements(root: Element) {
  let changed = true;

  while (changed) {
    changed = false;

    for (const element of Array.from(root.querySelectorAll("*")).reverse()) {
      if (element.childElementCount > 0) {
        continue;
      }

      const tagName = element.tagName.toLowerCase();
      if (tagName === "br" || tagName === "img") {
        continue;
      }

      if (normalizeWhitespace(element.textContent ?? "")) {
        continue;
      }

      element.remove();
      changed = true;
    }
  }
}

function findFirstTextNode(root: Node): Text | null {
  for (const child of Array.from(root.childNodes)) {
    if (child.nodeType === 8) {
      continue;
    }

    if (child.nodeType === 3) {
      return child as Text;
    }

    if (child.nodeType === 1) {
      const nested = findFirstTextNode(child);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

function stripLeadingLegacyListMarker(root: Element) {
  let changed = false;

  while (true) {
    const firstTextNode = findFirstTextNode(root);
    if (!firstTextNode) {
      return changed;
    }

    const originalText = firstTextNode.textContent ?? "";
    const strippedText = originalText.replace(LEADING_LIST_MARKER_PATTERN, "");

    if (strippedText !== originalText) {
      if (strippedText) {
        firstTextNode.textContent = strippedText;
      } else {
        firstTextNode.remove();
      }

      pruneEmptyInlineElements(root);
      changed = true;
      continue;
    }

    if (!normalizeWhitespace(originalText)) {
      firstTextNode.remove();
      pruneEmptyInlineElements(root);
      changed = true;
      continue;
    }

    return changed;
  }
}

function createListItemFromLegacyElement(source: Element, doc: Document) {
  const clone = source.cloneNode(true) as Element;

  removeCommentNodes(clone);

  for (const marker of Array.from(clone.querySelectorAll('[style*="mso-list: Ignore"]'))) {
    marker.remove();
  }

  stripOfficeAttributes(clone);
  pruneEmptyInlineElements(clone);

  const html = clone.innerHTML
    .replace(/^(?:\s|&nbsp;|\u00a0)+/i, "")
    .replace(/(?:\s|&nbsp;|\u00a0)+$/i, "");

  if (!normalizeWhitespace(html.replace(/<[^>]+>/g, " "))) {
    return null;
  }

  const listItem = doc.createElement("li");
  listItem.innerHTML = html;
  return listItem;
}

function ensureParentListItem(list: Element, doc: Document) {
  const lastChild = list.lastElementChild;
  if (lastChild && lastChild.tagName.toLowerCase() === "li") {
    return lastChild;
  }

  const listItem = doc.createElement("li");
  list.appendChild(listItem);
  return listItem;
}

export function containsLegacyOfficeListMarkup(input: string) {
  return /mso-list:|MsoNoSpacing|supportLists|Wingdings/i.test(input);
}

export function normalizeLegacyOfficeListsInBody(body: Element, doc: Document) {
  const children = Array.from(body.children);
  let changed = false;

  for (let index = 0; index < children.length; index += 1) {
    const current = children[index];

    if (!isLegacyOfficeListElement(current)) {
      continue;
    }

    const run: Element[] = [];
    let runIndex = index;

    while (runIndex < children.length && isLegacyOfficeListElement(children[runIndex])) {
      run.push(children[runIndex]);
      runIndex += 1;
    }

    const indents = Array.from(
      new Set(run.map((item) => getLegacyOfficeListIndent(item)))
    ).sort((left, right) => left - right);

    const fragment = doc.createDocumentFragment();
    const listStack: Element[] = [];

    for (const item of run) {
      const depth = Math.max(0, indents.indexOf(getLegacyOfficeListIndent(item)));
      const tag = getLegacyOfficeListTag(item);

      while (listStack.length > depth + 1) {
        listStack.pop();
      }

      const parentNode =
        depth === 0 ? fragment : ensureParentListItem(listStack[depth - 1], doc);

      let currentList = listStack[depth];
      if (!currentList || currentList.tagName.toLowerCase() !== tag) {
        currentList = doc.createElement(tag);
        parentNode.appendChild(currentList);
        listStack[depth] = currentList;
        listStack.length = depth + 1;
      }

      const listItem = createListItemFromLegacyElement(item, doc);
      if (!listItem) {
        continue;
      }

      currentList.appendChild(listItem);
    }

    if (fragment.childNodes.length > 0) {
      run[0].before(fragment);
      for (const item of run) {
        item.remove();
      }
      changed = true;
    }

    index = runIndex - 1;
  }

  for (const listItem of Array.from(body.querySelectorAll("li"))) {
    if (stripLeadingLegacyListMarker(listItem)) {
      changed = true;
    }
  }

  return changed;
}
