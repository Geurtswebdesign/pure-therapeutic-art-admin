# User Progress MVP

Dit document beschrijft de eerste productierijpe versie van een persoonlijk voortgangssysteem voor de app.

Doel:

- gebruikers helpen hun traject terug te vinden
- retentie verhogen na unlock of aankoop
- content meer laten voelen als een doorlopend proces in plaats van losse pagina's

## Productdoel

De gebruiker moet:

- content kunnen bewaren voor later
- kunnen zien welke content al is gestart of afgerond
- een korte persoonlijke notitie per content-item kunnen bewaren
- in het account een overzicht hebben van zijn of haar voortgang

Deze MVP bouwt voort op:

- `content_items`
- `content_unlocks`
- de bestaande accountpagina
- de bestaande contentdetailpagina

## MVP-scope

Deze versie bevat:

1. Opslaan voor later
2. Voortgangstatus per content-item
3. Persoonlijke notitie per content-item
4. Een nieuwe accountsectie "Mijn traject"
5. "Recent bekeken" in het account

Deze versie bevat nog niet:

- reminders of e-mail opvolging
- aanbevelingsalgoritmes
- voortgang per block of stap binnen een content-item
- deelbare notities
- admin dashboards voor voortgang

## Datamodel

Voor de MVP is een enkele relationele tabel voldoende.

Voorgestelde tabel:

```sql
create table if not exists public.user_content_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  is_saved boolean not null default false,
  progress_status text not null default 'not_started',
  note_text text null,
  saved_at timestamptz null,
  started_at timestamptz null,
  completed_at timestamptz null,
  last_viewed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_content_progress_status_check
    check (progress_status in ('not_started', 'in_progress', 'completed')),
  constraint user_content_progress_unique unique (user_id, content_item_id)
);
```

Aanvullende indexen:

```sql
create index if not exists idx_user_content_progress_user
  on public.user_content_progress (user_id);

create index if not exists idx_user_content_progress_user_saved
  on public.user_content_progress (user_id, is_saved);

create index if not exists idx_user_content_progress_user_status
  on public.user_content_progress (user_id, progress_status);

create index if not exists idx_user_content_progress_user_viewed
  on public.user_content_progress (user_id, last_viewed_at desc);
```

Aanvullende trigger:

- `updated_at` automatisch bijwerken bij elke update

## Waarom één tabel

Deze MVP zou ook opgesplitst kunnen worden in:

- `user_saved_content`
- `user_content_notes`
- `user_content_progress`
- `user_content_views`

Maar dat is nu te zwaar voor wat we nodig hebben.

Met één tabel houden we het simpel:

- minder queries
- eenvoudiger accountoverzicht
- minder server actions
- later nog op te splitsen als nodig

## Toegangsregels

Voortgang mag alleen worden opgeslagen voor:

- gratis content
- of content waar de gebruiker al toegang toe heeft

Praktische regel:

- op de contentdetailpagina tonen we voortgangsacties pas als de content zichtbaar is
- dus als de gebruiker het artikel kan lezen, mag hij ook opslaan, status wijzigen en notities opslaan

## Gebruikersflow

### 1. Contentdetail

Op [page.tsx](/Users/dannygeurts/Documents/pure-therapeutic-art/app/content/[slug]/page.tsx):

- als gebruiker ingelogd is en toegang heeft:
  - knop `Bewaar voor later`
  - status selector:
    - `Nog niet gestart`
    - `Bezig`
    - `Afgerond`
  - notitieveld:
    - korte reflectie of inzicht

Gedrag:

- eerste interactie maakt of upsert een `user_content_progress` record
- openen van de pagina zet `last_viewed_at`
- status `Bezig` zet automatisch `started_at` als die nog leeg is
- status `Afgerond` zet automatisch `completed_at`
- terug van `Afgerond` naar `Bezig` wist `completed_at`

### 2. Account

Op [page.tsx](/Users/dannygeurts/Documents/pure-therapeutic-art/app/account/page.tsx):

- nieuwe sectie/tab `Mijn traject`
- subsecties:
  - `Verdergaan`
  - `Bewaard`
  - `Afgerond`
  - `Recent bekeken`

Per item tonen:

- titel
- categorie
- voortgangstatus
- datum laatst bekeken
- link naar content
- optioneel korte note preview

### 3. Onboarding-nudge

Na een unlock:

- gebruiker ziet op de contentpagina meteen de mogelijkheid om het item te bewaren of als `Bezig` te markeren

Dat maakt de unlock functioneel waardevoller.

## Server actions / querylaag

Nieuwe server actions, bij voorkeur in een nieuw bestand:

- `app/account/progress-actions.ts`
- of `app/content/progress-actions.ts`

Voorgestelde acties:

1. `toggleSavedContent(contentItemId: string)`
2. `setContentProgressStatus(contentItemId: string, status: "not_started" | "in_progress" | "completed")`
3. `saveContentNote(contentItemId: string, noteText: string)`
4. `touchContentLastViewed(contentItemId: string)`

Voorgestelde query helpers:

- `lib/content/progress.ts`

Met functies:

1. `getUserContentProgress(userId: string, contentItemId: string)`
2. `listUserSavedContent(userId: string)`
3. `listUserInProgressContent(userId: string)`
4. `listUserCompletedContent(userId: string)`
5. `listRecentlyViewedContent(userId: string, limit?: number)`

## UI-onderdelen

Nieuwe componenten:

- `components/content/ContentProgressCard.tsx`
- `components/account/ProgressList.tsx`
- `components/account/ProgressNoteForm.tsx`

### ContentProgressCard

Plaatsing:

- op de contentdetailpagina
- onder titel/excerpt of in een zijkaart onder de artikelheader

Inhoud:

- save toggle
- status pills of select
- kleine textarea voor notitie

### ProgressList

Voor de accountpagina:

- herbruikbare lijstkaart voor bewaard / bezig / afgerond / recent

## Eerste MVP-queries

Voor accountoverzicht hoeven we geen complexe join-structuur te bouwen.

De lijstquery kan:

1. `user_content_progress` ophalen voor de gebruiker
2. bijbehorende `content_items` ophalen
3. categorieën ophalen via:
   - `content_term_relationships`
   - `content_terms`
   - taxonomy `category`

Dit volgt het patroon dat al gebruikt wordt in:

- [page.tsx](/Users/dannygeurts/Documents/pure-therapeutic-art/app/admin/content/page.tsx)
- [page.tsx](/Users/dannygeurts/Documents/pure-therapeutic-art/app/admin/users/[user_id]/page.tsx)

## UX-beslissingen

### Statusgedrag

Gebruik precies drie statussen:

- `not_started`
- `in_progress`
- `completed`

Niet meer in de MVP.

### Notities

Voor de MVP:

- één notitie per gebruiker per content-item
- plaintext of eenvoudige textarea
- geen rich text

### Save-gedrag

`is_saved` blijft los van status.

Dus:

- een item kan `saved = true` zijn en nog `not_started`
- een item kan `in_progress` zijn zonder expliciet `saved`

In het account mag een item in meerdere logische overzichten terugkomen, maar in de UI tonen we het liefst:

- `Verdergaan`: status `in_progress`
- `Bewaard`: `is_saved = true` en status niet `completed`
- `Afgerond`: status `completed`
- `Recent bekeken`: op `last_viewed_at`

## Gefaseerde implementatie

### Fase 1

- SQL tabel en indexen
- query helpers
- server actions
- contentdetailkaart met save + status

### Fase 2

- accounttab `Mijn traject`
- lijsten voor bewaard / bezig / afgerond / recent

### Fase 3

- notitieveld op contentdetail
- notitiepreview op account

## Acceptatiecriteria MVP

De feature is geslaagd als:

1. Een ingelogde gebruiker met toegang een content-item kan bewaren.
2. Een gebruiker de status kan zetten op `Bezig` en `Afgerond`.
3. De status na refresh bewaard blijft.
4. `Recent bekeken` bijgewerkt wordt na het openen van een contentpagina.
5. De accountpagina een bruikbaar overzicht geeft van voortgang.
6. Een notitie per content-item opgeslagen en teruggelezen kan worden.

## Aanbevolen implementatievolgorde

1. SQL bestand toevoegen in `sql/`
2. nieuwe helperlaag in `lib/content/progress.ts`
3. server actions bouwen
4. `ContentProgressCard` op de contentdetailpagina
5. accountoverzicht uitbreiden
6. daarna pas notitieveld live zetten

## Eerste concrete build-slice

Als we dit nu gaan bouwen, zou ik starten met deze kleinste productwaardige slice:

1. tabel `user_content_progress`
2. save toggle
3. status `not_started / in_progress / completed`
4. accountsectie `Mijn traject` met:
   - Verdergaan
   - Afgerond
   - Recent bekeken

Notities kunnen dan direct daarna als tweede slice.
