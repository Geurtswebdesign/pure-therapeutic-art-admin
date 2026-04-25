import { createAdminClient } from "@/lib/supabase/admin";
import { getSubscriptionPackKind } from "@/lib/iap/subscription-products";

export type DateRange = {
  from: Date;
  to: Date;
};

type EcommercePurchaseStore = "apple" | "google" | "other";

const APPLE_SOURCES = new Set(["apple", "app_store", "appstore", "ios"]);
const GOOGLE_SOURCES = new Set(["google", "play_store", "playstore", "android"]);

type RevenueInput = {
  amountCents: number | null | undefined;
  currency: string | null | undefined;
  createdAt: string | null | undefined;
  source?: string | null;
  note?: string | null;
};

type RevenueSummary = {
  revenueByCurrency: Map<string, number>;
  storeRevenueByCurrency: Map<
    string,
    { appleAmountCents: number; googleAmountCents: number; otherAmountCents: number }
  >;
  transactions: number;
};

type IapRevenueRow = {
  platform: string | null;
  store_transaction_id: string | null;
  amount_cents: number | null;
  currency: string | null;
  created_at?: string | null;
  pack_id?: string | null;
};

type CreditPackRevenueRow = {
  amount_cents: number | null;
  credits_total?: number | null;
  currency: string | null;
  created_at: string | null;
  source: string | null;
  note: string | null;
  external_ref?: string | null;
};

function detectPurchaseStore(
  source: string | null | undefined,
  note: string | null | undefined
): EcommercePurchaseStore {
  const normalizedSource = source?.trim().toLowerCase() ?? "";
  if (APPLE_SOURCES.has(normalizedSource)) return "apple";
  if (GOOGLE_SOURCES.has(normalizedSource)) return "google";

  const normalizedNote = note?.trim().toLowerCase() ?? "";
  if (/\bapple\s+(iap|revenuecat)\b/.test(normalizedNote)) return "apple";
  if (/\bgoogle\s+(iap|revenuecat)\b/.test(normalizedNote)) return "google";

  return "other";
}

function normalizeCurrency(currency: string | null | undefined) {
  return currency?.trim().toUpperCase() || "EUR";
}

function createRevenueSummary(): RevenueSummary {
  return {
    revenueByCurrency: new Map(),
    storeRevenueByCurrency: new Map(),
    transactions: 0,
  };
}

function addRevenue(summary: RevenueSummary, input: RevenueInput) {
  const amountCents = Number(input.amountCents ?? 0);
  if (!Number.isFinite(amountCents)) {
    return;
  }

  summary.transactions += 1;

  const currency = normalizeCurrency(input.currency);
  summary.revenueByCurrency.set(
    currency,
    (summary.revenueByCurrency.get(currency) ?? 0) + amountCents
  );

  const storeRevenue = summary.storeRevenueByCurrency.get(currency) ?? {
    appleAmountCents: 0,
    googleAmountCents: 0,
    otherAmountCents: 0,
  };
  const purchaseStore = detectPurchaseStore(input.source, input.note);
  if (purchaseStore === "apple") {
    storeRevenue.appleAmountCents += amountCents;
  } else if (purchaseStore === "google") {
    storeRevenue.googleAmountCents += amountCents;
  } else {
    storeRevenue.otherAmountCents += amountCents;
  }
  summary.storeRevenueByCurrency.set(currency, storeRevenue);
}

function getIapRevenueByTransactionId(rows: IapRevenueRow[] | null | undefined) {
  return new Map(
    (rows ?? [])
      .filter((row) => row.store_transaction_id)
      .map((row) => [row.store_transaction_id as string, row])
  );
}

function getCreditPackRevenueInput(
  row: CreditPackRevenueRow,
  iapRevenueByTransactionId: Map<string, IapRevenueRow>
): RevenueInput {
  const iapRevenue = row.external_ref
    ? iapRevenueByTransactionId.get(row.external_ref)
    : null;

  return {
    amountCents: iapRevenue?.amount_cents ?? row.amount_cents,
    currency: iapRevenue?.currency ?? row.currency,
    createdAt: row.created_at,
    source: iapRevenue?.platform ?? row.source,
    note: row.note,
  };
}

async function getSubscriptionIapRevenueRows(
  supabase: ReturnType<typeof createAdminClient>,
  range: DateRange
) {
  const { data: iapRows } = await supabase
    .from("iap_transactions")
    .select("platform, store_transaction_id, amount_cents, currency, created_at, pack_id")
    .gte("created_at", range.from.toISOString())
    .lte("created_at", range.to.toISOString())
    .not("pack_id", "is", null)
    .returns<IapRevenueRow[]>();

  const packIds = Array.from(
    new Set(
      (iapRows ?? [])
        .map((row) => row.pack_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  if (!packIds.length) {
    return [] as IapRevenueRow[];
  }

  const { data: packs } = await supabase
    .from("credit_packs")
    .select("id, slug")
    .in("id", packIds)
    .returns<Array<{ id: string; slug: string | null }>>();
  const subscriptionPackIds = new Set(
    (packs ?? [])
      .filter((pack) => getSubscriptionPackKind(pack.slug))
      .map((pack) => pack.id)
  );

  if (!subscriptionPackIds.size) {
    return [] as IapRevenueRow[];
  }

  return (iapRows ?? []).filter(
    (row) => row.pack_id && subscriptionPackIds.has(row.pack_id)
  );
}

export function resolveMonthRange(month: string | undefined): DateRange | null {
  if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return null;
  }

  const [yearRaw, monthRaw] = month.split("-");
  const year = Number.parseInt(yearRaw, 10);
  const monthIndex = Number.parseInt(monthRaw, 10) - 1;

  if (!Number.isInteger(year) || !Number.isInteger(monthIndex)) {
    return null;
  }

  const from = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  const to = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0, 0) - 1);
  return { from, to };
}

export function resolveRange(range: string | undefined): DateRange {
  const now = new Date();
  const days =
    range === "7d" ? 7 : range === "28d" ? 28 : range === "90d" ? 90 : 30;
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { from, to: now };
}

export async function getTrafficOverview(range: DateRange) {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("analytics_overview", {
    from_ts: range.from.toISOString(),
    to_ts: range.to.toISOString(),
  });

  const row = Array.isArray(data) ? data[0] : data;
  return {
    pageviews: Number(row?.pageviews ?? 0),
    uniqueVisitors: Number(row?.unique_visitors ?? 0),
    sessions: Number(row?.sessions ?? 0),
  };
}

export async function getTopPages(range: DateRange, limit = 10) {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("analytics_top_pages", {
    from_ts: range.from.toISOString(),
    to_ts: range.to.toISOString(),
    limit_n: limit,
  });
  return (data ?? []) as Array<{
    path: string;
    pageviews: number;
    unique_visitors: number;
  }>;
}

export async function getTopReferrers(range: DateRange, limit = 8) {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("analytics_top_referrers", {
    from_ts: range.from.toISOString(),
    to_ts: range.to.toISOString(),
    limit_n: limit,
  });
  return (data ?? []) as Array<{ referrer: string; pageviews: number }>;
}

export async function getTopSources(range: DateRange, limit = 8) {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("analytics_top_sources", {
    from_ts: range.from.toISOString(),
    to_ts: range.to.toISOString(),
    limit_n: limit,
  });
  return (data ?? []) as Array<{ source: string; pageviews: number }>;
}

export async function getDeviceBreakdown(range: DateRange) {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("analytics_device_breakdown", {
    from_ts: range.from.toISOString(),
    to_ts: range.to.toISOString(),
  });
  return (data ?? []) as Array<{ device: string; pageviews: number }>;
}

export async function getDailyPageviews(range: DateRange) {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("analytics_daily_pageviews", {
    from_ts: range.from.toISOString(),
    to_ts: range.to.toISOString(),
  });
  return (data ?? []) as Array<{ day: string; pageviews: number }>;
}

export async function getCampaigns(range: DateRange, limit = 15) {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("analytics_campaigns", {
    from_ts: range.from.toISOString(),
    to_ts: range.to.toISOString(),
    limit_n: limit,
  });
  return (data ?? []) as Array<{ campaign: string; pageviews: number }>;
}

export async function getSocialReferrers(range: DateRange, limit = 10) {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("analytics_social_referrers", {
    from_ts: range.from.toISOString(),
    to_ts: range.to.toISOString(),
    limit_n: limit,
  });
  return (data ?? []) as Array<{ network: string; pageviews: number }>;
}

export async function getAiReferrers(range: DateRange, limit = 10) {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("analytics_ai_referrers", {
    from_ts: range.from.toISOString(),
    to_ts: range.to.toISOString(),
    limit_n: limit,
  });
  return (data ?? []) as Array<{ source: string; pageviews: number }>;
}

export async function getCountries(range: DateRange, limit = 20) {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("analytics_country_breakdown", {
    from_ts: range.from.toISOString(),
    to_ts: range.to.toISOString(),
    limit_n: limit,
  });
  return (data ?? []) as Array<{ country: string; pageviews: number }>;
}

export async function getTopEvents(range: DateRange, limit = 20) {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("analytics_top_events", {
    from_ts: range.from.toISOString(),
    to_ts: range.to.toISOString(),
    limit_n: limit,
  });
  return (data ?? []) as Array<{
    event_name: string;
    event_category: string;
    total: number;
  }>;
}

export async function getTopEventsByCategoryPrefix(
  range: DateRange,
  categoryPrefix: string,
  limit = 20
) {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("analytics_top_events_by_category", {
    from_ts: range.from.toISOString(),
    to_ts: range.to.toISOString(),
    category_prefix: categoryPrefix,
    limit_n: limit,
  });
  return (data ?? []) as Array<{
    event_name: string;
    event_category: string;
    total: number;
  }>;
}

export async function getRealtime(minutes = 30) {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("analytics_realtime", {
    minutes,
  });
  return (data ?? []) as Array<{ minute: string; pageviews: number }>;
}

export async function getPerfMetrics(range: DateRange) {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("analytics_perf_metrics", {
    from_ts: range.from.toISOString(),
    to_ts: range.to.toISOString(),
  });
  return (data ?? []) as Array<{
    metric: string;
    avg_value: number;
    p95_value: number;
  }>;
}

export async function getRecentExceptions(range: DateRange, limit = 15) {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("analytics_recent_exceptions", {
    from_ts: range.from.toISOString(),
    to_ts: range.to.toISOString(),
    limit_n: limit,
  });
  return (data ?? []) as Array<{ event_label: string; total: number }>;
}

export async function getOsBreakdown(range: DateRange) {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("analytics_os_breakdown", {
    from_ts: range.from.toISOString(),
    to_ts: range.to.toISOString(),
  });
  return (data ?? []) as Array<{ os: string; pageviews: number }>;
}

export async function getBrowserBreakdown(range: DateRange) {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("analytics_browser_breakdown", {
    from_ts: range.from.toISOString(),
    to_ts: range.to.toISOString(),
  });
  return (data ?? []) as Array<{ browser: string; pageviews: number }>;
}

export async function getEcommerceOverview(range: DateRange) {
  const supabase = createAdminClient();
  const [
    { data: creditPackPurchases },
    { data: ebookPurchases },
    { data: websiteOrderItems },
  ] = await Promise.all([
    supabase
      .from("credit_pack_purchases")
      .select("amount_cents, credits_total, currency, created_at, source, note, external_ref")
      .gte("created_at", range.from.toISOString())
      .lte("created_at", range.to.toISOString()),
    supabase
      .from("app_ebook_purchases")
      .select("amount_cents, currency, source, external_reference, purchased_at, purchase_status")
      .eq("purchase_status", "paid")
      .gte("purchased_at", range.from.toISOString())
      .lte("purchased_at", range.to.toISOString()),
    supabase
      .from("website_order_items")
      .select("amount_cents, currency, source, external_order_id, occurred_at")
      .gte("occurred_at", range.from.toISOString())
      .lte("occurred_at", range.to.toISOString()),
  ]);
  const creditPackExternalRefs = Array.from(
    new Set(
      (creditPackPurchases ?? [])
        .map((row) => row.external_ref?.trim())
        .filter((value): value is string => Boolean(value))
    )
  );
  const { data: iapRevenueRows } = creditPackExternalRefs.length
    ? await supabase
        .from("iap_transactions")
        .select("platform, store_transaction_id, amount_cents, currency")
        .in("store_transaction_id", creditPackExternalRefs)
        .returns<IapRevenueRow[]>()
    : { data: [] as IapRevenueRow[] };
  const iapRevenueByTransactionId = getIapRevenueByTransactionId(iapRevenueRows);
  const subscriptionIapRevenueRows = await getSubscriptionIapRevenueRows(
    supabase,
    range
  );

  const summary = createRevenueSummary();
  let creditsSold = 0;

  for (const row of creditPackPurchases ?? []) {
    creditsSold += Number(row.credits_total ?? 0);
    addRevenue(summary, getCreditPackRevenueInput(row, iapRevenueByTransactionId));
  }

  for (const row of ebookPurchases ?? []) {
    addRevenue(summary, {
      amountCents: row.amount_cents,
      currency: row.currency,
      createdAt: row.purchased_at,
      source: row.source,
      note: row.external_reference,
    });
  }

  for (const row of websiteOrderItems ?? []) {
    addRevenue(summary, {
      amountCents: row.amount_cents,
      currency: row.currency,
      createdAt: row.occurred_at,
      source: row.source,
      note: row.external_order_id,
    });
  }

  for (const row of subscriptionIapRevenueRows) {
    addRevenue(summary, {
      amountCents: row.amount_cents,
      currency: row.currency,
      createdAt: row.created_at,
      source: row.platform,
      note: row.store_transaction_id,
    });
  }

  const revenueEntries = Array.from(summary.revenueByCurrency.entries()).map(
    ([currency, amountCents]) => ({
      currency,
      amountCents,
    })
  );
  const storeRevenueEntries = Array.from(
    summary.storeRevenueByCurrency.entries()
  ).map(([currency, amounts]) => ({
    currency,
    ...amounts,
  }));

  return {
    revenueEntries,
    storeRevenueEntries,
    creditsSold,
    transactions: summary.transactions,
  };
}

export async function getEcommerceDailyRevenue(range: DateRange) {
  const supabase = createAdminClient();
  const [
    { data: creditPackPurchases },
    { data: ebookPurchases },
    { data: websiteOrderItems },
  ] = await Promise.all([
    supabase
      .from("credit_pack_purchases")
      .select("amount_cents, currency, created_at, source, note, external_ref")
      .gte("created_at", range.from.toISOString())
      .lte("created_at", range.to.toISOString())
      .order("created_at", { ascending: true }),
    supabase
      .from("app_ebook_purchases")
      .select("amount_cents, currency, purchased_at, purchase_status")
      .eq("purchase_status", "paid")
      .gte("purchased_at", range.from.toISOString())
      .lte("purchased_at", range.to.toISOString())
      .order("purchased_at", { ascending: true }),
    supabase
      .from("website_order_items")
      .select("amount_cents, currency, occurred_at")
      .gte("occurred_at", range.from.toISOString())
      .lte("occurred_at", range.to.toISOString())
      .order("occurred_at", { ascending: true }),
  ]);
  const creditPackExternalRefs = Array.from(
    new Set(
      (creditPackPurchases ?? [])
        .map((row) => row.external_ref?.trim())
        .filter((value): value is string => Boolean(value))
    )
  );
  const { data: iapRevenueRows } = creditPackExternalRefs.length
    ? await supabase
        .from("iap_transactions")
        .select("platform, store_transaction_id, amount_cents, currency")
        .in("store_transaction_id", creditPackExternalRefs)
        .returns<IapRevenueRow[]>()
    : { data: [] as IapRevenueRow[] };
  const iapRevenueByTransactionId = getIapRevenueByTransactionId(iapRevenueRows);
  const subscriptionIapRevenueRows = await getSubscriptionIapRevenueRows(
    supabase,
    range
  );

  const dailyMap = new Map<string, number>();
  const addDailyRevenue = (input: RevenueInput) => {
    if (!input.createdAt) {
      return;
    }

    const amountCents = Number(input.amountCents ?? 0);
    if (!Number.isFinite(amountCents)) {
      return;
    }

    const day = new Date(input.createdAt).toISOString().slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + amountCents);
  };

  for (const row of creditPackPurchases ?? []) {
    addDailyRevenue(getCreditPackRevenueInput(row, iapRevenueByTransactionId));
  }

  for (const row of ebookPurchases ?? []) {
    addDailyRevenue({
      amountCents: row.amount_cents,
      currency: row.currency,
      createdAt: row.purchased_at,
    });
  }

  for (const row of websiteOrderItems ?? []) {
    addDailyRevenue({
      amountCents: row.amount_cents,
      currency: row.currency,
      createdAt: row.occurred_at,
    });
  }

  for (const row of subscriptionIapRevenueRows) {
    addDailyRevenue({
      amountCents: row.amount_cents,
      currency: row.currency,
      createdAt: row.created_at,
      source: row.platform,
      note: row.store_transaction_id,
    });
  }

  return Array.from(dailyMap.entries()).map(([day, amountCents]) => ({
    day,
    amountCents,
  }));
}

export async function getTopCreditPacks(range: DateRange, limit = 6) {
  const supabase = createAdminClient();
  const { data: purchases } = await supabase
    .from("credit_pack_purchases")
    .select("pack_id, amount_cents, credits_total, created_at")
    .gte("created_at", range.from.toISOString())
    .lte("created_at", range.to.toISOString());

  const totals = new Map<string, { count: number; revenue: number; credits: number }>();
  for (const row of purchases ?? []) {
    const packId = row.pack_id as string | null;
    if (!packId) continue;
    const current = totals.get(packId) ?? { count: 0, revenue: 0, credits: 0 };
    current.count += 1;
    current.revenue += Number(row.amount_cents ?? 0);
    current.credits += Number(row.credits_total ?? 0);
    totals.set(packId, current);
  }

  const packIds = Array.from(totals.keys());
  const { data: packs } = packIds.length
    ? await supabase
        .from("credit_packs")
        .select("id, name, key")
        .in("id", packIds)
    : { data: [] as Array<{ id: string; name: string | null; key: string | null }> };

  const packById = new Map((packs ?? []).map((row) => [row.id, row]));
  const rows = Array.from(totals.entries()).map(([packId, summary]) => {
    const pack = packById.get(packId);
    const label = pack?.name || pack?.key || packId;
    return {
      packId,
      label,
      count: summary.count,
      revenue: summary.revenue,
      credits: summary.credits,
    };
  });

  return rows.sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

export async function getTopCoupons(range: DateRange, limit = 10) {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("analytics_ecommerce_coupons", {
    from_ts: range.from.toISOString(),
    to_ts: range.to.toISOString(),
    limit_n: limit,
  });
  return (data ?? []) as Array<{ code: string; total: number }>;
}

export async function getCartAbandonment(range: DateRange, limit = 10) {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("analytics_ecommerce_cart_abandonment", {
    from_ts: range.from.toISOString(),
    to_ts: range.to.toISOString(),
    limit_n: limit,
  });
  return (data ?? []) as Array<{ item: string; total: number }>;
}

export async function getEcommerceFunnel(range: DateRange) {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("analytics_ecommerce_funnel", {
    from_ts: range.from.toISOString(),
    to_ts: range.to.toISOString(),
  });
  return (data ?? []) as Array<{ step: string; total: number }>;
}
