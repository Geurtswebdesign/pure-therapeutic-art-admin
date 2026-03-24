# Capacitor Native Shell Setup

## Doel

Deze repo draait als een native shell rond de bestaande productie-app op:

- `https://pure-therapeutic-art-therapy.com`

Capacitor laadt dus de live app-URL in een native iOS- en Android-container.
Dat houdt de huidige Next.js serverarchitectuur in stand terwijl native plugins
zoals store billing, status bar, splash en later screenshotbeveiliging
beschikbaar worden.

## Belangrijk uitgangspunt

Deze shell bundelt niet de volledige webapp lokaal. De webview laadt standaard
de externe app-URL uit `capacitor.config.ts`.

Voor lokale native tests kun je tijdelijk een andere URL gebruiken:

```bash
CAPACITOR_SERVER_URL=http://192.168.1.10:3000 npm run native:sync
```

Gebruik hiervoor een adres dat vanaf het device bereikbaar is.

## Scripts

```bash
npm run native:prepare
npm run native:add:ios
npm run native:add:android
npm run native:sync
npm run native:open:ios
npm run native:open:android
npm run native:doctor
```

## Eerste setup

1. Installeer dependencies:

```bash
npm install
```

2. Genereer de shellbestanden:

```bash
npm run native:prepare
```

3. Voeg iOS en Android toe:

```bash
npm run native:add:ios
npm run native:add:android
```

4. Sync daarna altijd na config- of pluginwijzigingen:

```bash
npm run native:sync
```

## Native projecten

Na setup staan de platformprojecten in:

- `ios/`
- `android/`

Open ze met:

```bash
npm run native:open:ios
npm run native:open:android
```

## E-books en store billing

Deze native shell is de basis voor:

- Apple In-App Purchase voor iOS
- Google Play Billing voor Android
- beveiligde EPUB-reader binnen de app
- Android screenshotblokkade via `FLAG_SECURE`

De verdere storearchitectuur staat uitgewerkt in:

- [native-ebook-iap-architecture.md](/Users/dannygeurts/Documents/pure-therapeutic-art/docs/native-ebook-iap-architecture.md)
