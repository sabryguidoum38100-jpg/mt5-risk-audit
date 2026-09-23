/**
 * app/api/analyze/route.ts
 * ---------------------------------------------------------------------------
 * Reçoit UNIQUEMENT le JSON des métriques déjà calculées par
 * lib/mt5-parser.ts (jamais les transactions brutes) et demande à Groq
 * une analyse comportementale orientée "Prop Firm & Biais psychologiques" :
 * revenge trading, risque de dépassement de drawdown, recommandations.
 *
 * Nécessite la variable d'environnement GROQ_API_KEY.
 */

import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import type { MT5Metrics } from "@/lib/mt5-parser";

export const runtime = "nodejs";

// Force Vercel rebuild: Groq migration cache-busting revision.
const MODEL_NAME = "llama-3.1-70b-versatile";
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

function getGroqErrorStatus(error: unknown): number | undefined {
  const candidate = error as {
    status?: number;
    code?: number;
    response?: { status?: number };
  };
  return candidate?.status ?? candidate?.response?.status ?? candidate?.code;
}

function isRetryableGroqError(error: unknown): boolean {
  const status = getGroqErrorStatus(error);
  const candidate = error as { message?: string };
  const message = candidate?.message ?? String(error);

  if (status === 429) return false;
  return status === 503 || /\b503\b/.test(message);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

// ---------------------------------------------------------------------------
// Types de la réponse structurée attendue de Groq
// ---------------------------------------------------------------------------

export interface DetectedBias {
  name: string;
  severity: "low" | "medium" | "high";
  description: string;
}

export interface PsychAnalysis {
  riskScore: number; // 0 (discipline saine) à 100 (risque élevé de destruction de compte)
  summary: string;
  biasesDetected: DetectedBias[];
  drawdownAlert: {
    level: "ok" | "warning" | "critical";
    message: string;
  };
  recommendations: string[];
}

// ---------------------------------------------------------------------------
// Construction du prompt
// ---------------------------------------------------------------------------

function buildPrompt(metrics: MT5Metrics): string {
  return `
Tu es un analyste comportemental spécialisé dans le trading pour compte propre ("prop firm" — FTMO, FundedNext, The5ers, etc.) et la psychologie du trading.

Analyse UNIQUEMENT les métriques JSON fournies ci-dessous, issues d'un calcul déterministe (non-IA) sur l'historique MetaTrader 5 d'un trader. Ne réinvente aucun chiffre : base-toi exclusivement sur ces données.

MÉTRIQUES DU TRADER :
${JSON.stringify(metrics, null, 2)}

CONTEXTE À PRENDRE EN COMPTE :
- Les règles typiques de prop firm limitent le drawdown quotidien à environ 5 % et le drawdown maximal global à environ 10 %.
- "quickReentriesAfterLoss" (valeur : ${metrics.quickReentriesAfterLoss}) compte les transactions ouvertes dans les ${metrics.revengeWindowMinutes} minutes suivant la clôture d'une perte : c'est un signal de "revenge trading" (trading de vengeance / réaction émotionnelle à une perte).
- "maxLosingStreak" décrit la pire série de pertes consécutives du trader.
- "maxDrawdownPercent" (${metrics.maxDrawdownPercent} %) est calculé sur une courbe d'équité qui part d'un solde de départ de ${metrics.initialBalanceAssumed} (détecté dans le fichier, ou estimé par défaut si absent).
- "significantLosingStreaks" compte le nombre de séries de 3 pertes consécutives ou plus.

TA MISSION :
1. Évalue un score de risque comportemental global de 0 (discipline exemplaire) à 100 (risque élevé de destruction de compte).
2. Détecte les biais psychologiques observables STRICTEMENT à partir des métriques (revenge trading, surtrading, absence de gestion du risque après une perte, etc.) — n'invente rien qui ne soit pas suggéré par les chiffres fournis.
3. Donne une alerte claire et chiffrée sur le risque de dépassement des limites de drawdown d'une prop firm au vu du drawdown déjà observé.
4. Propose des recommandations comportementales concrètes et actionnables (pas de généralités vagues type "sois discipliné").

Réponds STRICTEMENT en JSON valide, sans balises markdown ni texte autour, en suivant exactement ce schéma :
{
  "riskScore": number,
  "summary": string,
  "biasesDetected": [ { "name": string, "severity": "low" | "medium" | "high", "description": string } ],
  "drawdownAlert": { "level": "ok" | "warning" | "critical", "message": string },
  "recommendations": [string]
}

Rédige toutes les valeurs textuelles en français.
	`.trim();
}

async function generateWithRetry(groq: Groq, prompt: string) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await groq.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          {
            role: "system",
            content: "Réponds exclusivement avec un objet JSON valide, sans markdown ni texte autour.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        response_format: { type: "json_object" },
      });
    } catch (error) {
      lastError = error;
      const status = getGroqErrorStatus(error);
      if (status === 429) {
        console.warn(
          `[api/analyze] Groq a renvoyé 429 (quota dépassé) : aucun réessai.`,
          getErrorMessage(error)
        );
        throw error;
      }
      const canRetry = isRetryableGroqError(error) && attempt < MAX_ATTEMPTS;

      console.warn(
        `[api/analyze] Groq/${MODEL_NAME} a échoué (tentative ${attempt}/${MAX_ATTEMPTS}) :`,
        getErrorMessage(error)
      );

      if (!canRetry) throw error;
      await wait(RETRY_DELAY_MS);
    }
  }

  throw lastError ?? new Error(`Échec de l'appel à Groq/${MODEL_NAME}.`);
}

// ---------------------------------------------------------------------------
// Handler POST
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GROQ_API_KEY n'est pas configurée côté serveur. Ajoutez-la dans les variables d'environnement Vercel.",
        },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => null);
    const metrics = body?.metrics as MT5Metrics | undefined;

    if (!metrics || typeof metrics.totalTrades !== "number") {
      return NextResponse.json(
        {
          error:
            "Le corps de la requête doit contenir un objet 'metrics' valide, généré par lib/mt5-parser.ts.",
        },
        { status: 400 }
      );
    }

    const groq = new Groq({ apiKey });
    const prompt = buildPrompt(metrics);
    const response = await generateWithRetry(groq, prompt);

    const rawText = response.choices[0]?.message?.content;
    if (!rawText) {
      return NextResponse.json({ error: "Réponse vide reçue de Groq." }, { status: 502 });
    }

    let analysis: PsychAnalysis;
    try {
      analysis = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        {
          error: "La réponse de Groq n'a pas pu être interprétée comme du JSON valide.",
          raw: rawText,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ analysis }, { status: 200 });
  } catch (err) {
    console.error("[api/analyze] Erreur :", err);
    const message =
        err instanceof Error ? err.message : "Erreur inconnue lors de l'appel à Groq.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
