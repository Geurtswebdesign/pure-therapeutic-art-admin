# Website Order Sync

Gebruik `POST /api/orders/sync` om websitebestellingen naar de app te synchroniseren.

## Beveiliging

- Zet `WEBSITE_ORDER_SYNC_SECRET` in productie.
- Stuur dezelfde waarde mee in header `x-order-sync-secret`.

## Doel

- `Mijn aankopen` toont website-orders direct mee.
- E-books en hoofdstukken met een geldige `contentItemId` of `contentSlug` worden ook als app-toegang gekoppeld via `content_unlocks`.

## Payload

```json
{
  "source": "website",
  "items": [
    {
      "externalOrderId": "wc-order-1001",
      "externalLineId": "wc-line-1",
      "userId": "app-user-uuid",
      "customerEmail": "klant@example.com",
      "kind": "ebook",
      "title": "Rouwverwerking werkboek",
      "subtitle": "Websitebestelling",
      "amountCents": 1995,
      "currency": "EUR",
      "occurredAt": "2026-03-23T10:15:00.000Z",
      "contentSlug": "rouwverwerking-werkboek",
      "metadata": {
        "provider": "woocommerce"
      }
    }
  ]
}
```

## `kind`

- `purchase`
- `ebook`
- `subscription`
- `credit_pack`

## Belangrijk

- Voor beveiligde app-toegang van e-books of hoofdstukken moet de payload een `userId` meesturen.
- Als alleen `customerEmail` wordt meegestuurd, verschijnt de bestelling wel in `Mijn aankopen`, en wordt die later aan een account gekoppeld zodra dat account dezelfde e-mail gebruikt.
- Voor leesbare content in de app moet ook `contentItemId` of `contentSlug` meegestuurd worden.
