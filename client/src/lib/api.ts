import { Scan, InsertScan } from "@shared/schema";
import { supabase } from "./supabaseClient";

const API_BASE = "/api";

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Supabase returns rows with raw snake_case column names, but the Scan TS
// type uses camelCase (per drizzle's pgTable mapping). The server has the
// same converter in server/storage.ts; this is the client-side equivalent.
// Without it, scan.originalImageUrl, modelVersion, heatmapImageUrl etc.
// silently come back as undefined and the UI shows blank images, '-'
// metadata, "undefined ms" inference time, and crashes the PDF export.
function fromDbScan(record: any): Scan {
  return {
    id: record.id,
    patientId: record.patient_id,
    timestamp: new Date(record.timestamp),
    originalImageUrl: record.original_image_url,
    heatmapImageUrl: record.heatmap_image_url,
    diagnosis: record.diagnosis,
    severity: record.severity,
    confidence: record.confidence,
    modelVersion: record.model_version,
    inferenceMode: record.inference_mode,
    inferenceTime: record.inference_time,
    preprocessingMethod: record.preprocessing_method,
    metadata: record.metadata ?? undefined,
  } as Scan;
}

export async function getScans(): Promise<Scan[]> {
  const { data, error } = await supabase.from("scans").select("*").order("timestamp", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromDbScan);
}

export async function getRecentScans(limit: number = 10): Promise<Scan[]> {
  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromDbScan);
}

export async function getScan(id: number): Promise<Scan> {
  const { data, error } = await supabase.from("scans").select("*").eq("id", id).single();
  if (error) throw new Error(error.message);
  return fromDbScan(data);
}

export async function createScan(scan: InsertScan): Promise<Scan> {
  // Map camelCase -> snake_case on the way in too
  const dbInsert = {
    patient_id: scan.patientId,
    original_image_url: scan.originalImageUrl,
    heatmap_image_url: scan.heatmapImageUrl,
    diagnosis: scan.diagnosis,
    severity: scan.severity,
    confidence: scan.confidence,
    model_version: scan.modelVersion,
    inference_mode: scan.inferenceMode,
    inference_time: scan.inferenceTime,
    preprocessing_method: scan.preprocessingMethod,
    metadata: scan.metadata ?? null,
  };
  const { data, error } = await supabase.from("scans").insert([dbInsert]).select().single();
  if (error) throw new Error(error.message);
  return fromDbScan(data);
}

export async function getPatientScans(patientId: string): Promise<Scan[]> {
  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .eq("patient_id", patientId)
    .order("timestamp", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromDbScan);
}

// Doctor-Patient Relationships

export interface ApprovedDoctor {
  id: string;
  name: string;
  email: string;
  specialty?: string;
  license_number?: string;
}

export interface PatientInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  assignedAt: string;
}

export async function getApprovedDoctors(): Promise<ApprovedDoctor[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, specialty, license_number")
    .eq("role", "doctor")
    .eq("status", "approved");

  if (error) throw new Error(error.message);
  return (data ?? []) as ApprovedDoctor[];
}

export async function selectDoctor(doctorId: string): Promise<{ ok: boolean; doctor: { id: string; name: string } }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const patientId = sessionData.session?.user?.id;
  if (!patientId) throw new Error("Not authenticated");

  // Upsert relationship using patient_id as the conflict key so a patient can change doctor
  const { data: upsertData, error: upsertErr } = await supabase
    .from("doctor_patients")
    .upsert({ patient_id: patientId, doctor_id: doctorId }, { onConflict: "patient_id" });

  if (upsertErr) {
    const msg = String(upsertErr.message || "").toLowerCase();
    if (!(msg.includes("duplicate") || msg.includes("unique") || (upsertErr.code && String(upsertErr.code).includes("23505")))) {
      throw new Error(upsertErr.message);
    }
    // otherwise ignore duplicate/conflict
  }

  // After upsert, re-fetch the patient's doctor to ensure UI refreshes
  const myDoctor = await getMyDoctor();
  return { ok: true, doctor: myDoctor.doctor ? { id: myDoctor.doctor.id, name: myDoctor.doctor.name } : { id: doctorId, name: "" } };
}

export async function getMyDoctor(): Promise<{ doctor: ApprovedDoctor | null }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const { data: relation, error: relErr } = await supabase
    .from("doctor_patients")
    .select("doctor_id")
    .eq("patient_id", userId)
    .limit(1)
    .maybeSingle();

  if (relErr) throw new Error(relErr.message);
  if (!relation) return { doctor: null };

  const { data: doctorProfile, error: docErr } = await supabase
    .from("profiles")
    .select("id, name, email, specialty, license_number")
    .eq("id", relation.doctor_id)
    .single();

  if (docErr) throw new Error(docErr.message);

  return { doctor: doctorProfile as ApprovedDoctor };
}

export async function getMyPatients(): Promise<PatientInfo[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  const doctorId = sessionData.session?.user?.id;
  
  if (!doctorId) throw new Error("Not authenticated");
  
  // Fetch relationships first
  const { data: relationships, error: relError } = await supabase
    .from("doctor_patients")
    .select("patient_id, created_at")
    .eq("doctor_id", doctorId);

  if (relError) throw new Error(relError.message);
  if (!relationships || relationships.length === 0) return [];

  // Fetch patient profiles for all patient IDs
  const patientIds = relationships.map(r => r.patient_id);
  
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, name, email, phone, date_of_birth, gender")
    .in("id", patientIds);

  if (profileError) throw new Error(profileError.message);
  if (!profiles) return [];

  // Merge profiles with created_at from relationships
  const result = profiles.map(profile => {
    const rel = relationships.find(r => r.patient_id === profile.id);
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone ?? undefined,
      date_of_birth: profile.date_of_birth ?? undefined,
      gender: profile.gender ?? undefined,
      assignedAt: rel?.created_at ?? "",
    } as PatientInfo;
  });
  
  return result;
}
