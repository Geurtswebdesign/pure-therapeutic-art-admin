# Native E-book IAP Architectuur

## Doel

E-books worden in de native iOS- en Android-app verkocht als digitale content
via de store-betaalmethoden van Apple en Google. Na een succesvolle aankoop:

- wordt het e-book als eigendom aan het account gekoppeld
- verschijnt het automatisch in `/account?panel=ebooks`
- wordt het gelezen via de beveiligde app-reader
- blijft het bestand buiten publieke downloadlinks

## Waarom deze route

Voor digitale content in native store-apps is een store-betaalpad de juiste
basis. Voor deze app betekent dat:

- iOS: Apple In-App Purchase / StoreKit
- Android: Google Play Billing

De huidige webcode blijft het product tonen, maar de daadwerkelijke storekoop
wordt straks in de native app afgehandeld.

## Nieuwe bouwstenen in deze repo

### 1. Shopproduct als bron

E-books blijven gewone shopproducten in `shop_catalog`, maar hebben nu ook:

- `appleStoreProductId`
- `googleStoreProductId`
- `epubUrl` (private asset reference)

Deze velden worden beheerd vanuit de shopadmin.

### 2. Eigendom van e-books

Tabel:

- `public.app_ebook_purchases`

Bestand:

- `sql/app_ebook_purchases.sql`

Deze tabel bewaart welke gebruiker welk e-book bezit. De accountpagina en de
reader gebruiken deze tabel als bron van waarheid.

### 3. Storetransacties via RevenueCat

De bestaande tabel `iap_transactions` blijft de technische transactielog voor
Apple en Google, maar de storevalidatie loopt via RevenueCat.

Nieuwe backendroutes:

- `POST /api/iap/ebooks/record`
- `POST /api/revenuecat/webhooks`

Bestanden:

- `app/api/iap/ebooks/record/route.ts`
- `app/api/revenuecat/webhooks/route.ts`

De productiestroom is:

1. de native app koopt via RevenueCat
2. RevenueCat valideert bij Apple / Google
3. RevenueCat roept onze webhook aan
4. de webhook zoekt het juiste e-book op basis van `platform + storeProductId`
5. de webhook logt de transactie in `iap_transactions`
6. de webhook schrijft het eigendom weg naar `app_ebook_purchases`

`/api/iap/ebooks/record` blijft beschikbaar als interne fallback-haak, maar de
normale native route loopt via RevenueCat webhooks.

## Readerarchitectuur

### 1. Private EPUB-opslag

EPUB’s worden niet meer als publieke `media`-URL gebruikt.

Nieuwe admin-uploadroute:

- `POST /api/admin/ebooks/upload`

Bestand:

- `app/api/admin/ebooks/upload/route.ts`

Upload gaat naar een private bucket:

- `secure-ebooks`

De opgeslagen referentie wordt op het shopproduct gezet, niet een publieke URL.

### 2. Lezen via gecontroleerde file-route

Nieuwe file-route:

- `GET /api/account/ebooks/[slug]/file`

Bestand:

- `app/api/account/ebooks/[slug]/file/route.ts`

Deze route:

- controleert of de gebruiker is ingelogd
- controleert of de gebruiker het e-book bezit
- downloadt het bestand server-side uit private storage
- streamt het EPUB inline terug zonder publieke share-URL

### 3. Reader in account

Readerroute:

- `/account/ebooks/product/[slug]`

Bestand:

- `app/account/ebooks/product/[slug]/page.tsx`

Clientreader:

- `components/account/AccountProductEbookReader.tsx`

Bescherming:

- watermarking
- blokkade op copy / cut / print / contextmenu / selectie
- extra blokkades binnen het EPUB-document zelf

## Belangrijke grens

In een web/hybrid context kun je screenshots niet op elk platform volledig hard
blokkeren.

Praktisch:

- Android native: `FLAG_SECURE` gebruiken
- iOS native: wel detectie / mitigatie / watermarking, maar geen volledig harde
  screenshotblokkade zoals op Android

Daarom blijft de beveiligingsstrategie:

- private bestandsopslag
- geen publieke download-URL
- geen export/share
- watermarking per gebruiker
- blokkeren van copy/select/print/contextmenu

## Native app flow

### iOS

1. De app configureert RevenueCat met de ingelogde app-user-id
2. De app vraagt productinformatie op via `appleStoreProductId`
3. De gebruiker koopt via StoreKit
4. RevenueCat valideert de aankoop en stuurt een webhook
5. De backend koppelt het e-book aan het account
6. Het e-book verschijnt in `EBooks`

### Android

1. De app configureert RevenueCat met de ingelogde app-user-id
2. De app vraagt productinformatie op via `googleStoreProductId`
3. De gebruiker koopt via Play Billing
4. RevenueCat valideert de aankoop en stuurt een webhook
5. De backend koppelt het e-book aan het account
6. Het e-book verschijnt in `EBooks`

## Nog te bouwen

### Native shell

Aanbevolen richting:

- Capacitor bovenop de bestaande Next/webcode

### RevenueCat console setup

Nog nodig buiten de repo:

- RevenueCat project aanmaken
- iOS app en Android app koppelen
- Apple API key / App Store Connect koppelen
- Google Play service-account koppelen
- producten aanmaken in RevenueCat
- webhook naar `/api/revenuecat/webhooks` configureren
- `NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY`
- `NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY`
- `REVENUECAT_WEBHOOK_AUTH`

## Configuratie per e-book

In de shopadmin moet voor elk e-book worden ingevuld:

- titel
- prijs
- cover / afbeelding
- EPUB-bestand
- Apple store product-id
- Google Play product-id

Pas als al deze onderdelen aanwezig zijn, is een e-book klaar voor native verkoop.

## Implementatiestatus

Al gebouwd:

- app-only e-bookeigendom
- private EPUB-opslag
- beveiligde readerroute
- adminvelden voor store product-id’s
- backendroute voor e-book IAP-recording
- RevenueCat native bootstrap
- RevenueCat webhook voor eigendomssync

Nog open:

- storeconsole-configuratie
- definitieve productcatalogus in Apple en Google
- Android screenshotblokkade (`FLAG_SECURE`)
