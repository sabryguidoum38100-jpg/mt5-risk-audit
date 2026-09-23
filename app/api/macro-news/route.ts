import { NextResponse } from "next/server";
import Parser from "rss-parser";
import Groq from "groq-sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parser = new Parser<Record<string, string>>({
  timeout: 10000,
  customFields: {
    item: ["media:content", "media:thumbnail", "content:encoded"],
  },
});
const FEEDS = [
  {
    source: "CNBC",
    url: "https://www.cnbc.com/id/100003114/device/rss/rss.html",
    kind: "news",
  },
  {
    source: "Yahoo Finance",
    url: "https://finance.yahoo.com/news/rssindex",
    kind: "news",
  },
] as const;

const CALENDAR_CURRENCIES = ["USD", "EUR", "GBP", "JPY"] as const;

type MacroImpact = "high" | "moderate" | "low";

interface MacroItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
  image: string | null;
  kind: "news" | "calendar";
  summary: string | null;
  impact: MacroImpact;
  currency: "USD" | "EUR" | "GBP" | "JPY" | null;
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function currencyFor(value: string): MacroItem["currency"] {
  const currency = value.toUpperCase();
  return ["USD", "EUR", "GBP", "JPY"].includes(currency)
    ? (currency as MacroItem["currency"])
    : null;
}

function imageFrom(item: Record<string, unknown>): string | null {
  const enclosure = item.enclosure as { url?: string } | undefined;
  const media = item["media:content"] as
    { $?: { url?: string }; url?: string } | undefined;
  const thumbnail = item["media:thumbnail"] as
    { $?: { url?: string }; url?: string } | undefined;
  const encoded =
    typeof item["content:encoded"] === "string" ? item["content:encoded"] : "";
  const htmlImage =
    encoded.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? null;
  return (
    enclosure?.url ??
    media?.$?.url ??
    media?.url ??
    thumbnail?.$?.url ??
    thumbnail?.url ??
    htmlImage
  );
}

function impactFor(title: string, summary: string | null): MacroImpact {
  const text = `${title} ${summary ?? ""}`.toLowerCase();
  if (
    /fed|fomc|rate|interest|inflation|cpi|jobs|employment|war|tariff|sanction|crisis|default|recession|central bank/.test(
      text,
    )
  )
    return "high";
  if (
    /market|stocks|bond|oil|gold|dollar|euro|yen|earnings|growth|trade|economy/.test(
      text,
    )
  )
    return "moderate";
  return "low";
}

async function fetchCalendarCurrency(
  currency: (typeof CALENDAR_CURRENCIES)[number],
): Promise<MacroItem[]> {
  const response = await fetch(
    `https://api.fxmacrodata.com/v1/calendar/${currency}`,
    { cache: "no-store" },
  );
  if (!response.ok)
    throw new Error(`FXMacroData ${currency} HTTP ${response.status}`);
  const payload = (await response.json()) as {
    data?: Array<Record<string, unknown>>;
  };
  return (payload.data ?? [])
    .map((event) => {
      const title =
        typeof event.name === "string" ? event.name : "Événement macro";
      const publishedAt =
        typeof event.announcement_datetime_utc === "string"
          ? event.announcement_datetime_utc
          : null;
      const importance =
        typeof event.event_importance === "string"
          ? event.event_importance.toLowerCase()
          : "low";
      const impact: MacroImpact =
        importance === "high"
          ? "high"
          : importance === "medium" || importance === "moderate"
            ? "moderate"
            : "low";
      return {
        title,
        link:
          typeof event.source_url === "string"
            ? event.source_url
            : `https://api.fxmacrodata.com/v1/calendar/${currency}`,
        source: typeof event.source === "string" ? event.source : "FXMacroData",
        publishedAt,
        image: null,
        kind: "calendar" as const,
        summary:
          typeof event.release === "string"
            ? event.release.replaceAll("_", " ")
            : null,
        impact,
        currency,
      };
    })
    .filter((item) => item.publishedAt && item.title);
}

async function fetchFeed(feed: (typeof FEEDS)[number]): Promise<MacroItem[]> {
  const parsed = await parser.parseURL(feed.url);
  return parsed.items
    .slice(0, 12)
    .map((item) => {
      const title = (item.title ?? "").trim();
      const summary = item.contentSnippet?.trim() ?? null;
      return {
        title,
        link: item.link ?? feed.url,
        source: feed.source,
        publishedAt: item.isoDate ?? item.pubDate ?? null,
        image: imageFrom(item as unknown as Record<string, unknown>),
        kind: feed.kind,
        summary,
        impact: impactFor(title, summary),
        currency: null,
      };
    })
    .filter((item) => item.title);
}

async function summarize(items: MacroItem[]): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key || items.length === 0) return null;
  const groq = new Groq({ apiKey: key });
  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "Tu es un stratégiste macro prudent. Résume en français la santé des marchés uniquement à partir des titres et extraits fournis. Distingue les faits des risques, ne fabrique aucun chiffre et réponds en 3 phrases maximum.",
      },
      {
        role: "user",
        content: items
          .slice(0, 5)
          .map(
            (item) => `[${item.source}] ${item.title}\n${item.summary ?? ""}`,
          )
          .join("\n\n"),
      },
    ],
  });
  return response.choices[0]?.message?.content?.trim() ?? null;
}

export async function GET() {
  const results = await Promise.allSettled([
    ...FEEDS.map(fetchFeed),
    ...CALENDAR_CURRENCIES.map(fetchCalendarCurrency),
  ]);
  const successful = results.filter(
    (result): result is PromiseFulfilledResult<MacroItem[]> =>
      result.status === "fulfilled",
  );
  if (successful.length === 0)
    return NextResponse.json(
      { error: "Les flux macro distants sont temporairement indisponibles." },
      { status: 502 },
    );
  const items = successful
    .flatMap((result) => result.value)
    .sort(
      (a, b) =>
        new Date(b.publishedAt ?? 0).getTime() -
        new Date(a.publishedAt ?? 0).getTime(),
    );
  const articles = items.filter((item) => item.kind === "news").slice(0, 10);
  const calendar = items
    .filter((item) => item.kind === "calendar")
    .filter(
      (item) =>
        item.publishedAt &&
        new Date(item.publishedAt).getTime() >= Date.now() - 60 * 60 * 1000,
    )
    .sort(
      (a, b) =>
        new Date(a.publishedAt ?? 0).getTime() -
        new Date(b.publishedAt ?? 0).getTime(),
    )
    .slice(0, 80);
  let marketSummary: string | null = null;
  try {
    marketSummary = await summarize(articles);
  } catch (error) {
    console.error("[api/macro-news] Groq summary error:", error);
  }
  return NextResponse.json(
    {
      fetchedAt: new Date().toISOString(),
      sources: successful.length,
      articles,
      calendar,
      marketSummary,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
