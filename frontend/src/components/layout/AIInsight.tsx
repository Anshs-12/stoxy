import { ReactNode } from "react";
import { useTheme } from "../../context/ThemeContext";

function InsightBody({
  tag,
  summary,
  highlight,
  detail,
}: {
  tag: string;
  summary: string;
  highlight: string;
  detail: string;
}) {
  const { isDark } = useTheme();

  // Theme-aware palette — these mirror the app's CSS variables so the
  // card reads correctly in both dark and light mode.
  const palette = isDark
    ? {
        border: "#23271f",
        accent: "#a78bfa",
        accentText: "#0b0d0c",
        text: "#eef0e8",
        highlight: "#8fa863",
        bgGradient: "linear-gradient(90deg, rgba(167,139,250,0.08), transparent 60%)",
      }
    : {
        border: "#d8d3c8",
        accent: "#7c3aed",
        accentText: "#ffffff",
        text: "#1a1917",
        highlight: "#3f6b2b",
        bgGradient: "linear-gradient(90deg, rgba(124,58,237,0.10), transparent 60%)",
      };

  const insight: React.CSSProperties = {
    border: `1px solid ${palette.border}`,
    borderLeft: `2px solid ${palette.accent}`,
    background: palette.bgGradient,
    padding: "20px 24px",
    marginTop: "32px",
    marginBottom: "40px",
    display: "flex",
    gap: "16px",
    alignItems: "flex-start",
    fontFamily: "'IBM Plex Mono', monospace",
  };

  const tagStyle: React.CSSProperties = {
    fontSize: "10px",
    letterSpacing: "0.14em",
    color: palette.accentText,
    background: palette.accent,
    padding: "4px 8px",
    fontWeight: 600,
    whiteSpace: "nowrap",
    marginTop: "2px",
  };

  const textStyle: React.CSSProperties = {
    fontSize: "14.5px",
    lineHeight: 1.6,
    color: palette.text,
    margin: 0,
  };

  const highlightStyle: React.CSSProperties = {
    color: palette.highlight,
  };

  return (
    <div style={insight}>
      <span style={tagStyle}>{tag}</span>
      <p style={textStyle}>
        {summary} — <span style={highlightStyle}>{highlight}</span> {detail}
      </p>
    </div>
  );
}

interface AIInsightProps {
  tag?: string;
  summary?: string;
  highlight?: string;
  detail?: string;
}

export function AIInsight({
  tag = "TODAY'S AI MARKET SUMMARY",
  summary = "",
  highlight = "COMING SOON",
  detail = "Stay tuned for AI-powered insights and analysis to help you make informed investment decisions.",
}: AIInsightProps) {
  return (
    <InsightBody
      tag={tag}
      summary={summary}
      highlight={highlight}
      detail={detail}
    />
  );
}

export function PageBackground({ children }: { children: ReactNode }) {
  const { isDark } = useTheme();

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "var(--color-bg-base)",
    color: "var(--color-text-primary)",
    fontFamily: "'IBM Plex Mono', monospace",
    position: "relative",
    WebkitFontSmoothing: "antialiased",
  };

  const gridOverlayStyle: React.CSSProperties = {
    content: "''",
    position: "fixed",
    inset: 0,
    backgroundImage: isDark
      ? "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)"
      : "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
    backgroundSize: "48px 48px",
    pointerEvents: "none",
    zIndex: 0,
  };

  const contentStyle: React.CSSProperties = {
    position: "relative",
    zIndex: 1,
  };

  return (
    <div style={pageStyle}>
      <div style={gridOverlayStyle} />
      <div style={contentStyle}>{children}</div>
    </div>
  );
}