import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export const runtime = "nodejs";
const MODEL_NAME = "openai/gpt-oss-120b";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY n'est pas configurée côté serveur." }, { status: 500 });
    const body = await request.json().catch(() => null);
    const question = typeof body?.question === "string" ? body.question.trim() : "";
    const chartContext = typeof body?.chartContext === "string" ? body.chartContext : "";
    if (!question || !chartContext) return NextResponse.json({ error: "La question et le contexte graphique sont requis." }, { status: 400 });

    const groq = new Groq({ apiKey });
    const response = await groq.chat.completions.create({
      model: MODEL_NAME,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `Tu es un assistant chartiste prudent, concis et francophone. Tu analyses exclusivement le contexte structuré fourni. Ne fabrique jamais un niveau, une bougie ou une structure absente. Pour toute figure chartiste, applique strictement cette règle : si la neckline n'est pas cassée par une clôture de bougie, écris « En formation / Non confirmée » et explique la preuve manquante. Distingue clairement les faits calculés des hypothèses. Ne donne pas de conseil financier personnalisé.`,
        },
        { role: "user", content: `CONTEXTE CHARTISTE STRUCTURÉ :\n${chartContext}\n\nQUESTION :\n${question}` },
      ],
    });
    const answer = response.choices[0]?.message?.content?.trim();
    if (!answer) return NextResponse.json({ error: "Réponse vide de l'assistant chartiste." }, { status: 502 });
    return NextResponse.json({ answer }, { status: 200 });
  } catch (error) {
    console.error("[api/chat-chart] Erreur :", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur inconnue de l'assistant." }, { status: 500 });
  }
}
