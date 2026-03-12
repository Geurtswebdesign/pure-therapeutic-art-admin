#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
from datetime import date
from pathlib import Path


def sql_literal(value: object | None) -> str:
    if value is None:
        return "null"

    text = str(value).replace("'", "''")
    return f"'{text}'"


def build_theme_sort_map(manifest: dict) -> dict[str, int]:
    sort_map: dict[str, int] = {}

    for index, key in enumerate(manifest["topLevelThemeKeys"], start=1):
        sort_map[key] = index * 10

    sibling_counter: dict[str, int] = {}
    for entry in manifest["themes"]:
        parent_key = entry.get("parentKey")
        if not parent_key:
            continue

        sibling_counter[parent_key] = sibling_counter.get(parent_key, 0) + 1
        sort_map[entry["key"]] = sibling_counter[parent_key] * 10

    return sort_map


def build_pages_insert(manifest: dict) -> str:
    sort_map = build_theme_sort_map(manifest)
    rows: list[str] = []

    for entry in manifest["themes"]:
        has_hero_image = bool(entry.get("suggestedHeroImagePath"))
        rows.append(
            "  (\n"
            "    null,\n"
            f"    {sql_literal(entry['key'])},\n"
            f"    {sql_literal(entry['suggestedSlug'])},\n"
            f"    {sql_literal('Subthema' if entry.get('parentKey') else 'Thema')},\n"
            f"    {sql_literal(entry['title'])},\n"
            f"    {sql_literal(entry.get('description') or None)},\n"
            "    null,\n"
            f"    {sql_literal(entry['title'] if has_hero_image else None)},\n"
            f"    {sql_literal('right' if has_hero_image else 'top')},\n"
            "    null,\n"
            "    false,\n"
            f"    {sort_map.get(entry['key'], 0)}\n"
            "  )"
        )

    return (
        "insert into public.content_theme_pages (\n"
        "  parent_theme_page_id,\n"
        "  source_key,\n"
        "  slug,\n"
        "  eyebrow,\n"
        "  title,\n"
        "  description,\n"
        "  hero_image_url,\n"
        "  hero_image_alt,\n"
        "  hero_image_position,\n"
        "  primary_category_term_id,\n"
        "  is_published,\n"
        "  sort_order\n"
        ")\n"
        "values\n"
        + ",\n".join(rows)
        + "\n"
        "on conflict (slug) do update\n"
        "set\n"
        "  parent_theme_page_id = null,\n"
        "  source_key = excluded.source_key,\n"
        "  slug = excluded.slug,\n"
        "  eyebrow = excluded.eyebrow,\n"
        "  title = excluded.title,\n"
        "  description = excluded.description,\n"
        "  hero_image_url = excluded.hero_image_url,\n"
        "  hero_image_alt = excluded.hero_image_alt,\n"
        "  hero_image_position = excluded.hero_image_position,\n"
        "  primary_category_term_id = excluded.primary_category_term_id,\n"
        "  is_published = excluded.is_published,\n"
        "  sort_order = excluded.sort_order,\n"
        "  updated_at = now();"
    )


def build_parent_update(manifest: dict) -> str:
    rows = [
        (
            entry["key"],
            entry["parentKey"],
        )
        for entry in manifest["themes"]
        if entry.get("parentKey")
    ]

    if not rows:
        return "-- Geen parent-child relaties gevonden."

    values = ",\n".join(
        f"    ({sql_literal(child_key)}, {sql_literal(parent_key)})"
        for child_key, parent_key in rows
    )

    return (
        "with parent_seed(child_source_key, parent_source_key) as (\n"
        "  values\n"
        f"{values}\n"
        ")\n"
        "update public.content_theme_pages child\n"
        "set\n"
        "  parent_theme_page_id = parent.id,\n"
        "  updated_at = now()\n"
        "from parent_seed\n"
        "join public.content_theme_pages parent\n"
        "  on parent.source_key = parent_seed.parent_source_key\n"
        "where child.source_key = parent_seed.child_source_key;"
    )


def build_sections_insert(manifest: dict) -> str:
    rows: list[str] = []

    for entry in manifest["themes"]:
        for index, section in enumerate(entry.get("sections", []), start=1):
            has_section_image = bool(section.get("suggestedSectionImagePath"))
            rows.append(
                "    (\n"
                f"      {sql_literal(entry['key'])},\n"
                f"      {sql_literal(section['slug'])},\n"
                f"      {sql_literal(section['title'])},\n"
                f"      {sql_literal(section.get('description') or None)},\n"
                f"      {sql_literal(section['suggestedLayout'])},\n"
                "      null,\n"
                f"      {sql_literal(section['title'] if has_section_image else None)},\n"
                f"      {sql_literal('top' if has_section_image else 'none')},\n"
                f"      {index * 10}\n"
                "    )"
            )

    if not rows:
        return "-- Geen secties gevonden in het bronmanifest."

    return (
        "with section_seed(\n"
        "  theme_source_key,\n"
        "  slug,\n"
        "  title,\n"
        "  description,\n"
        "  layout_style,\n"
        "  section_image_url,\n"
        "  section_image_alt,\n"
        "  section_image_position,\n"
        "  sort_order\n"
        ") as (\n"
        "  values\n"
        + ",\n".join(rows)
        + "\n"
        ")\n"
        "insert into public.content_theme_sections (\n"
        "  theme_page_id,\n"
        "  slug,\n"
        "  title,\n"
        "  description,\n"
        "  layout_style,\n"
        "  section_image_url,\n"
        "  section_image_alt,\n"
        "  section_image_position,\n"
        "  sort_order\n"
        ")\n"
        "select\n"
        "  page.id,\n"
        "  section_seed.slug,\n"
        "  section_seed.title,\n"
        "  section_seed.description,\n"
        "  section_seed.layout_style,\n"
        "  section_seed.section_image_url,\n"
        "  section_seed.section_image_alt,\n"
        "  section_seed.section_image_position,\n"
        "  section_seed.sort_order\n"
        "from section_seed\n"
        "join public.content_theme_pages page\n"
        "  on page.source_key = section_seed.theme_source_key\n"
        "on conflict (theme_page_id, slug) do update\n"
        "set\n"
        "  title = excluded.title,\n"
        "  description = excluded.description,\n"
        "  layout_style = excluded.layout_style,\n"
        "  section_image_url = excluded.section_image_url,\n"
        "  section_image_alt = excluded.section_image_alt,\n"
        "  section_image_position = excluded.section_image_position,\n"
        "  sort_order = excluded.sort_order,\n"
        "  updated_at = now();"
    )


def build_sql(manifest: dict) -> str:
    return "\n\n".join(
        [
            "begin;",
            (
                f"-- Gegenereerd op {date.today().isoformat()} uit docs/theme-source-manifest.json.\n"
                f"-- Bronroot: {manifest['sourceRoot']}\n"
                "-- Dit seedbestand maakt bron-gekoppelde themapagina's en secties aan als concept.\n"
                "-- De zip-afbeeldingen zijn lokale bronbestanden en worden daarom niet als publieke image_url opgeslagen.\n"
                "-- Bij het bewerken in /admin/content/themes zie je via source_key wel de voorgestelde bronbeelden en itemlijsten terug."
            ),
            build_pages_insert(manifest),
            build_parent_update(manifest),
            build_sections_insert(manifest),
            "commit;",
        ]
    ) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--manifest",
        default="docs/theme-source-manifest.json",
        help="Pad naar het bronmanifest",
    )
    parser.add_argument(
        "--output",
        default="sql/content_theme_seed_from_manifest.sql",
        help="Pad naar het gegenereerde SQL-bestand",
    )
    args = parser.parse_args()

    manifest_path = Path(args.manifest)
    output_path = Path(args.output)

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    output_path.write_text(build_sql(manifest), encoding="utf-8")


if __name__ == "__main__":
    main()
