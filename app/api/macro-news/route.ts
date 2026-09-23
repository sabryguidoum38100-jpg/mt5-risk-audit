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
  {
    source: "Forex Factory",
    url: "https://www.forexfactory.com/ffcal_week_this.xml",
    kind: "calendar",
  },
] as const;

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
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
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
    .slice(0, 10);
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
