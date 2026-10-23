import { ImageResponse } from "next/og";
import { ELEMENTS } from "@/data";
import { SITE } from "@/lib/site";

export const alt = "Valence: learn the periodic table with flashcards";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SAMPLE = [1, 2, 6, 8, 11, 26, 29, 47, 79, 92].map((n) => ELEMENTS[n - 1]!);

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #f0fdfa 0%, #ffffff 60%)",
          color: "#0f172a",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: 14,
              background: "#0f766e",
              color: "white",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            Va
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>{SITE.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>Learn the periodic table</div>
          <div style={{ display: "flex", fontSize: 32, color: "#475569" }}>
            Flashcards, spaced repetition, and a blank-table quiz for all 118 elements.
          </div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {SAMPLE.map((element) => (
            <div
              key={element.symbol}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: 92,
                height: 92,
                borderRadius: 12,
                border: "2px solid #99f6e4",
                background: "white",
              }}
            >
              <div style={{ display: "flex", fontSize: 16, color: "#64748b" }}>{element.atomicNumber}</div>
              <div style={{ display: "flex", fontSize: 38, fontWeight: 700 }}>{element.symbol}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
