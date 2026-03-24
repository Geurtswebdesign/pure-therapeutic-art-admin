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

## Bundle ID en signing

De native shell gebruikt nu standaard:

- iOS bundle identifier: `com.detroostboom.puretherapeuticart`
- Android application id: `com.detroostboom.puretherapeuticart`

Controleer voor release:

### iOS

1. Open [ios/App/App.xcodeproj](/Users/dannygeurts/Documents/pure-therapeutic-art/ios/App/App.xcodeproj)
2. Kies target `App`
3. Zet onder `Signing & Capabilities`:
   - jouw Apple Developer Team
   - juiste provisioning profile / automatic signing
4. Controleer:
   - bundle identifier
   - app display name
   - version en build number

### Android

1. Open [android](/Users/dannygeurts/Documents/pure-therapeutic-art/android) in Android Studio
2. Controleer in [build.gradle](/Users/dannygeurts/Documents/pure-therapeutic-art/android/app/build.gradle):
   - `applicationId`
   - `versionCode`
   - `versionName`
3. Maak daarna een release keystore en signing config voor Play release builds

## E-books en store billing

Deze native shell is de basis voor:

- Apple In-App Purchase voor iOS
- Google Play Billing voor Android
- beveiligde EPUB-reader binnen de app
- Android screenshotblokkade via `FLAG_SECURE`

De verdere storearchitectuur staat uitgewerkt in:

- [native-ebook-iap-architecture.md](/Users/dannygeurts/Documents/pure-therapeutic-art/docs/native-ebook-iap-architecture.md)

## RevenueCat setup

Voor de eerste billingintegratie gebruikt deze repo nu RevenueCat.

Zet in je app-env:

```env
NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY=
NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY=
REVENUECAT_WEBHOOK_AUTH=
EBOOK_PURCHASE_MODE=native_store
```

En configureer daarna in RevenueCat:

1. iOS app koppelen met hetzelfde bundle id
2. Android app koppelen met dezelfde application id
3. Apple en Google storeconnecties leggen
4. per e-book product-id's aanmaken die matchen met de shopadmin
5. webhook instellen naar:
   - `https://pure-therapeutic-art-therapy.com/api/revenuecat/webhooks`
6. `Authorization` header in RevenueCat gelijk zetten aan `REVENUECAT_WEBHOOK_AUTH`
