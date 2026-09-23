"use client";

import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  CandlestickData,
  HistogramSeries,
  HistogramData,
  IChartApi,
  ISeriesApi,
  LineSeries,
  Time,
  createChart,
  createSeriesMarkers,
} from "lightweight-charts";
import { Bot, ChevronRight, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import type { MT5ParseResult } from "@/lib/mt5-parser";
import { buildChartContext, chartContextForPrompt, type ChartContext } from "@/lib/chart-analysis";

interface ChartistPanelProps { result: MT5ParseResult }
interface ChatMessage { role: "user" | "assistant"; content: string }

export default function ChartistPanel({ result }: ChartistPanelProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [context, setContext] = useState<ChartContext>(() => buildChartContext(result));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => setContext(buildChartContext(result)), [result]);

  useEffect(() => {
    if (!chartRef.current || context.candles.length === 0) return;
    const chart = createChart(chartRef.current, {
      layout: { background: { color: "transparent" }, textColor: "#71717a" },
      grid: { vertLines: { color: "#ffffff0b" }, horzLines: { color: "#ffffff0b" } },
      rightPriceScale: { borderColor: "#ffffff15" },
      timeScale: { borderColor: "#ffffff15", timeVisible: true, secondsVisible: false },
      crosshair: { vertLine: { color: "#38bdf855" }, horzLine: { color: "#38bdf855" } },
      width: chartRef.current.clientWidth,
      height: 370,
    });
    const candles: CandlestickData<Time>[] = context.candles.map((candle) => ({
      time: candle.time as Time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#34d399",
      downColor: "#fb7185",
      borderVisible: false,
      wickUpColor: "#34d399",
      wickDownColor: "#fb7185",
    });
    candleSeries.setData(candles);
    const stopLossData = context.candles
      .filter((candle) => candle.stopLoss !== undefined)
      .map((candle) => ({ time: candle.time as Time, value: candle.stopLoss as number }));
    const takeProfitData = context.candles
      .filter((candle) => candle.takeProfit !== undefined)
      .map((candle) => ({ time: candle.time as Time, value: candle.takeProfit as number }));
    if (stopLossData.length > 0) chart.addSeries(LineSeries, { color: "#fb7185", lineWidth: 1, lineStyle: 2 }).setData(stopLossData);
    if (takeProfitData.length > 0) chart.addSeries(LineSeries, { color: "#34d399", lineWidth: 1, lineStyle: 2 }).setData(takeProfitData);
    const volumeSeries = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "" });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    const volumes: HistogramData<Time>[] = context.candles.map((candle) => ({
      time: candle.time as Time,
      value: candle.volume,
      color: candle.close >= candle.open ? "#34d39955" : "#fb718555",
    }));
    volumeSeries.setData(volumes);
    createSeriesMarkers(candleSeries, context.candles.filter((candle) => candle.direction).map((candle) => ({
      time: candle.time as Time,
      position: candle.direction === "buy" ? "belowBar" : "aboveBar",
      color: candle.direction === "buy" ? "#38bdf8" : "#fb7185",
      shape: candle.direction === "buy" ? "arrowUp" : "arrowDown",
      text: `${candle.direction === "buy" ? "Buy" : "Sell"} ${candle.ticket ?? ""}`,
    })));
    chart.timeScale().fitContent();
    const resize = () => chartRef.current && chart.applyOptions({ width: chartRef.current.clientWidth });
    window.addEventListener("resize", resize);
    return () => { window.removeEventListener("resize", resize); chart.remove(); };
  }, [context]);

  const ask = async (preset?: string) => {
    const clean = (preset ?? question).trim();
    if (!clean || isSending) return;
    setQuestion("");
    setMessages((items) => [...items, { role: "user", content: clean }]);
    setIsSending(true);
    try {
      const response = await fetch("/api/chat-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: clean, chartContext: chartContextForPrompt(context) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "Erreur de l'assistant chartiste.");
      setMessages((items) => [...items, { role: "assistant", content: data.answer }]);
    } catch (error) {
      setMessages((items) => [...items, { role: "assistant", content: error instanceof Error ? error.message : "Impossible de joindre l'assistant." }]);
    } finally { setIsSending(false); }
  };

  const latest = context.candles[context.candles.length - 1];
  return (
    <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.035] shadow-2xl shadow-black/10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-white"><Sparkles className="h-4 w-4 text-sky-300" /> Charting &amp; structure</div>
          <p className="mt-1 text-xs text-zinc-500">{context.selectedSymbol} · chandeliers reconstruits depuis l&apos;historique MT5 · volumes relatifs</p>
        </div>
        <button onClick={() => setDrawerOpen(true)} className="flex items-center gap-2 rounded-xl bg-sky-300 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-sky-200"><MessageCircle className="h-3.5 w-3.5" /> Assistant Chartiste IA <ChevronRight className="h-3 w-3" /></button>
      </div>
      <div ref={chartRef} className="min-h-[370px] w-full p-2" />
      <div className="flex flex-wrap gap-2 border-t border-white/[0.07] px-5 py-3 text-[11px] text-zinc-500">
        <span className="rounded-full bg-white/5 px-2.5 py-1">{context.candles.length} bougies</span>
        <span className="rounded-full bg-white/5 px-2.5 py-1">{context.swings.length} swings détectés</span>
        {context.patterns.map((pattern) => <span key={pattern.name} className={`rounded-full px-2.5 py-1 ${pattern.status === "Confirmée" ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}>{pattern.name} · {pattern.status}</span>)}
        {latest && <span className="ml-auto rounded-full bg-white/5 px-2.5 py-1">Dernier close {latest.close.toFixed(4)}</span>}
      </div>
      {drawerOpen && <button aria-label="Fermer l'assistant" onClick={() => setDrawerOpen(false)} className="fixed inset-0 z-40 bg-black/50" />}
      <aside className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md transform flex-col border-l border-white/10 bg-[#0b0f18] shadow-2xl transition-transform duration-300 ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300"><Bot className="h-4 w-4" /></div><div><h3 className="text-sm font-semibold text-white">Assistant Chartiste IA</h3><p className="text-xs text-zinc-500">Structure validée par les swings</p></div></div>
          <button onClick={() => setDrawerOpen(false)} className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {messages.length === 0 && <div className="rounded-2xl border border-sky-300/15 bg-sky-300/[0.05] p-4"><p className="text-sm font-medium text-white">Posez une question sur votre structure.</p><p className="mt-2 text-xs leading-5 text-zinc-500">L&apos;IA reçoit uniquement les bougies, swings et statuts calculés. Une figure sans cassure de neckline restera « En formation / Non confirmée ».</p><div className="mt-4 space-y-2">{["Analyse la structure de ce trade", "Où est le bloc de liquidité le plus proche ?", "La figure chartiste est-elle confirmée ?"].map((prompt) => <button key={prompt} onClick={() => void ask(prompt)} className="flex w-full items-center justify-between rounded-xl border border-white/10 px-3 py-2.5 text-left text-xs text-zinc-300 transition hover:border-sky-300/30 hover:text-white">{prompt}<ChevronRight className="h-3 w-3 text-zinc-600" /></button>)}</div></div>}
            {messages.map((message, index) => <div key={index} className={`rounded-2xl p-3.5 text-sm leading-6 ${message.role === "user" ? "ml-8 bg-sky-300/10 text-sky-100" : "mr-3 border border-white/10 bg-white/[0.04] text-zinc-300"}`}><p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{message.role === "user" ? "Vous" : "Assistant"}</p>{message.content}</div>)}
            {isSending && <div className="flex items-center gap-2 text-xs text-zinc-500"><Loader2 className="h-4 w-4 animate-spin" /> Analyse de la structure…</div>}
          </div>
          <form onSubmit={(event) => { event.preventDefault(); void ask(); }} className="border-t border-white/10 p-4"><div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-2"><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Votre question sur le graphique…" className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-zinc-600" /><button type="submit" disabled={!question.trim() || isSending} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-300 text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4" /></button></div></form>
        </div>
      </aside>
    </section>
  );
}
