"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { TelemetryResult } from "@/types/telemetry";

// ── Contact button ───────────────────────────────────────────────────────────
// ── Thine / Resonance Access View ───────────────────────────────────────────
function ThineResponse({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] bg-[#0D0D0D] text-white flex flex-col p-6 md:p-24 overflow-y-auto"
    >
      {/* Top Navi */}
      <div className="flex justify-between items-center mb-8 md:mb-12">
        <motion.button
          onClick={onBack}
          whileHover={{ x: -5 }}
          className="font-mono text-[10px] tracking-[0.3em] text-neutral-500 hover:text-white transition-colors"
        >
          ← BACK_TO_SYSTEM
        </motion.button>
        <div className="font-mono text-[10px] tracking-[0.4em] text-red-500 font-bold">
          AUTH // ACCESS_GRANTED
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <motion.h1
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="text-4xl md:text-8xl font-light tracking-tight mb-8 md:mb-12 leading-[1.05]"
        >
          You aren't looking <br />
          for a <span className="text-neutral-500 italic">hire.</span>
        </motion.h1>

        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="max-w-2xl space-y-6 md:space-y-8 text-neutral-400 font-light text-lg md:text-xl leading-relaxed"
        >
          <p>
            Hire me because I don't just write code—I build <span className="text-white font-medium">resonance.</span> While others are debugging syntax, I'm debugging human connection.
          </p>
          <p className="text-white font-normal text-xl md:text-2xl">
            I ship systems that feel alive.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="mt-12 md:mt-20 flex flex-col md:flex-row flex-wrap gap-8 md:gap-12 border-t border-neutral-900 pt-10 md:pt-16"
        >
          {/* Identity */}
          <div className="flex flex-col gap-3">
            <p className="font-mono text-[9px] tracking-[0.2em] text-neutral-600 uppercase italic">HE_ARCHITECT //</p>
            <p className="text-2xl md:text-3xl font-light tracking-tight">Sharon Melhi</p>
          </div>

          {/* LinkedIn */}
          <div className="flex flex-col gap-3">
            <p className="font-mono text-[9px] tracking-[0.2em] text-neutral-600 uppercase italic">HIRE_ME // LINKEDIN</p>
            <a
              href="https://www.linkedin.com/in/sharon-melhi/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg md:text-xl text-white font-medium hover:text-red-500 hover:underline underline-offset-8 transition-all decoration-red-500/50 break-all"
            >
              linkedin.com/in/sharon-melhi
            </a>
          </div>

          {/* Gmail */}
          <div className="flex flex-col gap-3">
            <p className="font-mono text-[9px] tracking-[0.2em] text-neutral-600 uppercase italic">REACH_OUT // GMAIL</p>
            <a
              href="mailto:sharonmelhi365@gmail.com"
              className="text-lg md:text-xl text-white font-medium hover:text-red-500 hover:underline underline-offset-8 transition-all decoration-red-500/50 break-all"
            >
              sharonmelhi365@gmail.com
            </a>
          </div>
        </motion.div>
      </div>

      <footer className="mt-20 pt-12 border-t border-neutral-900">
        <div className="w-full flex flex-col gap-8">
          <p className="font-mono text-[10px] tracking-[0.3em] text-neutral-600 uppercase italic">THE_VIBE // WHY_ME</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 pb-12">
            <div className="space-y-3">
              <p className="text-white font-medium text-lg italic">Speed_</p>
              <p className="text-neutral-500 text-sm leading-relaxed">I ship fast because I hate waiting for my own ideas to load.</p>
            </div>
            <div className="space-y-3">
              <p className="text-white font-medium text-lg italic">Intent_</p>
              <p className="text-neutral-500 text-sm leading-relaxed">I'm obsessed with the 'why'. If it doesn't solve a human problem, it's just noise.</p>
            </div>
            <div className="space-y-3">
              <p className="text-white font-medium text-lg italic">Magic_</p>
              <p className="text-neutral-500 text-sm leading-relaxed">UX that feels like mind-reading. No placeholders, no excuses.</p>
            </div>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}


const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const N_BARS = 44;

type Phase = "idle" | "requesting" | "recording" | "processing" | "result" | "error";

const STATE_COLORS: Record<string, string> = {
  ENGAGED: "#15803D", FUNCTIONAL: "#1D4ED8", DEPLETED: "#B91C1C",
  COGNITIVE_LOAD: "#B45309", GUARDED: "#C2410C", MASKED_FATIGUE: "#6D28D9",
  BASELINE: "#71717A", INSUFFICIENT: "#A1A1AA",
};

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
      stroke={active ? "#DC2626" : "#71717A"} strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="#A1A1AA" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
        <animateTransform attributeName="transform" type="rotate"
          from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

// ── Telemetry metric cell ────────────────────────────────────────────────────
function Cell({ label, value, sub, border = "" }: { label: string; value: string; sub?: string; border?: string }) {
  return (
    <div className={`p-5 ${border}`}>
      <p className="font-mono text-[9px] tracking-[0.18em] text-neutral-400 uppercase mb-2">{label}</p>
      <p className="font-mono text-[22px] text-neutral-900 leading-none mb-1">{value}</p>
      {sub && <p className="font-mono text-[11px] text-neutral-400">{sub}</p>}
    </div>
  );
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<TelemetryResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [recSecs, setRecSecs] = useState(0);
  const [bars, setBars] = useState<number[]>(Array(N_BARS).fill(2));
  const [isThineAccess, setIsThineAccess] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Processing State Ticker ──
  const [tickerIdx, setTickerIdx] = useState(0);
  const tickerReasons = [
    "BUILDS AI THAT ACTUALLY LISTENS",
    "REPLACES BORING LOGS WITH HUMAN TRUTH",
    "SHIPS MAGIC BY THE LUNCH HOUR",
    "HEARS THE SILENCE BETWEEN THE WORDS",
    "PROBABLY ALREADY FIXED YOUR NEXT BUG",
    "ENGINEERING VIBES INTO PRODUCTION",
    "MAKING BOTS FEEL SLIGHTLY MORE HUMAN",
    "DESIGNING BEYOND THE BUTTON"
  ];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (phase === "processing") {
      interval = setInterval(() => {
        setTickerIdx(prev => (prev + 1) % tickerReasons.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [phase, tickerReasons.length]);
  const isHeld = useRef(false);

  const stopWaveform = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setBars(Array(N_BARS).fill(2));
  }, []);

  useEffect(() => {
    // ── Pre-warm Microphone ──
    async function warmMic() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        stream.getTracks().forEach(t => t.enabled = false);
      } catch (e) {
        console.warn("Mic pre-warm failed:", e);
      }
    }
    warmMic();
    return () => {
      stopTimer(); stopWaveform();
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close();
    };
  }, [stopWaveform]);

  const startWaveform = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const usable = Math.floor(analyser.frequencyBinCount * 0.35);
    const draw = () => {
      analyser.getByteFrequencyData(data);
      setBars(Array.from({ length: N_BARS }, (_, i) => {
        const idx = Math.floor((i / N_BARS) * usable);
        return Math.max(2, Math.round((data[idx] / 255) * 48));
      }));
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
  }, []);

  const stopTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };
  const startTimer = () => {
    setRecSecs(0);
    timerRef.current = setInterval(() => setRecSecs(s => s + 1), 1000);
  };

  useEffect(() => () => {
    stopTimer(); stopWaveform();
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
  }, [stopWaveform]);

  const startRecording = useCallback(async () => {
    if (phase !== "idle" && phase !== "result" && phase !== "error") return;
    setPhase("requesting");
    setResult(null);
    setErrorMsg("");

    let stream = streamRef.current;
    if (!stream || !stream.active) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      }
      catch { setPhase("error"); setErrorMsg("Microphone access denied."); return; }
    }

    // Enable the tracks
    stream.getTracks().forEach(t => t.enabled = true);

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    ctx.createMediaStreamSource(stream).connect(analyser);
    analyserRef.current = analyser;

    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/ogg") ? "audio/ogg" : "audio/webm";

    const recorder = new MediaRecorder(stream, { mimeType: mime });
    recorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };

    recorder.onstop = async () => {
      // Don't stop the stream, just disable tracks to keep it 'warm'
      stream.getTracks().forEach(t => t.enabled = false);
      ctx.close();
      stopWaveform();
      stopTimer();
      setPhase("processing");

      const blob = new Blob(chunksRef.current, { type: mime });
      const fd = new FormData();
      fd.append("audio", blob, "recording.webm");

      try {
        const res = await fetch(`${API_URL}/api/analyze-audio`, { method: "POST", body: fd });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "Backend error." }));
          throw new Error(err.detail ?? "Analysis failed.");
        }
        setResult(await res.json());
        setPhase("result");
      } catch (e: unknown) {
        setErrorMsg(e instanceof Error ? e.message : "Backend connection failed.");
        setPhase("error");
      }
    };

    recorder.start(100);
    setPhase("recording");
    startTimer();
    startWaveform();
  }, [phase, startWaveform, stopWaveform]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
  }, []);

  const handleMicClick = () => {
    if (phase === "recording") {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const recTimer = `${Math.floor(recSecs / 60).toString().padStart(2, "0")}:${(recSecs % 60).toString().padStart(2, "0")}`;
  const stateColor = result ? (STATE_COLORS[result.cognitive_state.code] ?? "#71717A") : "";

  if (isThineAccess) {
    return <ThineResponse onBack={() => setIsThineAccess(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#F9F9F8] flex flex-col">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${phase === "recording" ? "bg-red-500" : "bg-neutral-200"}`}
            style={phase === "recording" ? { animation: "pulse 1s infinite" } : {}} />
          <span className="font-medium text-lg tracking-tight text-neutral-800">
            Resonance
          </span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://thine.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[9px] tracking-[0.25em] text-neutral-400 hover:text-neutral-800 transition-colors uppercase hidden sm:block"
          >
            [ VISIT THINE.COM ]
          </a>
          <motion.button
            onClick={() => setIsThineAccess(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative font-mono text-[10px] tracking-[0.2em] text-red-600 font-bold border border-red-600/30 px-5 py-2 rounded-sm hover:border-red-600 transition-all overflow-hidden"
          >
            <span className="relative z-10">ACCESS</span>
            <motion.div
              animate={{ opacity: [0.05, 0.2, 0.05] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="absolute inset-0 bg-red-600"
            />
          </motion.button>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center px-4 py-12 gap-10 max-w-2xl mx-auto w-full">

        {/* ── Recording node ──────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-5">

          {/* Processing UI */}
          {phase === "processing" ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="w-full max-w-md flex flex-col items-center gap-8 mt-4"
            >
              <div className="w-full space-y-4">
                <div className="flex justify-between items-end">
                  <p className="font-mono text-[10px] tracking-[0.2em] text-neutral-400 uppercase">
                    Analyzing Voice Signature
                  </p>
                  <p className="font-mono text-[10px] tracking-[0.2em] text-red-500 font-bold">
                    SYSTEM_BUSY
                  </p>
                </div>
                {/* Cinematic Loading Bar */}
                <div className="h-[2px] w-full bg-neutral-100 relative overflow-hidden">
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute inset-0 bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                  />
                </div>
              </div>

              {/* Ticker Section */}
              <div className="text-center h-12 flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tickerIdx}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 0.8 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <p className="font-mono text-[9px] tracking-[0.3em] text-neutral-500 uppercase italic">
                      Value Proposition //
                    </p>
                    <p className="font-mono text-[11px] tracking-[0.25em] text-neutral-900 font-bold uppercase text-center px-4">
                      {tickerReasons[tickerIdx]}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <>
              <p className="font-mono text-[11px] text-neutral-400 tracking-wide text-center min-h-[16px]">
                {phase === "idle" && "Click to capture acoustic signature"}
                {phase === "requesting" && "Initializing..."}
                {phase === "recording" && <span className="text-red-500">● Recording {recTimer} · Click to stop</span>}
                {phase === "result" && <span className="text-neutral-500">Analysis complete · Click to start new session</span>}
                {phase === "error" && <span className="text-red-500">{errorMsg}</span>}
              </p>

              <button
                className={`relative flex flex-col items-center justify-center gap-2
                  w-36 h-36 rounded-full border
                  transition-all duration-200 select-none touch-none
                  ${phase === "recording"
                    ? "border-red-300 bg-red-50 recording-pulse"
                    : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm cursor-pointer"}`}
                onClick={handleMicClick}
                disabled={phase === "requesting"}
              >
                <MicIcon active={phase === "recording"} />
                <span className="font-mono text-[9px] tracking-[0.18em] text-neutral-400 uppercase">
                  {phase === "recording" ? "stop" : "start"}
                </span>
              </button>
            </>
          )}

          {/* Live waveform */}
          <div className="flex items-center gap-[2px] h-14 transition-opacity duration-300"
            style={{ opacity: phase === "recording" ? 1 : 0 }}>
            {bars.map((h, i) => (
              <div key={i} style={{ width: 3, height: h, borderRadius: 2, background: "#0D0D0D", transition: "height 60ms" }} />
            ))}
          </div>
        </div>

        {/* ── Results ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {phase === "result" && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full flex flex-col gap-4"
            >
              {/* Cognitive state banner */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
                className="flex items-center justify-between px-5 py-4 bg-white border border-neutral-200 rounded-lg"
              >
                <div>
                  <p className="font-mono text-[9px] tracking-[0.18em] text-neutral-400 uppercase mb-1">
                    Inferred Cognitive State
                  </p>
                  <p className="text-[17px] font-medium" style={{ color: stateColor }}>
                    {result.cognitive_state.label}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: stateColor }} />
                  <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: stateColor }}>
                    {result.cognitive_state.confidence}
                  </span>
                </div>
              </motion.div>

              {/* Telemetry grid — hesitation score + metrics */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                className="bg-white border border-neutral-200 rounded-lg overflow-hidden"
              >
                {/* Hesitation Score row — hero metric */}
                {result.hesitation_profile && (
                  <div className="px-5 py-4 border-b border-neutral-100">
                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <p className="font-mono text-[9px] tracking-[0.15em] text-neutral-400 uppercase mb-1">Acoustic Friction</p>
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-3xl leading-none" style={{
                            color:
                              result.hesitation_profile.score <= 2 ? "#15803D" :
                                result.hesitation_profile.score <= 4 ? "#65A30D" :
                                  result.hesitation_profile.score <= 6 ? "#B45309" :
                                    result.hesitation_profile.score <= 8 ? "#C2410C" : "#B91C1C"
                          }}>{result.hesitation_profile.score}</span>
                          <span className="font-mono text-[13px] text-neutral-300">/10</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[9px] tracking-[0.15em] text-neutral-400 uppercase mb-1">Intent Pauses</p>
                        <p className="font-mono text-3xl text-neutral-800 leading-none">{result.hesitation_profile.pause_count}</p>
                      </div>
                    </div>
                    {/* Score bar */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="font-mono text-[8px] text-neutral-300 tracking-widest">LOW FRICTION</span>
                        <span className="font-mono text-[8px] text-neutral-300 tracking-widest">HIGH FRICTION</span>
                      </div>
                      <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{
                          width: `${(result.hesitation_profile.score / 10) * 100}%`,
                          background: result.hesitation_profile.score <= 2 ? "#15803D" :
                            result.hesitation_profile.score <= 4 ? "#65A30D" :
                              result.hesitation_profile.score <= 6 ? "#B45309" :
                                result.hesitation_profile.score <= 8 ? "#C2410C" : "#B91C1C",
                        }} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 divide-x divide-y divide-neutral-100">
                  <Cell label="The Intent Gap"
                    value={`${result.pre_speech_latency_ms.toFixed(0)} ms`}
                    sub={result.pre_speech_latency_ms > 700 ? "↑ Elevated" : result.pre_speech_latency_ms > 400 ? "Moderate" : "Minimal"}
                    border="" />
                  <Cell label="Vocal Baseline"
                    value={`${result.pitch.mean_hz.toFixed(1)} Hz`}
                    sub={`σ = ${result.pitch.std_dev_hz.toFixed(1)} Hz`} />
                  <Cell label="The Monotone Index"
                    value={result.pitch.variance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    sub={result.pitch.variance < 600 && result.pitch.variance > 0 ? "Flat · Controlled" : "Normal modulation"} />
                  <Cell label="Vocal Conviction"
                    value={result.hesitation_profile ? `${(result.hesitation_profile.energy_cv * 100).toFixed(1)}%` : "—"}
                    sub={result.hesitation_profile && result.hesitation_profile.energy_cv < 0.28 ? "Steady · Filtered" : "Dynamic"} />
                </div>
                <div className="px-5 py-3 border-t border-neutral-100 flex justify-between">
                  <span className="font-mono text-[9px] tracking-[0.15em] text-neutral-400 uppercase">Acoustic Logic</span>
                  <span className="font-mono text-[11px] text-neutral-600">
                    {(result.duration_ms / 1000).toFixed(1)}s · Flow {(result.pitch.voiced_ratio * 100).toFixed(1)}% · Noise {(result.non_lexical_artifacts.sigh_ratio * 100).toFixed(2)}%
                  </span>
                </div>
              </motion.div>

              {/* Synthesis layer */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
                className="bg-white border border-neutral-200 rounded-lg overflow-hidden"
              >
                {/* Header */}
                <div className="px-5 py-3 border-b border-neutral-100">
                  <p className="font-mono text-[9px] tracking-[0.2em] text-neutral-400 uppercase">
                    Synthesis Layer · Acoustic Resonance
                  </p>
                </div>

                <div className="p-5">
                  <p className="font-mono text-[9px] tracking-[0.15em] text-neutral-400 uppercase mb-3">
                    Latent Intent
                  </p>
                  <p className="text-[14px] text-neutral-800 leading-relaxed font-medium">
                    {result.latent_intent}
                  </p>
                </div>

                {/* Gentle Nudge */}
                <div className="px-5 pb-5 pt-0">
                  <div className="bg-red-50/30 border border-red-100/50 rounded-xl p-5">
                    <p className="font-mono text-[9px] tracking-[0.15em] text-red-500 uppercase mb-3">
                      Gentle Nudge
                    </p>
                    <p className="text-[16px] text-neutral-800 leading-relaxed font-light">
                      {result.gentle_nudge}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error retry */}
        {phase === "error" && (
          <button onClick={() => setPhase("idle")}
            className="font-mono text-[11px] tracking-widest text-neutral-400 border border-neutral-200 px-5 py-2 hover:border-neutral-300 transition-colors">
            [ RETRY ]
          </button>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="px-6 py-12 border-t border-neutral-100 mt-auto opacity-30 grayscale hover:opacity-100 transition-opacity">
        <div className="max-w-2xl mx-auto text-center">
          <a href="https://thine.com" target="_blank" rel="noopener noreferrer" className="font-mono text-[9px] tracking-[0.3em] uppercase hover:underline underline-offset-4">
            developed for thine.com
          </a>
        </div>
      </footer>
    </div>
  );
}
