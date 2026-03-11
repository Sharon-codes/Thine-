import io
import os
import json
import asyncio
import numpy as np
import librosa
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

import whisper
import time
# ── Environment ───────────────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=Path(__file__).parent / ".env")
except ImportError:
    pass

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL   = "mistralai/mistral-7b-instruct:free"

try:
    from openai import OpenAI
    openrouter = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_API_KEY,
    ) if OPENROUTER_API_KEY else None
except Exception:
    openrouter = None

# ── Whisper (pre-loaded at startup for speed) ──────────────────────────────────
_whisper_model = None

def load_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        print("LOG: Initializing Whisper 'base.en' (Hidden Context mode)...")
        start = time.time()
        _whisper_model = whisper.load_model("base.en")
        print(f"LOG: Whisper loaded in {time.time() - start:.2f}s")
    return _whisper_model

executor = ThreadPoolExecutor(max_workers=4)
app = FastAPI(title="Resonance — Made for Thine")

@app.on_event("startup")
async def startup_event():
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(executor, load_whisper_model)

app.add_middleware(
    CORSMiddleware, allow_origins=["*"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


# ── Audio loading ─────────────────────────────────────────────────────────────
def load_audio_robust(contents: bytes):
    try:
        y, sr = librosa.load(io.BytesIO(contents), sr=16000, mono=True)
        if len(y) > 0:
            return y, sr
    except Exception:
        pass
    try:
        from pydub import AudioSegment
        audio = AudioSegment.from_file(io.BytesIO(contents))
        audio = audio.set_frame_rate(16000).set_channels(1).set_sample_width(2)
        samples = np.array(audio.get_array_of_samples(), dtype=np.float32) / 32768.0
        return samples, 16000
    except Exception:
        pass
    raise HTTPException(422, "Could not decode audio. Ensure ffmpeg is on PATH.")


# ── Composite hesitation score (0–10) ─────────────────────────────────────────
def _hesitation_score(lat_ms: float, pause_count: int, pause_ratio: float,
                       pvar: float, energy_cv: float) -> int:
    score = 0
    # Pre-speech latency
    if lat_ms > 400:  score += 1
    if lat_ms > 700:  score += 1
    if lat_ms > 1100: score += 1
    # Mid-speech pauses
    if pause_count >= 1: score += 1
    if pause_count >= 2: score += 1
    if pause_count >= 4: score += 1
    # Proportion of speech that is silence
    if pause_ratio > 0.22: score += 1
    # Monotone pitch (low variance)
    if 0 < pvar < 600:   score += 1
    # Flat energy envelope
    if energy_cv < 0.28:  score += 1
    return min(score, 10)


# ── Full spectral analysis ────────────────────────────────────────────────────
def _run_librosa(y: np.ndarray, sr: int) -> dict:
    duration_ms = (len(y) / sr) * 1000
    hop = 512

    # RMS energy
    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=hop)[0]
    max_rms  = np.max(rms)
    mean_rms = np.mean(rms)
    if max_rms < 1e-6:
        raise ValueError("No audio signal — check microphone.")

    # ── 1. Pre-speech latency — ADAPTIVE noise floor threshold ──────────────
    # 15th-percentile of RMS = quietest frames = background noise estimate
    noise_floor  = np.percentile(rms, 15)
    # Threshold: 5× noise floor, minimum of 6% peak (handles very quiet rooms)
    speech_thresh = max(noise_floor * 5.0, max_rms * 0.06)
    speech_frames = np.where(rms > speech_thresh)[0]
    first_speech  = int(speech_frames[0]) if len(speech_frames) else len(rms)
    latency_ms    = min((first_speech * hop / sr) * 1000, duration_ms)

    # ── 2. Mid-speech pause detection ────────────────────────────────────
    # Use same adaptive threshold for silence detection
    silence_thresh = max(noise_floor * 3.0, max_rms * 0.04)
    is_silence      = rms < silence_thresh
    # Ignore pure pre-speech silence (before first_speech)
    mid_silence     = is_silence.copy()
    mid_silence[:first_speech] = False

    # Count silence islands (speech→silence transitions)
    transitions  = np.diff(mid_silence.astype(int))
    pause_count  = int(np.sum(transitions == 1))  # rising edge = entering silence
    pause_frames = int(np.sum(mid_silence))
    total_mid    = max(len(rms) - first_speech, 1)
    pause_ratio  = float(pause_frames / total_mid)

    # Energy coefficient of variation (flatness measure)
    speech_energy = rms[rms > silence_thresh]
    energy_cv = float(np.std(speech_energy) / np.mean(speech_energy)) if len(speech_energy) > 1 else 0.0

    # ── 3. Pitch via YIN (fast — 3–5× faster than pyin) ────────────────────
    try:
        f0 = librosa.yin(
            y,
            fmin=float(librosa.note_to_hz("C2")),
            fmax=float(librosa.note_to_hz("C7")),
            sr=sr, hop_length=hop,
        )
        # Filter to plausible speech range to approximate voiced frames
        voiced_mask  = (f0 >= 60) & (f0 <= 500)
        voiced_f0    = f0[voiced_mask]
        voiced_ratio = float(np.sum(voiced_mask) / max(len(f0), 1))
        pvar, pstd, pmean = (float(np.var(voiced_f0)), float(np.std(voiced_f0)), float(np.mean(voiced_f0))) if len(voiced_f0) > 1 else (0., 0., 0.)
    except Exception:
        voiced_mask = None
        pvar = pstd = pmean = voiced_ratio = 0.0

    # ── 4. ZCR artifact ratio ──────────────────────────────────────────────
    zcr      = librosa.feature.zero_crossing_rate(y, frame_length=1024, hop_length=hop)[0]
    high_zcr = zcr > (np.mean(zcr) + np.std(zcr))
    if voiced_mask is not None and len(voiced_mask) > 0:
        n = min(len(zcr), len(voiced_mask))
        sigh_ratio = float(np.sum(high_zcr[:n] & ~voiced_mask[:n]) / max(n, 1))
    else:
        sigh_ratio = float(np.sum(high_zcr) / max(len(zcr), 1))

    # ── 5. Composite hesitation score ─────────────────────────────────────────
    h_score = _hesitation_score(latency_ms, pause_count, pause_ratio, pvar, energy_cv)

    # ── 6. State inference ────────────────────────────────────────────────────
    state_label, state_code, confidence = _infer_state(
        latency_ms, pvar, voiced_ratio, sigh_ratio, duration_ms,
        pause_count, pause_ratio, energy_cv, h_score,
    )

    return {
        "duration_ms":           round(duration_ms, 1),
        "pre_speech_latency_ms": round(latency_ms, 1),
        "pitch": {
            "mean_hz":      round(pmean, 2),
            "variance":     round(pvar, 2),
            "std_dev_hz":   round(pstd, 2),
            "voiced_ratio": round(voiced_ratio, 3),
        },
        "hesitation_profile": {
            "score":        h_score,           # 0-10
            "pause_count":  pause_count,        # mid-speech silences
            "pause_ratio":  round(pause_ratio, 3),
            "energy_cv":    round(energy_cv, 3),
        },
        "non_lexical_artifacts": {
            "sigh_ratio":       round(sigh_ratio, 4),
            "classification":   _classify_sigh(sigh_ratio),
        },
        "cognitive_state": {"label": state_label, "code": state_code, "confidence": confidence},
    }


def _classify_sigh(r: float) -> str:
    if r > 0.35: return "HIGH — Respiratory stress markers detected"
    if r > 0.18: return "MODERATE — Elevated exhalation patterns"
    if r > 0.08: return "LOW — Within normal range"
    return "MINIMAL — Clean articulation"


def _infer_state(lat, pvar, vr, art, dur, pause_count, pause_ratio, energy_cv, score):
    # Relax the insufficient gate — only fail on truly empty signals
    if dur < 800 or vr < 0.05:
        return "Insufficient Signal — Reacquire", "INSUFFICIENT", "LOW"

    low_pv   = 0 < pvar < 600
    high_art = art > 0.18

    # Score-driven primary classification
    if score >= 8 and low_pv:
        return "Depleted / High Friction",            "DEPLETED",       "HIGH"
    if score >= 8:
        return "Guarded — Selective Disclosure",       "GUARDED",        "HIGH"
    if score >= 5 and low_pv:
        return "Cognitive Load — Deliberative Mode",   "COGNITIVE_LOAD", "HIGH"
    if score >= 5:
        return "Cognitive Load — Active Processing",   "COGNITIVE_LOAD", "MODERATE"
    if score >= 3 and low_pv and high_art:
        return "Masked Fatigue — Performing Composure","MASKED_FATIGUE", "HIGH"
    if score >= 3 and low_pv:
        return "Masked Fatigue — Performing Composure","MASKED_FATIGUE", "MODERATE"
    if score >= 3:
        return "Baseline — Moderate Friction",         "BASELINE",       "MODERATE"
    if score <= 2 and not low_pv and not high_art:
        return "Engaged / High Bandwidth",             "ENGAGED",        "HIGH"
    return "Functional — Moderate Activation",         "FUNCTIONAL",     "MODERATE"


# ── Local Whisper transcription ───────────────────────────────────────────────
def _transcribe_sync(y: np.ndarray, sr: int) -> str:
    try:
        w = load_whisper_model()
        y_norm = librosa.util.normalize(y)
        y_trimmed, _ = librosa.effects.trim(y_norm, top_db=25)
        y16k = y_trimmed.astype(np.float32)
        res = w.transcribe(y16k, language="en", fp16=False)
        return res.get("text", "").strip()
    except Exception:
        return ""

# ── Heuristic fusion fallback ─────────────────────────────────────────────────
def _heuristic_fusion(telemetry: dict) -> dict:
    code  = telemetry["cognitive_state"]["code"]
    score = telemetry["hesitation_profile"]["score"]
    pauses = telemetry["hesitation_profile"]["pause_count"]

    intents = {
        "DEPLETED":       "The acoustic signature shows deep fatigue. There is a disconnect between the active effort and the internal energy.",
        "GUARDED":        "High friction detected. This cadence suggests significant internal selection or filtering of intent.",
        "COGNITIVE_LOAD": f"Active deliberation. The {pauses} pauses indicate the user is drafting thoughts in real-time.",
        "MASKED_FATIGUE": "High-composure shielding. The steady tone masks a high cognitive cost.",
        "ENGAGED":        "Coherence. The flow is natural and the voice is in full alignment with the present moment.",
        "FUNCTIONAL":     "Operational steady-state. Functional communication with moderate internal monitoring.",
        "BASELINE":       "Neutral acoustic baseline. No significant deviation from the norm.",
        "INSUFFICIENT":   "Signal too short for profiling.",
    }
    
    if score >= 6:
        nudge = "The hesitation suggests you might be holding back — notice if what you're not saying is more important than what you are."
    elif score >= 3:
        nudge = "You're processing this live. Trust the pause; it's where the best clarity usually lives."
    else:
        nudge = "You sound certain and coherent. Trust this clarity — it's a good time to act on it."

    return {
        "latent_intent": intents.get(code, intents["BASELINE"]),
        "gentle_nudge":  nudge,
    }

def _fuse_sync(transcript: str, telemetry: dict) -> dict:
    """Uses hidden transcript to provide personalized nudges."""
    if not openrouter:
        return _heuristic_fusion(telemetry)

    lat    = telemetry["pre_speech_latency_ms"]
    pvar   = telemetry["pitch"]["variance"]
    art    = round(telemetry["non_lexical_artifacts"]["sigh_ratio"] * 100, 2)
    state  = telemetry["cognitive_state"]["label"]
    score  = telemetry["hesitation_profile"]["score"]
    pauses = telemetry["hesitation_profile"]["pause_count"]

    system = (
        "You are 'Resonance', an elite empathetic AI. You analyze the mismatch between WHAT a person says and HOW they say it. "
        "The TRANSCRIPT is provided for your context only. Do not repeat it verbatim. "
        "If they say they are 'fine' but have high friction (Score 5+), tell them exactly what you heard in their hesitation. "
        "If they sound certain, encourage them to trust that clarity. "
        "Respond ONLY with JSON: {\"latent_intent\": \"<one high-ego clinical insight>\", \"gentle_nudge\": \"<one incredibly personalized advice using cues from what they said>\"}."
    )
    user = (
        f"Transcript: \"{transcript}\" | "
        f"Acoustic Telemetry: Latency={lat}ms, Score={score}/10, "
        f"Pauses={pauses}, Pitch_Var={pvar}, Artifacts={art}%, State={state}"
    )
    try:
        resp = openrouter.chat.completions.create(
            model=OPENROUTER_MODEL,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            response_format={"type": "json_object"},
            temperature=0.7, max_tokens=150,
        )
        data = json.loads(resp.choices[0].message.content or "{}")
        if data.get("latent_intent"):
            return data
    except Exception:
        pass
    return _heuristic_fusion(telemetry)


# ── Endpoint ──────────────────────────────────────────────────────────────────
@app.post("/api/analyze-audio")
async def analyze_audio(audio: UploadFile = File(...)):
    contents = await audio.read()
    if len(contents) < 500:
        raise HTTPException(400, "Audio payload too small.")

    y, sr = load_audio_robust(contents)
    if (len(y) / sr) < 0.5:
        raise HTTPException(400, "Recording too short — hold for at least 1 second.")

    loop = asyncio.get_event_loop()
    telemetry_task = loop.run_in_executor(executor, _run_librosa, y, sr)
    transcript_task = loop.run_in_executor(executor, _transcribe_sync, y, sr)
    
    telemetry, transcript = await asyncio.gather(telemetry_task, transcript_task)
    fusion = await loop.run_in_executor(executor, _fuse_sync, transcript, telemetry)

    return {**telemetry, **fusion}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
