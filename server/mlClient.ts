// Server-side ML client. Mirrors the mobile app's predictFundus normalization
// (mobile/src/lib/mlApi.ts) so the schema stored in `scans` is identical
// regardless of which client created the row.
//
// Uses Node 20+ globals (fetch, FormData, Blob) — no additional deps.

import { Buffer } from "buffer";

export type ModelKey = "rp_v1" | "partner";

export interface Prediction {
  classId: number;          // 0..4
  className: string;        // "No DR" | "Mild" | "Moderate" | "Severe" | "Proliferative"
  confidence: number;       // 0..1
  probabilities: Record<string, number>;
  calibrated: boolean;
  temperatureUsed: number;
  heatmapBase64?: string;
  modelKey: ModelKey;
  colormap?: string;        // turbo | inferno | etc — what the server applied
}

export interface ModelInfo {
  key: ModelKey;
  label: string;
  description: string;
  url: string | undefined;
  apiKey: string | undefined;
  preprocessing: string;
  modelVersion: string;
}

const MODELS: Record<ModelKey, ModelInfo> = {
  rp_v1: {
    key: "rp_v1",
    label: "RetinaPilot v1",
    description: "Calibrated EfficientNet-B4 + Ben-Graham preprocessing + 4-pass TTA",
    url: process.env.DR_API_URL,
    apiKey: process.env.DR_API_KEY,
    preprocessing: "ben_graham",
    modelVersion: "efficientnet_b4_v1",
  },
  partner: {
    key: "partner",
    label: "Partner Model",
    description: "EfficientNet-B4 with median + gamma preprocessing",
    url: process.env.DR_API_URL_PARTNER,
    apiKey: process.env.DR_API_KEY_PARTNER,
    preprocessing: "median_gamma",
    modelVersion: "partner_efficientnet_b4",
  },
};

export const DEFAULT_MODEL: ModelKey = "rp_v1";
const REQUEST_TIMEOUT_MS = 60_000; // HF Space cold start can take 30-45s

const CLASS_NAMES = ["No DR", "Mild", "Moderate", "Severe", "Proliferative"];

export function getAvailableModels(): ModelInfo[] {
  return Object.values(MODELS).filter((m) => !!m.url);
}

export function getModelInfo(key: ModelKey): ModelInfo {
  return MODELS[key];
}

export function isMlBackendConfigured(): boolean {
  return !!MODELS[DEFAULT_MODEL].url;
}

export function mapClassToSeverity(
  classId: number,
): "normal" | "mild" | "moderate" | "severe" {
  if (classId === 0) return "normal";
  if (classId === 1) return "mild";
  if (classId === 2) return "moderate";
  return "severe"; // 3 (Severe) + 4 (Proliferative) both map to severe
}

export function diagnosisFromPrediction(prediction: Prediction): string {
  if (prediction.classId === 0) return "No DR";
  // Strip a trailing " DR" if the backend already includes it (partner does).
  const name = prediction.className.replace(/\s+DR$/, "");
  return `${name} DR`;
}

export type Colormap = "turbo" | "inferno" | "magma" | "viridis" | "jet";
export const DEFAULT_COLORMAP: Colormap = "turbo";

/**
 * Call the FastAPI /predict endpoint with a fundus image buffer and return a
 * normalized Prediction. Throws on network/HTTP/parse errors.
 */
export async function predictFundus(
  buffer: Buffer,
  mimetype: string,
  filename: string,
  modelKey: ModelKey = DEFAULT_MODEL,
  colormap: Colormap = DEFAULT_COLORMAP,
): Promise<Prediction> {
  const model = MODELS[modelKey];
  if (!model.url) {
    throw new Error(`${model.label} URL not configured (set DR_API_URL${modelKey === "partner" ? "_PARTNER" : ""})`);
  }

  const fd = new FormData();
  // Node's global FormData accepts Blob from buffer
  fd.append("file", new Blob([buffer], { type: mimetype || "image/jpeg" }), filename);
  // Partner doesn't accept this field; it's ignored harmlessly. RetinaPilot
  // reads it server-side and selects the matching cv2 colormap.
  fd.append("colormap", colormap);

  const headers: Record<string, string> = {};
  if (model.apiKey) headers["x-api-key"] = model.apiKey;

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${model.url.replace(/\/$/, "")}/predict`, {
      method: "POST",
      body: fd,
      headers,
      signal: ctl.signal,
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error(
        `${model.label} timed out — the model server may be cold-starting.`,
      );
    }
    throw new Error(`Could not reach ${model.label}: ${err?.message ?? "network error"}`);
  } finally {
    clearTimeout(timer);
  }

  let body: any;
  try {
    body = await res.json();
  } catch {
    throw new Error(`${model.label} returned non-JSON (HTTP ${res.status})`);
  }

  if (!res.ok) {
    throw new Error(body?.detail || `${model.label} failed (HTTP ${res.status})`);
  }

  // Normalize across backend variants — confidence may be 0..1 (RetinaPilot)
  // or 0..100 (partner). Heatmap field name varies.
  const rawConfidence = Number(body.confidence);
  const confidence = rawConfidence > 1 ? rawConfidence / 100 : rawConfidence;
  const heatmap =
    typeof body.heatmap_b64 === "string" && body.heatmap_b64.length > 0
      ? body.heatmap_b64
      : typeof body.heatmap === "string" && body.heatmap.length > 0
        ? body.heatmap
        : undefined;

  return {
    classId: Number(body.class_id),
    className: String(body.class_name),
    confidence,
    probabilities: body.probabilities ?? {},
    calibrated: !!body.calibrated,
    temperatureUsed: Number(body.temperature_used ?? 1),
    heatmapBase64: heatmap,
    modelKey,
    colormap: typeof body.colormap === "string" ? body.colormap : undefined,
  };
}

/** Decode a base64 heatmap string to a Buffer for storage upload. */
export function heatmapBufferFromBase64(base64: string): Buffer {
  return Buffer.from(base64, "base64");
}

export { CLASS_NAMES };
