import { WebLayout } from "@/components/web-layout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Info,
  Download,
  ChevronUp,
  ArrowLeft,
  Cpu,
  Calendar,
  AlertCircle,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getScan, getProfileName } from "@/lib/api";
import { Link, useRoute } from "wouter";
import { format } from "date-fns";
import { jsPDF } from "jspdf";

// 5-class palette + display order. Mirrors mobile's Results screen.
const PROB_ORDER = ["No DR", "Mild", "Moderate", "Severe", "Proliferative"] as const;
const PROB_COLOR: Record<(typeof PROB_ORDER)[number], string> = {
  "No DR": "bg-emerald-500",
  Mild: "bg-yellow-500",
  Moderate: "bg-orange-500",
  Severe: "bg-red-500",
  Proliferative: "bg-purple-500",
};

const SEVERITY_BADGE: Record<string, string> = {
  normal: "bg-emerald-100 text-emerald-700 border-emerald-200",
  mild: "bg-yellow-100 text-yellow-700 border-yellow-200",
  moderate: "bg-orange-100 text-orange-700 border-orange-200",
  severe: "bg-red-100 text-red-700 border-red-200",
  unknown: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function ResultsPage() {
  const [, params] = useRoute("/results/:id");
  const scanId = params?.id ? parseInt(params.id) : undefined;

  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data: scan, isLoading } = useQuery({
    queryKey: ["scan", scanId],
    queryFn: () => getScan(scanId!),
    enabled: !!scanId,
  });

  // Look up the patient's display name. Quietly resolves to null when
  // RLS denies (e.g. a different patient viewing this scan) — the UI
  // falls back to "Patient" rather than the raw UUID.
  const { data: patientName } = useQuery({
    queryKey: ["profile-name", scan?.patientId],
    queryFn: () => getProfileName(scan!.patientId),
    enabled: !!scan?.patientId,
    staleTime: 5 * 60_000,
  });

  if (isLoading || !scan) {
    return (
      <WebLayout title="Loading...">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-slate-400">Loading scan results...</div>
        </div>
      </WebLayout>
    );
  }

  // Pull richer metadata stored by the new server-side ML pipeline.
  // metadata is JSONB -> typed as unknown; read loosely.
  const meta = (scan.metadata as Record<string, any> | null) ?? {};
  const probabilities = (meta.probabilities ?? null) as Record<string, number> | null;
  const modelLabel = (meta.modelLabel ?? null) as string | null;
  const isFailed = scan.inferenceMode === "failed";
  const hasDistinctHeatmap =
    !!scan.heatmapImageUrl && scan.heatmapImageUrl !== scan.originalImageUrl;
  const severityKey = (scan.severity || "unknown").toLowerCase();
  const badgeClass = SEVERITY_BADGE[severityKey] ?? SEVERITY_BADGE.unknown;

  const exportPDF = async () => {
    if (!scan) return;
    try {
      setIsExporting(true);
      // Direct jspdf render — no DOM snapshot, no html2canvas, no oklch
      // parsing. Fully vector + embedded raster fundus images.
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const W = pdf.internal.pageSize.getWidth();      // 595
      const H = pdf.internal.pageSize.getHeight();     // 842
      const M = 36;                                    // page margin
      let y = M;

      // ── Header ──────────────────────────────────────────────────────
      pdf.setFillColor(14, 165, 233);                   // primary blue
      pdf.rect(0, 0, W, 6, "F");
      y += 4;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.setTextColor(15, 23, 42);
      pdf.text("RetinaPilot", M, y + 14);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text("AI-guided diabetic retinopathy screening", M, y + 28);

      pdf.setFontSize(8);
      pdf.text(
        `Report ID: ${scan.id}    ${format(new Date(scan.timestamp), "PPp")}`,
        W - M,
        y + 14,
        { align: "right" },
      );
      if (modelLabel) {
        pdf.text(`Analyzed by ${modelLabel}`, W - M, y + 28, { align: "right" });
      }
      y += 44;

      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.5);
      pdf.line(M, y, W - M, y);
      y += 18;

      // ── Diagnosis block ─────────────────────────────────────────────
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.text("Screening result", M, y);
      y += 6;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      const kvRow = (label: string, value: unknown) => {
        // jspdf.text throws on undefined/null. Coerce defensively.
        const text =
          value === null || value === undefined || value === ""
            ? "-"
            : String(value);
        y += 14;
        pdf.setTextColor(100, 116, 139);
        pdf.text(label, M, y);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont("helvetica", "bold");
        pdf.text(text, M + 90, y);
        pdf.setFont("helvetica", "normal");
      };
      if (patientName) kvRow("Patient", patientName);
      kvRow("Diagnosis", scan.diagnosis || "Pending Analysis");
      kvRow("Severity", scan.severity || "unknown");
      kvRow("Confidence", typeof scan.confidence === "number" ? `${scan.confidence}%` : null);
      kvRow("Model version", scan.modelVersion);
      kvRow("Preprocessing", scan.preprocessingMethod);
      kvRow(
        "Inference time",
        typeof scan.inferenceTime === "number" ? `${scan.inferenceTime} ms` : null,
      );
      y += 18;

      // ── Image(s) — embed via async loader ───────────────────────────
      const loadDataUrl = (url: string) =>
        new Promise<string | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            try {
              const c = document.createElement("canvas");
              c.width = img.naturalWidth;
              c.height = img.naturalHeight;
              const ctx = c.getContext("2d");
              if (!ctx) return resolve(null);
              ctx.drawImage(img, 0, 0);
              resolve(c.toDataURL("image/jpeg", 0.85));
            } catch {
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          img.src = url;
        });

      const original = await loadDataUrl(scan.originalImageUrl);
      const heatmap = hasDistinctHeatmap ? await loadDataUrl(scan.heatmapImageUrl) : null;

      const imgW = (W - M * 2 - 12) / 2; // two columns
      const imgH = imgW; // square
      if (original) {
        if (y + imgH > H - M) {
          pdf.addPage();
          y = M;
        }
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text("Original fundus", M, y);
        if (heatmap) pdf.text("AI heatmap", M + imgW + 12, y);
        y += 6;
        pdf.addImage(original, "JPEG", M, y, imgW, imgH);
        if (heatmap) pdf.addImage(heatmap, "JPEG", M + imgW + 12, y, imgW, imgH);
        y += imgH + 18;
      }

      // ── Probability distribution ────────────────────────────────────
      if (probabilities && Object.keys(probabilities).length > 0) {
        if (y + 130 > H - M) {
          pdf.addPage();
          y = M;
        }
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(15, 23, 42);
        pdf.text("Probability distribution", M, y);
        y += 4;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        const barX = M + 110;
        const barW = W - M - barX - 50;
        for (const cls of PROB_ORDER) {
          y += 14;
          const p = probabilities[cls] ?? probabilities[`${cls} DR`] ?? 0;
          const pct = p * 100;

          pdf.setTextColor(71, 85, 105);
          pdf.text(cls, M, y);

          pdf.setFillColor(241, 245, 249);
          pdf.roundedRect(barX, y - 7, barW, 8, 4, 4, "F");
          if (pct > 0) {
            const fillW = Math.max(3, (Math.min(100, pct) / 100) * barW);
            // class colors in RGB to avoid oklch
            const colors: Record<string, [number, number, number]> = {
              "No DR": [16, 185, 129],
              Mild: [234, 179, 8],
              Moderate: [249, 115, 22],
              Severe: [239, 68, 68],
              Proliferative: [168, 85, 247],
            };
            const [r, g, b] = colors[cls] ?? [14, 165, 233];
            pdf.setFillColor(r, g, b);
            pdf.roundedRect(barX, y - 7, fillW, 8, 4, 4, "F");
          }

          pdf.setTextColor(71, 85, 105);
          pdf.text(`${pct.toFixed(1)}%`, W - M, y, { align: "right" });
        }
        y += 18;
      }

      // ── Footer disclaimer ───────────────────────────────────────────
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      const disclaimer =
        "This report was generated by RetinaPilot's AI screening system. The analysis is for screening purposes only and does not constitute a medical diagnosis. Please consult a qualified ophthalmologist.";
      const wrapped = pdf.splitTextToSize(disclaimer, W - M * 2);
      pdf.text(wrapped, M, H - M);

      const safeName = (s: string) =>
        s.normalize("NFKD").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const parts = [
        "RetinaPilot",
        patientName ? safeName(patientName) : null,
        safeName(scan.diagnosis || "report"),
        format(new Date(scan.timestamp), "yyyy-MM-dd"),
        String(scan.id),
      ].filter(Boolean);
      const filename = `${parts.join("_")}.pdf`;
      pdf.save(filename);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <WebLayout title="Analysis Results">
      <div className="mx-auto max-w-6xl">
        {/* Back link */}
        <Link href="/results">
          <span className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 cursor-pointer">
            <ArrowLeft className="h-4 w-4" /> Back to history
          </span>
        </Link>

        {/* Failed-inference banner */}
        {isFailed && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-900">Analysis could not complete</p>
              <p className="mt-1 text-sm text-red-700">
                The AI model could not analyze this image. The fundus may be too blurry,
                poorly lit, or not a recognizable retinal photograph. Please retake the
                image and try again.
              </p>
            </div>
          </div>
        )}

        {/* Top: side-by-side original + heatmap. Stacks under lg. */}
        <div className="mb-6">
          {scan.originalImageUrl ? (
            <div
              className={`grid gap-4 ${
                hasDistinctHeatmap ? "md:grid-cols-2" : "grid-cols-1"
              }`}
            >
              {/* Original fundus */}
              <figure className="space-y-2">
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-900 shadow-md">
                  <img
                    src={scan.originalImageUrl}
                    alt="Original fundus"
                    className="absolute inset-0 h-full w-full object-contain"
                    data-testid="img-fundus-original"
                  />
                  <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur">
                    Original
                  </span>
                </div>
              </figure>

              {/* AI heatmap (only when distinct from original) */}
              {hasDistinctHeatmap && (
                <figure className="space-y-2">
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-900 shadow-md">
                    <img
                      src={scan.heatmapImageUrl}
                      alt="AI Grad-CAM heatmap"
                      className="absolute inset-0 h-full w-full object-contain"
                      data-testid="img-fundus-heatmap"
                    />
                    <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur">
                      AI Heatmap
                      {meta.colormap ? ` · ${String(meta.colormap)}` : ""}
                    </span>
                  </div>
                </figure>
              )}
            </div>
          ) : (
            <div className="flex h-[280px] w-full items-center justify-center rounded-2xl bg-slate-900 text-sm text-slate-400">
              No image available
            </div>
          )}

          {hasDistinctHeatmap && (
            <p className="mt-3 text-center text-xs text-slate-500">
              Warm (red/yellow) areas show regions the AI focused on for this diagnosis.
            </p>
          )}
        </div>

        {/* Diagnosis + metadata — centered column under the images */}
        <div className="mx-auto max-w-3xl">
          <div className="space-y-4">
            {/* Diagnosis Card */}
            <Card className="p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(scan.timestamp), "MMM d, yyyy • HH:mm")}
                    </Badge>
                    {patientName && (
                      <Badge variant="secondary" className="gap-1.5">
                        <User className="h-3 w-3" />
                        {patientName}
                      </Badge>
                    )}
                  </div>
                  <h2
                    className="text-2xl font-bold text-slate-900 dark:text-white truncate"
                    data-testid="text-diagnosis"
                  >
                    {scan.diagnosis || "Pending Analysis"}
                  </h2>
                </div>
                <Badge className={`shrink-0 capitalize ${badgeClass}`} variant="outline">
                  {scan.severity || "unknown"}
                </Badge>
              </div>

              {/* Confidence bar */}
              <div className="mb-4">
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    AI confidence
                  </span>
                  <span
                    className="font-mono text-2xl font-bold text-primary"
                    data-testid="text-confidence-score"
                  >
                    {scan.confidence}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(0, Math.min(100, scan.confidence))}%` }}
                  />
                </div>
              </div>

              {modelLabel && (
                <div className="mb-4 flex items-center gap-1.5 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600 border border-slate-100">
                  <Cpu className="h-3.5 w-3.5 text-slate-500" />
                  Analyzed by <span className="font-medium text-slate-900">{modelLabel}</span>
                </div>
              )}

              <Button
                onClick={exportPDF}
                disabled={isExporting}
                className="w-full gap-2"
                data-testid="button-save-report"
              >
                <Download className="h-4 w-4" />
                {isExporting ? "Generating..." : "Download PDF Report"}
              </Button>
            </Card>

            {/* Probability Distribution */}
            {probabilities && Object.keys(probabilities).length > 0 && (
              <Card className="p-5">
                <div className="mb-3 flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Probability Distribution
                  </h3>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">
                    Calibrated per-class
                  </span>
                </div>
                <div className="space-y-2.5">
                  {PROB_ORDER.map((cls) => {
                    const p = probabilities[cls] ?? probabilities[`${cls} DR`] ?? 0;
                    const pct = p * 100;
                    return (
                      <div key={cls} className="flex items-center gap-3">
                        <span className="w-24 text-xs text-slate-600">{cls}</span>
                        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`absolute left-0 top-0 h-full rounded-full ${PROB_COLOR[cls]}`}
                            style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                          />
                        </div>
                        <span className="w-12 text-right font-mono text-xs text-slate-500">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Technical Details (collapsed) */}
            <Card className="p-3">
              <Button
                variant="ghost"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full justify-between text-slate-500 hover:text-slate-900"
                data-testid="button-technical-details"
              >
                <span className="flex items-center gap-2 text-xs font-medium">
                  <Info className="h-4 w-4" /> Technical analysis
                </span>
                <ChevronUp
                  className={`h-4 w-4 transition-transform ${showDetails ? "rotate-180" : ""}`}
                />
              </Button>
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="mt-2 grid gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 font-mono text-xs"
                      data-testid="section-technical-details"
                    >
                      <DetailRow label="Model" value={scan.modelVersion} />
                      <DetailRow label="Inference" value={scan.inferenceMode} />
                      <DetailRow label="Pre-processing" value={scan.preprocessingMethod} />
                      <DetailRow label="Inference time" value={`${scan.inferenceTime} ms`} />
                      <DetailRow label="Patient" value={patientName ?? "Patient"} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </div>
        </div>
      </div>
    </WebLayout>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}:</span>
      <span className="text-slate-900">{value ?? "-"}</span>
    </div>
  );
}
