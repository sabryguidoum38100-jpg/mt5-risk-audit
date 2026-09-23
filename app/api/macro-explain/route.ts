import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return NextResponse.json({ explanation: null, error: "Analyse IA indisponible sans GROQ_API_KEY." }, { status: 503 });
  const body = (await request.json()) as { title?: string; currency?: string; impact?: string; summary?: string | null };
  if (!body.title) return NextResponse.json({ error: "Événement manquant." }, { status: 400 });
  const groq = new Groq({ apiKey: key });
  const result = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b", temperature: 0.1,
    messages: [
      { role: "system", content: "Réponds en français en exactement 2 phrases courtes. Explique ce que mesure l'indicateur puis son impact potentiel. Utilise uniquement le nom, la devise et le résumé fournis; si l'information manque, dis-le explicitement. Aucun conseil financier, aucun chiffre inventé." },
      { role: "user", content: JSON.stringify(body) },
    ],
  });
  return NextResponse.json({ explanation: result.choices[0]?.message?.content?.trim() ?? null });
}
