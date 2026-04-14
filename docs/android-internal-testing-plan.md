# Android Internal Testing Plan

## Doel

Dit plan is bedoeld voor testers van de Android app via Google Play `Internal testing`.
De focus ligt op:

- installatie en update via Google Play
- inloggen en basisnavigatie
- aankopen van opdrachtcredits
- aankopen van abonnementen
- correcte verwerking van rechten en toegang na aankoop

## Voor wie

Gebruik dit plan voor:

- interne testers met een Android toestel
- testers met een Android emulator met `Google Play`

Gebruik waar mogelijk een echt Android toestel. Dat geeft de meest betrouwbare resultaten
voor Play Billing.

## Voorwaarden

De tester moet:

- toegevoegd zijn aan de `Internal testing` testerslijst in Google Play Console
- dezelfde Google-account gebruiken op het toestel als op de testerslijst
- voor betaaltests ook als `license tester` zijn toegevoegd in Google Play Console
- de opt-in link voor de testtrack hebben geopend en geaccepteerd

## Installatie-instructie voor testers

### Android toestel

1. Open de opt-in link voor de interne test op het Android toestel.
2. Controleer dat je bent ingelogd met het juiste Google-account.
3. Accepteer deelname aan de test.
4. Open daarna Google Play.
5. Zoek `Pure Grief and Therapeutic ART` of open de app via de opt-in pagina.
6. Installeer of update de app.
7. Open de app pas nadat de Play-installatie volledig klaar is.

## Wat testers eerst moeten noteren

Voor de eerste teststap noteert de tester:

- naam
- e-mailadres van het testaccount
- toestelmodel
- datum en tijd van de test

## Testscenario's

### 1. Installatie en opstart

Doel:
- bevestigen dat de app correct installeert en start

Stappen:
1. Installeer of update de app via Google Play internal testing.
2. Open de app.
3. Controleer of het splash-scherm en de eerste laadstap normaal verlopen.
4. Controleer of Home zichtbaar wordt zonder vastlopers of wit scherm.

Noteer:
- lukte installatie of update
- duurde eerste opstart opvallend lang
- kwam er een foutmelding of crash

### 2. Inloggen en accounttoegang

Doel:
- bevestigen dat accounttoegang werkt

Stappen:
1. Open de loginflow.
2. Log in met een bestaand testaccount.
3. Controleer of Account en Profiel bereikbaar zijn.
4. Log uit en log opnieuw in.

Noteer:
- werkte login direct of pas na herhalen
- werkte logout correct
- kwam de gebruiker terug op de juiste plek

### 3. Wachtwoord vergeten

Doel:
- bevestigen dat de herstelstroom werkt

Stappen:
1. Open `Wachtwoord vergeten?`
2. Vraag een resetmail aan.
3. Controleer of de mail binnenkomt.
4. Rond de reset af indien gewenst.

Noteer:
- kwam de mail binnen
- hoe lang duurde dat
- werkte de resetlink correct

### 4. Basisnavigatie

Doel:
- bevestigen dat hoofdonderdelen stabiel werken

Test minimaal:
- Home
- Trainingen
- Shop
- Therapeuten
- Profiel / Account

Noteer:
- ontbrekende content
- layoutproblemen
- trage schermen
- foutmeldingen

### 5. Opdrachtcredits kopen

Doel:
- bevestigen dat one-time purchases via Google Play werken

Te testen producten:
- `credits.assignment.start`
- `credits.assignment.basis`
- `credits.assignment.standaard`
- optioneel ook `plus` en `voordeel`

Stappen:
1. Ga naar `Shop` > opdrachtcredits.
2. Kies een creditpakket.
3. Rond de Google Play testpurchase af.
4. Ga na aankoop naar het account of een relevant content-item.
5. Controleer of credits zijn toegekend.

Noteer:
- welk pakket is gekocht
- prijsweergave in de aankoopflow
- of de aankoop direct lukte
- of credits direct zichtbaar waren
- of een herstart nodig was

### 5a. Categorieën openen en controleren

Doel:
- bevestigen dat categorie-overzichten goed laden en logisch opgebouwd zijn

Stappen:
1. Open de contentbibliotheek of content-overzicht.
2. Open meerdere categorieën.
3. Controleer of de juiste thema's of content-items zichtbaar zijn.
4. Controleer of titels, aantallen en afbeeldingen logisch zijn.

Noteer:
- welke categorieën zijn getest
- of categoriepagina's correct laadden
- of er content ontbrak of dubbel stond
- of je een leeg scherm of foutmelding kreeg

### 5b. Thema's openen en navigeren

Doel:
- bevestigen dat themapagina's en subthema's correct werken

Stappen:
1. Open meerdere thema's vanuit een categorie of overzicht.
2. Controleer of beschrijving, secties en gekoppelde items zichtbaar zijn.
3. Open een subthema als dat aanwezig is.
4. Navigeer terug en open nog een ander thema.

Noteer:
- welke thema's zijn getest
- of secties en gekoppelde items correct zichtbaar waren
- of subthema's goed laadden
- of je dubbele of fout gekoppelde items zag

### 5c. Werkvormen ontgrendelen

Doel:
- bevestigen dat vergrendelde werkvormen correct met credits kunnen worden ontgrendeld

Stappen:
1. Open een vergrendelde werkvorm of ander vergrendeld content-item.
2. Controleer of de lockout-weergave duidelijk is.
3. Ontgrendel het item met credits.
4. Controleer direct daarna of het item opent.
5. Sluit het item en open het opnieuw via thema of categorie.

Noteer:
- welk item is ontgrendeld
- hoeveel credits het item kostte
- of het creditsaldo correct daalde
- of het item direct toegankelijk werd
- of het item na opnieuw openen ontgrendeld bleef

### 5d. Ontgrendelde content terugvinden

Doel:
- bevestigen dat eenmaal ontgrendelde content daarna logisch terug te vinden blijft

Stappen:
1. Ontgrendel een werkvorm.
2. Ga terug naar het thema-overzicht.
3. Controleer of hetzelfde item daar nu zonder blokkade opent.
4. Ga terug naar categorie of account en controleer dezelfde content opnieuw.

Noteer:
- of ontgrendelde content overal consistent beschikbaar was
- of een thema nog steeds een betaalmuur toonde terwijl het item al ontgrendeld was
- of refresh of app-herstart nodig was

### 5e. Taal en ontgrendeling samen controleren

Doel:
- bevestigen dat vertaalde varianten correct werken na ontgrendeling

Stappen:
1. Ontgrendel een item dat ook in een andere taal bestaat.
2. Open hetzelfde item opnieuw in de huidige taal.
3. Wissel de profieltaal indien beschikbaar.
4. Open dezelfde inhoud opnieuw via thema of categorie.

Noteer:
- welke taal actief was
- of de juiste vertaalde variant werd getoond
- of de app correct terugviel op de standaardtaal als geen vertaling bestond
- of een eenmaal ontgrendeld item ook in de andere taal toegankelijk bleef

### 6. Jaarabonnement kopen

Doel:
- bevestigen dat het jaarabonnement via subscription-flow werkt

Te testen product:
- `jaarabonnement`

Stappen:
1. Ga naar `Shop`.
2. Open het jaarabonnement.
3. Rond de Google Play subscription testpurchase af.
4. Ga naar content die normaal aankoop of credits vereist.
5. Controleer of toegang nu via het jaarabonnement wordt verleend.

Noteer:
- startte de aankoopflow correct
- werd het abonnement succesvol afgerond
- werd toegang direct geactiveerd
- zag je ergens nog onterecht een betaalmuur

### 7. Therapeut-abonnement kopen

Doel:
- bevestigen dat therapeut-subscriptions werken

Te testen producten:
- `therapeut:therapeut-maand`
- `therapeut:therapeut-jaar`

Stappen:
1. Ga naar de shopsectie voor therapeut-abonnementen.
2. Start een aankoop van maand of jaar.
3. Rond de Google Play subscription testpurchase af.
4. Controleer of het account daarna de juiste therapeut-rechten toont.

Noteer:
- welk abonnement is getest
- werkte de aankoopflow
- werd de entitlement correct toegekend
- was er verschil tussen maand en jaar

### 8. Toegang na aankoop controleren

Doel:
- bevestigen dat rechten na aankoop correct doorwerken

Controleer na aankopen:
- credits zichtbaar in account of relevante flow
- toegang tot premium content
- juiste status van jaarabonnement
- juiste status van therapeut-abonnement
- toegang tot ontgrendelde werkvormen via categorieën en thema's

Noteer:
- wat direct werkte
- wat pas na refresh of herstart werkte
- wat helemaal niet werkte
- of ontgrendelde items via alle routes bereikbaar bleven

### 9. Herstart en opnieuw openen

Doel:
- bevestigen dat aankopen blijven bestaan na afsluiten van de app

Stappen:
1. Sluit de app volledig af.
2. Open de app opnieuw.
3. Controleer of aankopen en rechten behouden zijn.

Noteer:
- verdwenen rechten
- vertraagde synchronisatie
- afwijking tussen vorige en nieuwe sessie

## Wat testers bij een bug moeten noteren

Vraag testers om per bug exact dit vast te leggen:

- korte titel van het probleem
- datum en tijd
- toestelmodel
- Android-versie
- appversie
- testaccount e-mailadres
- welk product of scherm betrokken was
- exacte stappen om het probleem te reproduceren
- verwacht resultaat
- werkelijk resultaat
- screenshot of schermopname
- of het probleem altijd of soms gebeurt

## Eenvoudig meldformat voor testers

Gebruik dit format per bevinding:

```text
Titel:
Datum/tijd:
Tester:
Toestel:
Android-versie:
Account:

Scenario:
Stappen:
1.
2.
3.

Verwacht:
Werkelijk:

Product:
Bijlage:
Herhaalbaar: ja/nee
Extra notities:
```

## Wat testers aan het einde moeten samenvatten

Vraag elke tester om aan het einde kort te rapporteren:

- installatie gelukt: ja/nee
- login gelukt: ja/nee
- credits aankoop getest: ja/nee
- categorieën getest: ja/nee
- thema's getest: ja/nee
- werkvorm ontgrendelen getest: ja/nee
- jaarabonnement getest: ja/nee
- therapeut-abonnement getest: ja/nee
- blokkerende bugs: aantal
- niet-blokkerende bugs: aantal
- algemene indruk in 1 of 2 zinnen
