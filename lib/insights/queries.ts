import { createAdminClient } from "@/lib/supabase/admin";

export type DateRange = {
  from: Date;
  to: Date;
};

type EcommercePurchaseStore = "apple" | "google" | "other";

const APPLE_SOURCES = new Set([
  "apple",
  "appstore",
  "appleappstore",
  "ios",
]);
const GOOGLE_SOURCES = new Set([
  "google",
  "playstore",
  "googleplay",
  "android",
]);

type RevenueInput = {
  amountCents: number | null | undefined;
  currency: string | null | undefined;
  createdAt: string | null | undefined;
  source?: string | null;
  note?: string | null;
  environment?: string | null;
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
  raw_payload?: unknown;
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

type AdminCreditPackPurchaseRow = {
  id: string;
  user_id: string;
  pack_id: string | null;
  quantity: number | null;
  credits_total: number | null;
  amount_cents: number | null;
  currency: string | null;
  created_at: string | null;
  note: string | null;
};

type AdminEntitlementRow = {
  id: string;
  user_id: string;
  entitlement_key: string;
  created_at: string | null;
  created_by: string | null;
  metadata: Record<string, unknown> | null;
};

export type AdminAssignedProductRow = {
  id: string;
  createdAt: string | null;
  userId: string;
  userName: string;
  adminId: string | null;
  adminName: string;
  productName: string;
  productType: "credits" | "subscription";
  quantity: number | null;
  amountCents: number | null;
  currency: string;
  note: string | null;
};

const HIDDEN_ADMIN_ASSIGNED_PRODUCT_USER_IDS = new Set([
  "f10d25c3-2c29-4702-bc7f-c9788db7f3a7",
  "56dc360f-c807-4b55-9cda-7cdd61f2501a",
  "293e46f1-5d36-4fcd-9abd-caf84fe426ec",
]);

function detectPurchaseStore(
  source: string | null | undefined,
  note: string | null | undefined
): EcommercePurchaseStore {
  const normalizedSource = source?.trim().toLowerCase() ?? "";
  const compactSource = normalizedSource.replace(/[\s_-]+/g, "");
  if (APPLE_SOURCES.has(normalizedSource)) return "apple";
  if (GOOGLE_SOURCES.has(normalizedSource)) return "google";
  if (APPLE_SOURCES.has(compactSource)) return "apple";
  if (GOOGLE_SOURCES.has(compactSource)) return "google";

  const normalizedNote = note?.trim().toLowerCase() ?? "";
  if (/\b(apple|app[-_\s]?store|ios)\s+(iap|revenuecat|store|order)\b/.test(normalizedNote)) {
    return "apple";
  }
  if (/\b(google|google[-_\s]?play|play[-_\s]?store|android)\s+(iap|revenuecat|store|order)\b/.test(normalizedNote)) {
    return "google";
  }

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

function isSandboxEnvironment(environment: string | null | undefined) {
  return environment?.trim().toUpperCase() === "SANDBOX";
}

function addRevenue(summary: RevenueSummary, input: RevenueInput) {
  const amountCents = Number(input.amountCents ?? 0);
  if (!Number.isFinite(amountCents)) {
    return;
  }

  const currency = normalizeCurrency(input.currency);
  if (isSandboxEnvironment(input.environment)) {
    return;
  }

  summary.transactions += 1;

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

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function shortUserId(userId: string | null | undefined) {
  if (!userId) {
    return "Onbekend";
  }

  return userId.length > 8 ? `${userId.slice(0, 8)}...` : userId;
}

function getRevenueCatEnvironment(rawPayload: unknown) {
  const payload = asObject(rawPayload);
  const event = asObject(payload?.event);
  const environment = event?.environment ?? payload?.environment;
  return typeof environment === "string" ? environment : null;
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
    environment: getRevenueCatEnvironment(iapRevenue?.raw_payload),
  };
}

function isProductionRevenueInput(input: RevenueInput) {
  return !isSandboxEnvironment(input.environment);
}

function isStoreBackedPurchase(row: {
  source?: string | null;
  note?: string | null;
}) {
  return detectPurchaseStore(row.source, row.note) !== "other";
}

function isAdminAssignedPurchase(row: { source?: string | null }) {
  return row.source?.trim().toLowerCase() === "admin";
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
    { data: iapRevenueRows },
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
    supabase
      .from("iap_transactions")
      .select("platform, store_transaction_id, amount_cents, currency, created_at, pack_id, raw_payload")
      .gte("created_at", range.from.toISOString())
      .lte("created_at", range.to.toISOString())
      .returns<IapRevenueRow[]>(),
  ]);
  const iapRevenueByTransactionId = getIapRevenueByTransactionId(iapRevenueRows);

  const summary = createRevenueSummary();
  let creditsSold = 0;

  for (const row of creditPackPurchases ?? []) {
    const revenueInput = getCreditPackRevenueInput(row, iapRevenueByTransactionId);
    if (isProductionRevenueInput(revenueInput)) {
      creditsSold += Number(row.credits_total ?? 0);
    }
    if (isAdminAssignedPurchase(row)) {
      continue;
    }
    if (isStoreBackedPurchase(row)) {
      continue;
    }
    addRevenue(summary, revenueInput);
  }

  for (const row of ebookPurchases ?? []) {
    if (isStoreBackedPurchase({ source: row.source, note: row.external_reference })) {
      continue;
    }
    addRevenue(summary, {
      amountCents: row.amount_cents,
      currency: row.currency,
      createdAt: row.purchased_at,
      source: row.source,
      note: row.external_reference,
      environment: null,
    });
  }

  for (const row of websiteOrderItems ?? []) {
    addRevenue(summary, {
      amountCents: row.amount_cents,
      currency: row.currency,
      createdAt: row.occurred_at,
      source: row.source,
      note: row.external_order_id,
      environment: null,
    });
  }

  for (const row of iapRevenueRows ?? []) {
    addRevenue(summary, {
      amountCents: row.amount_cents,
      currency: row.currency,
      createdAt: row.created_at,
      source: row.platform,
      note: row.store_transaction_id,
      environment: getRevenueCatEnvironment(row.raw_payload),
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

export async function getAdminAssignedProducts(
  range: DateRange
): Promise<AdminAssignedProductRow[]> {
  const supabase = createAdminClient();
  const [{ data: purchases }, { data: entitlements }] = await Promise.all([
    supabase
      .from("credit_pack_purchases")
      .select("id, user_id, pack_id, quantity, credits_total, amount_cents, currency, created_at, note")
      .eq("source", "admin")
      .gte("created_at", range.from.toISOString())
      .lte("created_at", range.to.toISOString())
      .order("created_at", { ascending: false })
      .returns<AdminCreditPackPurchaseRow[]>(),
    supabase
      .from("user_entitlements")
      .select("id, user_id, entitlement_key, created_at, created_by, metadata")
      .eq("source", "admin")
      .gte("created_at", range.from.toISOString())
      .lte("created_at", range.to.toISOString())
      .order("created_at", { ascending: false })
      .returns<AdminEntitlementRow[]>(),
  ]);
  const visiblePurchases = (purchases ?? []).filter(
    (row) => !HIDDEN_ADMIN_ASSIGNED_PRODUCT_USER_IDS.has(row.user_id)
  );
  const visibleEntitlements = (entitlements ?? []).filter(
    (row) => !HIDDEN_ADMIN_ASSIGNED_PRODUCT_USER_IDS.has(row.user_id)
  );

  const purchaseIds = visiblePurchases.map((row) => row.id);
  const packIds = Array.from(
    new Set(visiblePurchases.map((row) => row.pack_id).filter(Boolean))
  ) as string[];

  const [{ data: creditTransactions }, { data: packs }] = await Promise.all([
    purchaseIds.length
      ? supabase
          .from("credit_transactions")
          .select("ref_id, admin_id")
          .in("ref_id", purchaseIds)
          .returns<Array<{ ref_id: string | null; admin_id: string | null }>>()
      : Promise.resolve({ data: [] }),
    packIds.length
      ? supabase
          .from("credit_packs")
          .select("id, name, slug")
          .in("id", packIds)
          .returns<Array<{ id: string; name: string | null; slug: string | null }>>()
      : Promise.resolve({ data: [] }),
  ]);

  const adminIdByPurchaseId = new Map(
    (creditTransactions ?? [])
      .filter((row) => row.ref_id)
      .map((row) => [row.ref_id as string, row.admin_id])
  );
  const packById = new Map((packs ?? []).map((pack) => [pack.id, pack]));
  const userIds = new Set<string>();

  for (const row of visiblePurchases) {
    userIds.add(row.user_id);
    const adminId = adminIdByPurchaseId.get(row.id);
    if (adminId) {
      userIds.add(adminId);
    }
  }

  for (const row of visibleEntitlements) {
    userIds.add(row.user_id);
    if (row.created_by) {
      userIds.add(row.created_by);
    }
  }

  const { data: profiles } = userIds.size
    ? await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", Array.from(userIds))
        .returns<Array<{ user_id: string; display_name: string | null }>>()
    : { data: [] as Array<{ user_id: string; display_name: string | null }> };

  const profileNameById = new Map(
    (profiles ?? []).map((profile) => [
      profile.user_id,
      profile.display_name?.trim() || shortUserId(profile.user_id),
    ])
  );
  const getProfileName = (userId: string | null | undefined) =>
    userId ? profileNameById.get(userId) ?? shortUserId(userId) : "Onbekend";

  const purchaseRows: AdminAssignedProductRow[] = visiblePurchases.map((row) => {
    const pack = row.pack_id ? packById.get(row.pack_id) : null;
    const adminId = adminIdByPurchaseId.get(row.id) ?? null;

    return {
      id: `credit-${row.id}`,
      createdAt: row.created_at,
      userId: row.user_id,
      userName: getProfileName(row.user_id),
      adminId,
      adminName: getProfileName(adminId),
      productName: pack?.name || pack?.slug || "Creditpakket",
      productType: "credits",
      quantity: row.quantity ?? row.credits_total ?? null,
      amountCents: row.amount_cents,
      currency: normalizeCurrency(row.currency),
      note: row.note,
    };
  });

  const entitlementRows: AdminAssignedProductRow[] = visibleEntitlements.map((row) => {
    const metadata = asObject(row.metadata);
    const packName = asString(metadata?.pack_name);
    const entitlementLabel =
      row.entitlement_key === "therapist_directory"
        ? "Therapeutenoverzicht"
        : row.entitlement_key === "year_assignments"
          ? "Jaarabonnement volledige toegang"
          : row.entitlement_key;

    return {
      id: `entitlement-${row.id}`,
      createdAt: row.created_at,
      userId: row.user_id,
      userName: getProfileName(row.user_id),
      adminId: row.created_by,
      adminName: getProfileName(row.created_by),
      productName: packName || entitlementLabel,
      productType: "subscription",
      quantity: asNumber(metadata?.duration_months),
      amountCents: asNumber(metadata?.amount_cents),
      currency: normalizeCurrency(asString(metadata?.currency)),
      note: asString(metadata?.note) || null,
    };
  });

  return [...purchaseRows, ...entitlementRows].sort((a, b) =>
    (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
  );
}

export async function getEcommerceDailyRevenue(range: DateRange) {
  const supabase = createAdminClient();
  const [
    { data: creditPackPurchases },
    { data: ebookPurchases },
    { data: websiteOrderItems },
    { data: iapRevenueRows },
  ] = await Promise.all([
    supabase
      .from("credit_pack_purchases")
      .select("amount_cents, currency, created_at, source, note, external_ref")
      .gte("created_at", range.from.toISOString())
      .lte("created_at", range.to.toISOString())
      .order("created_at", { ascending: true }),
    supabase
      .from("app_ebook_purchases")
      .select("amount_cents, currency, source, purchased_at, purchase_status")
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
    supabase
      .from("iap_transactions")
      .select("platform, store_transaction_id, amount_cents, currency, created_at, pack_id, raw_payload")
      .gte("created_at", range.from.toISOString())
      .lte("created_at", range.to.toISOString())
      .order("created_at", { ascending: true })
      .returns<IapRevenueRow[]>(),
  ]);
  const iapRevenueByTransactionId = getIapRevenueByTransactionId(iapRevenueRows);

  const dailyMap = new Map<string, number>();
  const addDailyRevenue = (input: RevenueInput) => {
    if (!input.createdAt) {
      return;
    }

    const amountCents = Number(input.amountCents ?? 0);
    if (!Number.isFinite(amountCents)) {
      return;
    }

    if (isSandboxEnvironment(input.environment)) {
      return;
    }

    const day = new Date(input.createdAt).toISOString().slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + amountCents);
  };

  for (const row of creditPackPurchases ?? []) {
    if (isAdminAssignedPurchase(row)) {
      continue;
    }
    if (isStoreBackedPurchase(row)) {
      continue;
    }
    addDailyRevenue(getCreditPackRevenueInput(row, iapRevenueByTransactionId));
  }

  for (const row of ebookPurchases ?? []) {
    if (isStoreBackedPurchase({ source: row.source, note: null })) {
      continue;
    }
    addDailyRevenue({
      amountCents: row.amount_cents,
      currency: row.currency,
      createdAt: row.purchased_at,
      environment: null,
    });
  }

  for (const row of websiteOrderItems ?? []) {
    addDailyRevenue({
      amountCents: row.amount_cents,
      currency: row.currency,
      createdAt: row.occurred_at,
      environment: null,
    });
  }

  for (const row of iapRevenueRows ?? []) {
    addDailyRevenue({
      amountCents: row.amount_cents,
      currency: row.currency,
      createdAt: row.created_at,
      source: row.platform,
      note: row.store_transaction_id,
      environment: getRevenueCatEnvironment(row.raw_payload),
    });
  }

  return Array.from(dailyMap.entries()).map(([day, amountCents]) => ({
    day,
    amountCents,
  }));
}

export async function getTopCreditPacks(range: DateRange, limit = 6) {
  const supabase = createAdminClient();
  const [{ data: purchases }, { data: iapRevenueRows }] = await Promise.all([
    supabase
      .from("credit_pack_purchases")
      .select("pack_id, amount_cents, credits_total, currency, created_at, source, note, external_ref")
      .gte("created_at", range.from.toISOString())
      .lte("created_at", range.to.toISOString()),
    supabase
      .from("iap_transactions")
      .select("platform, store_transaction_id, amount_cents, currency, created_at, pack_id, raw_payload")
      .gte("created_at", range.from.toISOString())
      .lte("created_at", range.to.toISOString())
      .returns<IapRevenueRow[]>(),
  ]);
  const iapRevenueByTransactionId = getIapRevenueByTransactionId(iapRevenueRows);

  const totals = new Map<string, { count: number; revenue: number; credits: number }>();
  for (const row of purchases ?? []) {
    if (isAdminAssignedPurchase(row)) {
      continue;
    }
    const packId = row.pack_id as string | null;
    if (!packId) continue;
    const revenueInput = getCreditPackRevenueInput(row, iapRevenueByTransactionId);
    if (!isProductionRevenueInput(revenueInput)) continue;

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
