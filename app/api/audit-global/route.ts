import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export const runtime = "nodejs";
const MODEL = "openai/gpt-oss-120b";
const NEGATIVE_BIAS_WORDS = /biais|sur[- ]?réactiv|perte|drawdown|surtrading|overtrading|hors[- ]?plan|fomo|sizing|lot|risque|discipline insuffisante|pression d'exécution|compensation/i;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY n'est pas configurée côté serveur." }, { status: 500 });
  try {
    const body = await request.json();
    const metrics = body?.metrics;
    if (!metrics || typeof metrics !== "object") return NextResponse.json({ error: "Métriques agrégées manquantes." }, { status: 400 });
    const groq = new Groq({ apiKey });
    const response = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 900,
      messages: [
        { role: "system", content: "Tu es l'auditeur senior d'une plateforme de risk management. Réponds en français, sans conseil financier personnalisé. Retourne uniquement un JSON valide avec summary, strengths (3 chaînes), weaknesses (3 chaînes), actionPlan (3 chaînes). Fonde-toi exclusivement sur les métriques fournies, n'invente aucun chiffre." },
        { role: "user", content: JSON.stringify(metrics) },
      ],
    });
    const content = response.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = content.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(cleaned) as { summary?: string; strengths?: unknown; weaknesses?: unknown; actionPlan?: unknown };
    const weaknesses = Array.isArray(parsed.weaknesses) ? parsed.weaknesses.filter((item): item is string => typeof item === "string") : [];
    const weaknessTokens = weaknesses.flatMap((item) => item.toLowerCase().split(/\W+/).filter((token) => token.length > 4));
    const strengths = Array.isArray(parsed.strengths)
      ? parsed.strengths.filter((item): item is string => typeof item === "string" && !NEGATIVE_BIAS_WORDS.test(item) && !weaknessTokens.some((token) => item.toLowerCase().includes(token)))
      : [];
    return NextResponse.json({
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      strengths,
      weaknesses,
      actionPlan: Array.isArray(parsed.actionPlan) ? parsed.actionPlan.filter((item): item is string => typeof item === "string") : [],
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Audit IA indisponible." }, { status: 502 });
  }
}
