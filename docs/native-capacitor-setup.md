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

Voor de iOS Simulator op dezelfde Mac kun je direct `localhost` gebruiken:

```bash
npm run dev
npm run native:sync:ios-sim
```

Daarna opnieuw runnen in Xcode. Zonder deze stap blijft de app in Xcode de live URL
`https://pure-therapeutic-art-therapy.com` laden en zie je lokale layoutwijzigingen dus niet.

Voor een fysieke iPhone moet je niet `localhost` gebruiken, maar het LAN-adres van je Mac:

```bash
npm run dev
npm run native:sync:ios-device
```

Dat script detecteert automatisch je lokale IPv4-adres en zet `CAPACITOR_SERVER_URL`
daarop. Zorg dat iPhone en Mac op hetzelfde netwerk zitten.

## Scripts

```bash
npm run native:prepare
npm run native:add:ios
npm run native:add:android
npm run native:sync
npm run native:sync:production
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

Voor een echte release-build moet je expliciet de productie-URL terugzetten:

```bash
npm run native:sync:production
```

Gebruik `native:sync:android-emulator` alleen voor lokale emulator-tests. Als je
daarna direct een release bundle maakt zonder opnieuw productie te syncen, wijst de
Android app nog naar `10.0.2.2:3000` en krijg je buiten je lokale machine een wit scherm.

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
- [android-internal-testing-plan.md](/Users/dannygeurts/Documents/pure-therapeutic-art/docs/android-internal-testing-plan.md)

## RevenueCat setup

Voor de eerste billingintegratie gebruikt deze repo nu RevenueCat.

Zet in je app-env:

```env
NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY=
NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY=
REVENUECAT_WEBHOOK_AUTH=
EBOOK_PURCHASE_MODE=native_store
CREDIT_PACK_PURCHASE_MODE=native_store
```

En configureer daarna in RevenueCat:

1. iOS app koppelen met hetzelfde bundle id
2. Android app koppelen met dezelfde application id
3. Apple en Google storeconnecties leggen
4. per e-book product-id's aanmaken die matchen met de shopadmin
5. voor credit packs dezelfde store product-id's gebruiken als in de app-logica of expliciet mappen via `public.iap_products`
   - standaard fallback conventie: `credits.{scope}.{key}`
   - voor opdrachtpacks zijn dat nu:
     - `credits.assignment.start`
     - `credits.assignment.basis`
     - `credits.assignment.standaard`
     - `credits.assignment.plus`
     - `credits.assignment.voordeel`
   - de app accepteert tijdelijk ook nog de oude bundle-prefixed variant voor bestaande mappings
6. webhook instellen naar:
   - `https://pure-therapeutic-art-therapy.com/api/revenuecat/webhooks`
7. `Authorization` header in RevenueCat gelijk zetten aan `REVENUECAT_WEBHOOK_AUTH`

## Google Play koppeling

De Android app gebruikt dezelfde app-id als iOS:

- package name / application id: `com.detroostboom.puretherapeuticart`

Controleer dit in:

- [capacitor.config.ts](/Users/dannygeurts/Documents/pure-therapeutic-art/capacitor.config.ts)
- [android/app/build.gradle](/Users/dannygeurts/Documents/pure-therapeutic-art/android/app/build.gradle)

Voor de Google Play koppeling moet je buiten de code deze stappen afronden:

1. Maak in Google Play Console een app aan met package name `com.detroostboom.puretherapeuticart`
2. Maak in RevenueCat onder `Apps & providers` ook een Android app aan voor dezelfde package name
3. Kopieer daarna de Android SDK key uit RevenueCat naar:

```env
NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY=
```

4. Koppel Google Play aan RevenueCat via de Play Console integratie of service account
5. Maak in Google Play Console je producten aan met exact dezelfde product-id's als de app verwacht
6. Upload een Android build naar een interne test track of closed testing track
7. Voeg testgebruikers toe in Google Play Console
8. Installeer die testbuild op een Android toestel dat is ingelogd met een testaccount

### RevenueCat service account aanmaken

Als je in Google Cloud bij `Create service account` zit, gebruik dan voor deze repo
bij voorkeur deze waarden:

- Service account name: `RevenueCat Service Account`
- Service account ID: `revenuecat-service-account`
- Description: `Service account for RevenueCat integration`

Na `Create and continue` geef je deze projectrollen:

- `Pub/Sub Editor`
- `Monitoring Viewer`

Je kunt stap 3 `Principals with access` overslaan en direct op `Done` klikken.

Maak daarna in Google Cloud bij die service account een JSON-key aan:

1. `IAM & Admin`
2. `Service Accounts`
3. open `revenuecat-service-account`
4. `Keys`
5. `Add key`
6. `Create new key`
7. kies `JSON`

Upload die JSON vervolgens in RevenueCat onder je Android app bij
`Project Settings` -> `Google Play App Settings` -> `Service Account Key`.

Let op: nieuwe Google Play credentials kunnen pas na enkele uren werken. RevenueCat
meldt dat validatie tot ongeveer 36 uur kan duren.

### Service account toegang in Google Play Console

Alleen de JSON-key uploaden is niet genoeg. Nodig dezelfde service account ook uit in
Google Play Console via `Users and permissions` en geef minimaal:

- app-toegang tot `com.detroostboom.puretherapeuticart`
- `View app information and download bulk reports (read-only)`
- `View financial data, orders, and cancellation survey response`
- `Manage orders and subscriptions`

Als een van deze permissies ontbreekt, ziet RevenueCat vaak wel de key maar kan het
abonnementen, producten of orders nog niet uitlezen.

Als je later bij Google Play `Send test notification` gebruikt en die test faalt,
controleer dan ook of de principal
`google-play-developer-notifications@system.gserviceaccount.com` op het gebruikte
Pub/Sub topic de rol `Pub/Sub Publisher` heeft.

Voor de huidige app zijn dit de standaard product-id's voor opdrachtpakketten:

- `credits.assignment.start`
- `credits.assignment.basis`
- `credits.assignment.standaard`
- `credits.assignment.plus`
- `credits.assignment.voordeel`

Gebruik voor e-books en abonnementen dezelfde product-id's als in RevenueCat en de shopadmin. Als een product-id afwijkt van de standaard in de app, map hem dan expliciet via `public.iap_products`.

Belangrijk bij testen op Android:

- producten worden meestal pas fetchbaar nadat er een testbuild via Google Play is geïnstalleerd
- lokaal sideloaden buiten Play om is voor Billing-tests meestal niet genoeg
- de tester moet toegang hebben tot de interne of closed test track

### Android testbetalingen checklist

Alleen een app uploaden naar `Internal testing` is niet genoeg om aankopen goed te testen.
Voor deze repo moeten ook de app-env, Play Console en RevenueCat tegelijk kloppen.

Zet op de server waar de native app naartoe wijst minimaal dit:

```env
NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY=
REVENUECAT_WEBHOOK_AUTH=
EBOOK_PURCHASE_MODE=native_store
CREDIT_PACK_PURCHASE_MODE=native_store
```

Controleer daarnaast:

1. de Android tester is toegevoegd aan de interne of closed test track
2. diezelfde gebruiker staat ook in Play Console als `license tester`
3. de tester heeft via de opt-in link de testtrack geactiveerd
4. de Google Play producten bestaan en zijn actief
5. de product-id's matchen exact met:
   - de RevenueCat productconfig
   - de shopadmin / `shop_catalog`
   - de credit-pack fallback ids uit [lib/iap/credit-pack-products.ts](/Users/dannygeurts/Documents/pure-therapeutic-art/lib/iap/credit-pack-products.ts)
6. RevenueCat heeft een werkende Google Play koppeling
7. de webhook in RevenueCat wijst naar:
   - `https://pure-therapeutic-art-therapy.com/api/revenuecat/webhooks`
8. de `Authorization` header in RevenueCat is exact gelijk aan `REVENUECAT_WEBHOOK_AUTH`

Voor credit packs zijn dit op dit moment de standaard Google product-id's:

- `credits.assignment.start`
- `credits.assignment.basis`
- `credits.assignment.standaard`
- `credits.assignment.plus`
- `credits.assignment.voordeel`

Belangrijke nuance:

- `jaarabonnement` wordt in de huidige code niet als standaard RevenueCat credit-pack fallback behandeld
- als je die via Google Play wilt verkopen, map hem expliciet via `public.iap_products`
- hetzelfde geldt voor therapeut-abonnementen en afwijkende slug/product-id combinaties

### Juiste Android App Bundle uploaden

Voor Google Play moet je een **signed release** bundle uploaden.

Gebruik bij voorkeur Android Studio:

1. `Build`
2. `Generate Signed Bundle / APK`
3. kies `Android App Bundle`
4. kies je release keystore
5. kies `release`

De signed bundle staat daarna normaal hier:

- `/Users/dannygeurts/Documents/pure-therapeutic-art/android/app/release/app-release.aab`

Let op:

- de bundle in `android/app/build/outputs/bundle/release/app-release.aab` kan unsigned zijn als je alleen `./gradlew bundleRelease` draait zonder vaste Gradle signing config
- upload in Play Console dus de signed Android Studio output uit `android/app/release/`

### Waarom betalingen soms niet testbaar lijken

Dat gevoel klopt meestal in een van deze situaties:

- de app is wel via Internal testing verspreid, maar de tester is geen `license tester`
- `NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY` ontbreekt op de server
- `CREDIT_PACK_PURCHASE_MODE` of `EBOOK_PURCHASE_MODE` staat nog op `disabled`
- het product bestaat nog niet in Google Play
- het product-id in Play wijkt af van RevenueCat of de app
- de app is buiten Play om geïnstalleerd in plaats van via de testtrack
