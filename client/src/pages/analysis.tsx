// The original /analysis page ran a hardcoded 4.5-second demo timer and
// inserted a fake "Severe DR" scan row — it predates the real ML pipeline.
// Now that uploads go through /doctor (doctor-dashboard.tsx, posting to
// /api/doctor/upload which calls the real HF Space), this route is dead.
// We keep the path so any deep-links / bookmarks from earlier still resolve,
// but bounce straight to the dashboard.

import { useEffect } from "react";
import { useLocation } from "wouter";

export default function AnalysisPage() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/doctor");
  }, [setLocation]);
  return null;
}
