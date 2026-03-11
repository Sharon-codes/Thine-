"use client";

import type { TelemetryResult } from "@/types/telemetry";

const STATE_COLORS: Record<string, string> = {
    ENGAGED: "#15803D",
    FUNCTIONAL: "#1D4ED8",
    DEPLETED: "#B91C1C",
    COGNITIVE_LOAD: "#B45309",
    GUARDED: "#C2410C",
    MASKED_FATIGUE: "#6D28D9",
    BASELINE: "#71717A",
    INSUFFICIENT: "#A1A1AA",
};

// Hesitation score colour: green → amber → red
function scoreColor(s: number): string {
    if (s <= 2) return "#15803D";
    if (s <= 4) return "#65A30D";
    if (s <= 6) return "#B45309";
    if (s <= 8) return "#C2410C";
    return "#B91C1C";
}

function ScoreBar({ score }: { score: number }) {
    const pct = (score / 10) * 100;
    const color = scoreColor(score);
    return (
        <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10, color: "#ACACAA", letterSpacing: "0.12em" }}>
                    LOW FRICTION
                </span>
                <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10, color: "#ACACAA", letterSpacing: "0.12em" }}>
                    HIGH FRICTION
                </span>
            </div>
            <div style={{ height: 4, background: "#F0F0EE", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                    height: "100%", width: `${pct}%`, background: color,
                    borderRadius: 2, transition: "width 0.8s ease",
                }} />
            </div>
        </div>
    );
}

function MetricCell({
    label, value, sub, borderRight = false,
}: { label: string; value: string; sub?: string; borderRight?: boolean }) {
    return (
        <div style={{
            padding: "16px 20px",
            borderRight: borderRight ? "1px solid #F0F0EE" : undefined,
        }}>
            <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9, letterSpacing: "0.15em", color: "#ACACAA", textTransform: "uppercase", marginBottom: 6 }}>
                {label}
            </p>
            <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 20, color: "#0D0D0D", lineHeight: 1, marginBottom: sub ? 4 : 0 }}>
                {value}
            </p>
            {sub && <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "#6B6B6A" }}>{sub}</p>}
        </div>
    );
}

export default function TelemetryCard({ result }: { result: TelemetryResult }) {
    const stateColor = STATE_COLORS[result.cognitive_state.code] ?? STATE_COLORS.BASELINE;
    const { hesitation_profile: hp, pitch, pre_speech_latency_ms, non_lexical_artifacts } = result;
    const sessionId = Math.random().toString(36).slice(2, 9).toUpperCase();

    return (
        <div style={{
            background: "#FFFFFF", border: "1px solid #E4E4E2", borderRadius: 4,
            overflow: "hidden", width: "100%", maxWidth: 620, margin: "0 auto",
        }}>
            {/* Header */}
            <div style={{ padding: "12px 20px", borderBottom: "1px solid #E4E4E2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9, letterSpacing: "0.18em", color: "#ACACAA", textTransform: "uppercase" }}>
                        NLAE TELEMETRY · SESSION {sessionId}
                    </p>
                    <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "#6B6B6A", marginTop: 3 }}>
                        {(result.duration_ms / 1000).toFixed(1)}s sample · {new Date().toLocaleTimeString("en-US", { hour12: false })}
                    </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: stateColor }} />
                    <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9, letterSpacing: "0.12em", color: stateColor, textTransform: "uppercase" }}>
                        {result.cognitive_state.confidence}
                    </span>
                </div>
            </div>

            {/* Cognitive State */}
            <div style={{ padding: "18px 20px", borderBottom: "1px solid #F0F0EE" }}>
                <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9, letterSpacing: "0.15em", color: "#ACACAA", textTransform: "uppercase", marginBottom: 8 }}>
                    Inferred Cognitive State
                </p>
                <p style={{ fontSize: 17, fontWeight: 500, color: stateColor, letterSpacing: "-0.01em" }}>
                    {result.cognitive_state.label}
                </p>
            </div>

            {/* Hesitation Score — hero metric */}
            <div style={{ padding: "18px 20px", borderBottom: "1px solid #F0F0EE" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div>
                        <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9, letterSpacing: "0.15em", color: "#ACACAA", textTransform: "uppercase", marginBottom: 6 }}>
                            Composite Hesitation Score
                        </p>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                            <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 32, color: scoreColor(hp.score), lineHeight: 1 }}>
                                {hp.score}
                            </span>
                            <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13, color: "#ACACAA" }}>/10</span>
                        </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9, letterSpacing: "0.15em", color: "#ACACAA", textTransform: "uppercase", marginBottom: 6 }}>
                            Mid-Speech Pauses
                        </p>
                        <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 26, color: "#0D0D0D", lineHeight: 1 }}>
                            {hp.pause_count}
                        </p>
                    </div>
                </div>
                <ScoreBar score={hp.score} />
            </div>

            {/* 2×2 metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #F0F0EE" }}>
                <div style={{ borderBottom: "1px solid #F0F0EE" }}>
                    <MetricCell
                        label="Pre-Speech Latency"
                        value={`${pre_speech_latency_ms.toFixed(0)} ms`}
                        sub={pre_speech_latency_ms > 700 ? "↑ Elevated" : pre_speech_latency_ms > 400 ? "Moderate" : "Minimal"}
                        borderRight
                    />
                </div>
                <div style={{ borderBottom: "1px solid #F0F0EE" }}>
                    <MetricCell
                        label="Fundamental Freq (f₀)"
                        value={`${pitch.mean_hz.toFixed(1)} Hz`}
                        sub={`σ = ${pitch.std_dev_hz.toFixed(1)} Hz`}
                    />
                </div>
                <MetricCell
                    label="Pitch Variance"
                    value={pitch.variance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    sub={pitch.variance < 600 && pitch.variance > 0 ? "Low · Monotone" : "Normal modulation"}
                    borderRight
                />
                <MetricCell
                    label="Energy Variability (CV)"
                    value={`${(hp.energy_cv * 100).toFixed(1)}%`}
                    sub={hp.energy_cv < 0.28 ? "Flat · Suppressed" : "Dynamic"}
                />
            </div>

            {/* Artifact row */}
            <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9, letterSpacing: "0.15em", color: "#ACACAA", textTransform: "uppercase", marginBottom: 4 }}>
                        Non-Lexical Artifact Index · Voiced {(pitch.voiced_ratio * 100).toFixed(1)}%
                    </p>
                    <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, color: "#6B6B6A" }}>
                        {non_lexical_artifacts.classification}
                    </p>
                </div>
                <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 22, color: "#0D0D0D" }}>
                    {(non_lexical_artifacts.sigh_ratio * 100).toFixed(2)}%
                </p>
            </div>
        </div>
    );
}
