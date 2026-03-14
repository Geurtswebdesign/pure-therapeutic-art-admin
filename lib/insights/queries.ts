import { createAdminClient } from "@/lib/supabase/admin";

export type DateRange = {
  from: Date;
  to: Date;
};

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
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
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
  const { data } = await supabase
    .from("credit_pack_purchases")
    .select("amount_cents, credits_total, currency, created_at")
    .gte("created_at", range.from.toISOString())
    .lte("created_at", range.to.toISOString());

  const revenueByCurrency = new Map<string, number>();
  let creditsSold = 0;
  let transactions = 0;

  for (const row of data ?? []) {
    transactions += 1;
    creditsSold += Number(row.credits_total ?? 0);
    const currency = row.currency ?? "EUR";
    const next = (revenueByCurrency.get(currency) ?? 0) + Number(row.amount_cents ?? 0);
    revenueByCurrency.set(currency, next);
  }

  const revenueEntries = Array.from(revenueByCurrency.entries()).map(
    ([currency, amountCents]) => ({
      currency,
      amountCents,
    })
  );

  return {
    revenueEntries,
    creditsSold,
    transactions,
  };
}

export async function getEcommerceDailyRevenue(range: DateRange) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("credit_pack_purchases")
    .select("amount_cents, currency, created_at")
    .gte("created_at", range.from.toISOString())
    .lte("created_at", range.to.toISOString())
    .order("created_at", { ascending: true });

  const dailyMap = new Map<string, number>();
  for (const row of data ?? []) {
    const day = new Date(row.created_at as string).toISOString().slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + Number(row.amount_cents ?? 0));
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
