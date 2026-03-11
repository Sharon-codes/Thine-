export interface TelemetryPitch {
    mean_hz: number;
    variance: number;
    std_dev_hz: number;
    voiced_ratio: number;
}

export interface HesitationProfile {
    score: number;       // 0–10 composite
    pause_count: number; // mid-speech silences
    pause_ratio: number;
    energy_cv: number;
}

export interface TelemetryArtifacts {
    sigh_ratio: number;
    classification: string;
}

export interface TelemetryCognitiveState {
    label: string;
    code: string;
    confidence: string;
}

export interface TelemetryResult {
    duration_ms: number;
    pre_speech_latency_ms: number;
    pitch: TelemetryPitch;
    hesitation_profile: HesitationProfile;
    non_lexical_artifacts: TelemetryArtifacts;
    cognitive_state: TelemetryCognitiveState;
    latent_intent: string;
    gentle_nudge: string;
}
