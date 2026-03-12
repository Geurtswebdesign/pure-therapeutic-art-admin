#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from docx import Document


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp"}
INTRO_MARKERS = {
  "introductie",
  "inleiding",
  "introductietekst",
  "introductie van het thema",
}


@dataclass
class ImageGroup:
  order_hint: str
  sort_value: int
  title: str
  normalized_title: str
  image_paths: list[str]


def slugify(text: str) -> str:
  normalized = unicodedata.normalize("NFKD", text)
  ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
  slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_text.lower()).strip("-")
  return re.sub(r"-{2,}", "-", slug)


def normalize_text(text: str) -> str:
  collapsed = re.sub(r"\s+", " ", text).strip()
  normalized = unicodedata.normalize("NFKD", collapsed)
  ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
  return re.sub(r"[^a-z0-9]+", "", ascii_text.lower())


def clean_doc_title(title: str) -> str:
  cleaned = re.sub(r"^(applicatie thema|thema applicatie:)\s*", "", title, flags=re.I).strip()
  return cleaned.strip(" :-")


def is_intro_marker(text: str) -> bool:
  lowered = text.lower().strip(" :.-")
  return lowered in INTRO_MARKERS or lowered.startswith("introductietekst")


def is_title_like(text: str) -> bool:
  stripped = text.strip()
  if not stripped:
    return False
  if len(stripped) > 120:
    return False
  if stripped.endswith((".", "!", "?")) and len(stripped.split()) > 4:
    return False
  if len(stripped.split()) > 12:
    return False
  return True


def get_non_empty_paragraphs(path: Path) -> list[str]:
  doc = Document(str(path))
  return [re.sub(r"\s+", " ", p.text).strip() for p in doc.paragraphs if p.text.strip()]


def detect_list_start(paragraphs: list[str], start_index: int) -> int | None:
  for index in range(start_index, max(start_index, len(paragraphs) - 2)):
    sample = paragraphs[index:index + 3]
    if len(sample) < 3:
      break
    if all(is_title_like(line) for line in sample):
      return index
  return None


def extract_sections_from_doc(path: Path) -> dict[str, Any]:
  paragraphs = get_non_empty_paragraphs(path)
  if not paragraphs:
    return {
      "title": path.stem,
      "intro_heading": None,
      "description": "",
      "sections": [],
    }

  raw_title = paragraphs[0]
  title = clean_doc_title(raw_title)
  intro_index = 1 if len(paragraphs) > 1 else 0
  intro_heading = None

  if len(paragraphs) > 1 and is_intro_marker(paragraphs[1]):
    intro_heading = paragraphs[1]
    intro_index = 2

  # Special-case Worden's rouwtaken because the document is explicitly sectioned.
  rouw_section_pattern = re.compile(r"^Rouwtaak\s+\d+", re.I)
  if any(rouw_section_pattern.match(line) for line in paragraphs):
    sections: list[dict[str, Any]] = []
    index = 1
    while index < len(paragraphs):
      line = paragraphs[index]
      if not rouw_section_pattern.match(line):
        index += 1
        continue

      section_title = line
      index += 1
      items: list[dict[str, Any]] = []
      while index < len(paragraphs) and not rouw_section_pattern.match(paragraphs[index]):
        item_line = paragraphs[index]
        if items and normalize_text(item_line) == normalize_text(items[0]["title"]):
          break
        if is_title_like(item_line):
          items.append(
            {
              "title": item_line,
              "slug": slugify(item_line),
            }
          )
        elif items:
          break
        index += 1

      sections.append(
        {
          "title": section_title,
          "slug": slugify(section_title),
          "description": "",
          "suggestedLayout": "list",
          "items": items,
        }
      )

    return {
      "title": title,
      "intro_heading": intro_heading,
      "description": "",
      "sections": sections,
    }

  list_start = detect_list_start(paragraphs, intro_index)
  description_lines = paragraphs[intro_index:list_start] if list_start is not None else paragraphs[intro_index:]
  description = "\n\n".join(description_lines).strip()

  item_titles: list[str] = []
  if list_start is not None:
    for line in paragraphs[list_start:]:
      if item_titles and normalize_text(line) == normalize_text(item_titles[0]):
        break
      if is_title_like(line):
        item_titles.append(line)
      elif item_titles:
        break

  return {
    "title": title,
    "intro_heading": intro_heading,
    "description": description,
    "sections": [
      {
        "title": "Werkvormen",
        "slug": "werkvormen",
        "description": "",
        "suggestedLayout": "grid",
        "items": [{"title": item, "slug": slugify(item)} for item in item_titles],
      }
    ] if item_titles else [],
  }


def parse_image_group(path: Path) -> tuple[str, int, str]:
  stem = re.sub(r"\s+", " ", path.stem).strip()
  stem = re.sub(r"\(\d+\)$", "", stem).strip()

  rouw_match = re.match(r"^(RW\d+)\s+(.*)$", stem, flags=re.I)
  if rouw_match:
    order_hint = rouw_match.group(1).upper()
    sort_value = int(re.sub(r"\D+", "", order_hint) or "0")
    title = rouw_match.group(2).strip(" -=") or stem
    return order_hint, sort_value, title

  numeric_match = re.match(r"^(\d{1,2})[ ._-]*(.*)$", stem)
  if numeric_match:
    order_hint = numeric_match.group(1)
    sort_value = int(order_hint)
    title = numeric_match.group(2).strip(" -=") or stem
    return order_hint, sort_value, title

  return stem, 9999, stem


def build_image_groups(folder: Path, root: Path) -> list[ImageGroup]:
  grouped: dict[tuple[int, str], ImageGroup] = {}
  for path in sorted(folder.rglob("*"), key=lambda p: str(p).lower()):
    if not path.is_file() or path.suffix.lower() not in IMAGE_EXTENSIONS:
      continue
    if "__MACOSX" in str(path):
      continue

    order_hint, sort_value, title = parse_image_group(path)
    normalized_title = normalize_text(title)
    key = (sort_value, normalized_title or normalize_text(path.stem))
    if key not in grouped:
      grouped[key] = ImageGroup(
        order_hint=order_hint,
        sort_value=sort_value,
        title=title,
        normalized_title=normalized_title,
        image_paths=[],
      )
    grouped[key].image_paths.append(str(path.relative_to(root)))

  return sorted(grouped.values(), key=lambda group: (group.sort_value, group.title.lower()))


def preferred_image_path(image_paths: list[str]) -> str | None:
  if not image_paths:
    return None
  for image_path in image_paths:
    if Path(image_path).suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
      return image_path
  return image_paths[0]


def dedupe_sections(sections: list[dict[str, Any]]) -> list[dict[str, Any]]:
  deduped: list[dict[str, Any]] = []
  seen_slugs: set[str] = set()

  for section in sections:
    slug = section.get("slug") or slugify(section.get("title", "sectie"))
    if slug in seen_slugs:
      continue

    deduped.append(
      {
        **section,
        "slug": slug,
      }
    )
    seen_slugs.add(slug)

  return deduped


def match_images_to_items(items: list[dict[str, Any]], image_groups: list[ImageGroup]) -> list[dict[str, Any]]:
  remaining = image_groups[:]
  matched_items: list[dict[str, Any]] = []

  for index, item in enumerate(items, start=1):
    normalized_item = normalize_text(item["title"])
    match_index = None

    for candidate_index, group in enumerate(remaining):
      if normalized_item and group.normalized_title == normalized_item:
        match_index = candidate_index
        break
    if match_index is None:
      for candidate_index, group in enumerate(remaining):
        if normalized_item and (
          normalized_item in group.normalized_title or group.normalized_title in normalized_item
        ):
          match_index = candidate_index
          break
    if match_index is None and remaining:
      match_index = 0

    image_paths: list[str] = []
    if match_index is not None and remaining:
      image_paths = remaining.pop(match_index).image_paths

    matched_items.append(
      {
        "order": index,
        "title": item["title"],
        "slug": item["slug"],
        "imagePaths": image_paths,
        "suggestedImagePath": preferred_image_path(image_paths),
      }
    )

  return matched_items


def build_theme_entry(folder: Path, root: Path, parent_key: str | None = None) -> dict[str, Any]:
  docx_files = sorted(
    [
      path
      for path in folder.glob("*.docx")
      if not path.name.startswith("~$") and "applicatie" in path.name.lower() and "thema" in path.name.lower()
    ],
    key=lambda path: path.name.lower(),
  )
  image_groups = build_image_groups(folder, root)
  image_count = sum(len(group.image_paths) for group in image_groups)

  if docx_files:
    doc_info = extract_sections_from_doc(docx_files[0])
    theme_title = doc_info["title"]
    description = doc_info["description"]
    source_sections = dedupe_sections(doc_info["sections"])
    sections = [
      {
        "title": section["title"],
        "slug": section["slug"],
        "description": section["description"],
        "suggestedLayout": section["suggestedLayout"],
        "suggestedSectionImagePath": None,
        "items": match_images_to_items(section["items"], image_groups),
      }
      for section in source_sections
    ]
    for section in sections:
      first_item = section["items"][0] if section["items"] else None
      section["suggestedSectionImagePath"] = (
        first_item["suggestedImagePath"] if first_item else None
      )
    intro_heading = doc_info["intro_heading"]
    docx_path = str(docx_files[0].relative_to(root))
  else:
    theme_title = folder.name
    description = ""
    sections = []
    intro_heading = None
    docx_path = None

  key = slugify(folder.relative_to(root).as_posix().replace("/", " "))
  if parent_key:
    key = f"{parent_key}/{slugify(folder.name)}"

  return {
    "key": key,
    "parentKey": parent_key,
    "folderName": folder.name,
    "folderPath": str(folder.relative_to(root)),
    "title": theme_title,
    "suggestedSlug": slugify(theme_title),
    "description": description,
    "introHeading": intro_heading,
    "docxPath": docx_path,
    "imageCount": image_count,
    "suggestedHeroImagePath": preferred_image_path([p for group in image_groups for p in group.image_paths]),
    "sections": sections,
  }


def build_manifest(root: Path) -> dict[str, Any]:
  top_level_folders = sorted(
    [path for path in root.iterdir() if path.is_dir() and not path.name.startswith("__")],
    key=lambda path: path.name.lower(),
  )

  themes: list[dict[str, Any]] = []
  top_level_keys: list[str] = []

  for folder in top_level_folders:
    child_folders = sorted(
      [path for path in folder.iterdir() if path.is_dir() and not path.name.startswith("__")],
      key=lambda path: path.name.lower(),
    )
    child_docx = any(
      any(
        not path.name.startswith("~$")
        and "applicatie" in path.name.lower()
        and "thema" in path.name.lower()
        for path in child.glob("*.docx")
      )
      for child in child_folders
    )

    if child_folders and child_docx:
      parent_entry = {
        "key": slugify(folder.name),
        "parentKey": None,
        "folderName": folder.name,
        "folderPath": str(folder.relative_to(root)),
        "title": folder.name,
        "suggestedSlug": slugify(folder.name),
        "description": "",
        "introHeading": None,
        "docxPath": None,
        "imageCount": sum(
          1
          for path in folder.rglob("*")
          if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS and "__MACOSX" not in str(path)
        ),
        "suggestedHeroImagePath": None,
        "sections": [],
        "childThemeKeys": [],
      }
      top_level_keys.append(parent_entry["key"])
      themes.append(parent_entry)

      for child_folder in child_folders:
        child_entry = build_theme_entry(child_folder, root, parent_key=parent_entry["key"])
        themes.append(child_entry)
        parent_entry["childThemeKeys"].append(child_entry["key"])
      continue

    entry = build_theme_entry(folder, root)
    themes.append(entry)
    top_level_keys.append(entry["key"])

  return {
    "sourceRoot": root.name,
    "topLevelThemeKeys": top_level_keys,
    "themeCount": len(themes),
    "themes": themes,
  }


def main() -> None:
  parser = argparse.ArgumentParser()
  parser.add_argument("source_root", type=Path)
  parser.add_argument("output_path", type=Path)
  args = parser.parse_args()

  manifest = build_manifest(args.source_root)
  args.output_path.parent.mkdir(parents=True, exist_ok=True)
  args.output_path.write_text(
    json.dumps(manifest, ensure_ascii=True, indent=2),
    encoding="utf-8",
  )


if __name__ == "__main__":
  main()
