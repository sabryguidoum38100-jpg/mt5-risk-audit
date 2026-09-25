import { ImageResponse } from "next/og";

export const alt = "AuditProp — Intelligence Comportementale & Risk OS pour Traders";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ background: "#09090b", color: "#fafafa", width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "72px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, color: "#10b981", fontSize: 30, fontWeight: 700 }}><span style={{ border: "3px solid #10b981", borderRadius: 14, padding: "10px 15px" }}>A</span> AuditProp</div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 34, fontSize: 64, lineHeight: 1.05, fontWeight: 800, letterSpacing: -2 }}>Intelligence comportementale<br />&amp; Risk OS pour Traders</div>
      <div style={{ marginTop: 28, color: "#a1a1aa", fontSize: 26 }}>Mesurez le risque. Comprenez vos biais. Protégez votre challenge.</div>
      <div style={{ marginTop: 48, display: "flex", gap: 14, fontSize: 18, color: "#34d399" }}><span>LIVE DATA</span><span>•</span><span>LOCAL-FIRST</span><span>•</span><span>PROP FIRM READY</span></div>
    </div>,
    { ...size },
  );
}
