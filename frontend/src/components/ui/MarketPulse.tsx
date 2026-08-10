import { useMemo, type CSSProperties } from "react";
import { useTheme } from "../../context/ThemeContext";

interface Sector {
  name: string;
  pct: number;
  color: string;
}

interface MarketPulseProps {
  gaining?: number;
  declining?: number;
  sectors?: Sector[];
  note?: string;
  updatedAt?: string;
}

const DEFAULT_SECTORS: Sector[] = [
  { name: "Banking", pct: 0.8, color: "#4d9fff" },
  { name: "FMCG", pct: 0.56, color: "#4dd6c4" },
  { name: "Auto", pct: 0.41, color: "#a78bfa" },
  { name: "Energy", pct: 0.22, color: "#ffb454" },
  { name: "IT", pct: -0.12, color: "#ff6b5e" },
];

export function MarketPulse({
  gaining = 5,
  declining = 0,
  sectors = DEFAULT_SECTORS,
  note = "Breadth is firmly bullish — every tracked index is advancing, led by Banking.",
}: MarketPulseProps) {
  const { isDark } = useTheme();

  // Theme-aware palette
  const palette = isDark
    ? {
        panel: "#1a1917",
        border: "#23271f",
        h2: "#565c50",
        statLabel: "#8b9186",
        barTrack: "#23271f",
        barMid: "#2e332a",
        statGain: "#3ddc84",
        statLose: "#ff6b5e",
        downBar: "#ff6b5e",
        footNote: "#8b9186",
      }
    : {
        panel: "#fdfaf5",
        border: "#d8d3c8",
        h2: "#7a6f5e",
        statLabel: "#5a5246",
        barTrack: "#e8e2d4",
        barMid: "#c8c2b4",
        statGain: "#2e7d32",
        statLose: "#c62828",
        downBar: "#c62828",
        footNote: "#5a5246",
      };

  const styles: Record<string, CSSProperties> = {
    panel: {
      background: palette.panel,
      border: `1px solid ${palette.border}`,
      padding: "26px",
      fontFamily: "'IBM Plex Mono', monospace",
      color: isDark ? "#eef0e8" : "#1a1917",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "22px",
    },
    h2: {
      fontSize: "11px",
      letterSpacing: "0.14em",
      color: palette.h2,
      textTransform: "uppercase",
      fontWeight: 500,
    },
    asOf: {
      fontSize: "10.5px",
      color: palette.h2,
    },
    statRow: {
      display: "flex",
      gap: "28px",
      marginBottom: "24px",
    },
    statBlock: {
      display: "flex",
      alignItems: "baseline",
      gap: "8px",
    },
    statNum: {
      fontFamily: "'Space Grotesk', sans-serif",
      fontWeight: 700,
      fontSize: "26px",
    },
    statLabel: {
      fontSize: "11px",
      color: palette.statLabel,
    },
    sectionDivider: {
      borderTop: `1px solid ${palette.border}`,
      paddingTop: "18px",
    },
    chartLabel: {
      display: "block",
      marginBottom: "16px",
    },
    chart: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },
    barRow: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    barName: {
      width: "64px",
      flexShrink: 0,
      fontSize: "12px",
      color: palette.statLabel,
    },
    barTrack: {
      flex: 1,
      height: "22px",
      background: palette.barTrack,
      borderRadius: "3px",
      position: "relative",
      overflow: "hidden",
    },
    barMid: {
      position: "absolute",
      left: "50%",
      top: 0,
      bottom: 0,
      width: "1px",
      background: palette.barMid,
    },
    barFill: {
      position: "absolute",
      top: 0,
      bottom: 0,
      borderRadius: "3px",
      transition: "width .5s ease",
      opacity: 0.85,
    },
    barVal: {
      width: "56px",
      textAlign: "right",
      fontSize: "12px",
      fontVariantNumeric: "tabular-nums",
    },
    footNote: {
      marginTop: "20px",
      fontSize: "11.5px",
      color: palette.footNote,
      lineHeight: 1.6,
      paddingTop: "16px",
      borderTop: `1px solid ${palette.border}`,
    },
  };

  const maxAbs = useMemo(
    () => Math.max(...sectors.map((s) => Math.abs(s.pct)), 0.1),
    [sectors]
  );

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.h2}>Market Pulse</span>
      </div>

      <div style={styles.statRow}>
        <div style={styles.statBlock}>
          <span style={{ ...styles.statNum, color: palette.statGain }}>{gaining}</span>
          <span style={styles.statLabel}>Gaining</span>
        </div>
        <div style={styles.statBlock}>
          <span style={{ ...styles.statNum, color: palette.statLose }}>{declining}</span>
          <span style={styles.statLabel}>Declining</span>
        </div>
      </div>

      <div style={styles.sectionDivider}>
        <span style={{ ...styles.h2, ...styles.chartLabel }}>Sector Breadth</span>
        <div style={styles.chart}>
          {sectors.map((s) => {
            const isDown = s.pct < 0;
            const color = isDown ? palette.downBar : s.color;
            const widthPct = (Math.abs(s.pct) / maxAbs) * 50;
            const sign = isDown ? "" : "+";

            return (
              <div key={s.name} style={styles.barRow}>
                <span style={styles.barName}>{s.name}</span>
                <div style={styles.barTrack}>
                  <div style={styles.barMid} />
                  <div
                    style={{
                      ...styles.barFill,
                      background: color,
                      width: `${widthPct}%`,
                      ...(isDown ? { right: "50%" } : { left: "50%" }),
                    }}
                  />
                </div>
                <span style={{ ...styles.barVal, color }}>
                  {sign}
                  {s.pct.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.footNote}>{note}</div>
    </div>
  );
}