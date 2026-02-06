import { useEffect, useState } from "react";
import { WebLayout } from "@/components/web-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { ShieldCheck, ShieldX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PendingDoctor {
  id: string;
  name: string;
  email: string;
  licenseNumber?: string;
  specialty?: string;
  status: string;
}

async function authFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const { data: sessionData, error } = await supabase.auth.getSession();
  if (error || !sessionData.session?.access_token) {
    throw new Error("Missing session");
  }
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionData.session.access_token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Request failed");
  }
  return response.json();
}

export default function AdminDashboard() {
  const [doctors, setDoctors] = useState<PendingDoctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPending = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Try server-side API first (preferred for production)
      try {
        const pending = await authFetch<PendingDoctor[]>('/api/admin/doctors/pending');
        setDoctors(pending ?? []);
      } catch (e: any) {
        // If server is not available (static hosting), fall back to client-side Supabase
        // This requires RLS that permits admins to SELECT pending doctors from `profiles`.
        console.warn('Admin API unavailable, falling back to Supabase client:', e?.message ?? e);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email, license_number, specialty, status')
          .eq('role', 'doctor')
          .eq('status', 'pending')
          .order('created_at', { ascending: true });

        if (error) throw new Error(error.message);
        const mapped = (data ?? []).map((d: any) => ({
          id: d.id,
          name: d.name,
          email: d.email,
          licenseNumber: d.license_number ?? undefined,
          specialty: d.specialty ?? undefined,
          status: d.status,
        }));
        setDoctors(mapped as PendingDoctor[]);
      }
    } catch (err: any) {
      setError(err.message ?? "Failed to load doctors");
    } finally {
      setIsLoading(false);
    }
  };

  const updateDoctor = async (id: string, action: "approve" | "reject") => {
    try {
      const endpoint = action === 'approve' ? `/api/admin/doctors/${id}/approve` : `/api/admin/doctors/${id}/reject`;
      try {
        // Preferred: call server API to perform the action securely
        await authFetch(endpoint, { method: 'POST' });
      } catch (e: any) {
        // If server API is not reachable (static host), fallback to direct Supabase update.
        // This requires a strict RLS policy allowing only admins to update `profiles.status`.
        console.warn('Admin API unavailable, falling back to Supabase client update:', e?.message ?? e);
        const status = action === 'approve' ? 'approved' : 'rejected';
        const { error } = await supabase.from('profiles').update({ status }).eq('id', id);
        if (error) throw new Error(error.message);
      }
      await loadPending();
    } catch (err: any) {
      setError(err.message ?? "Failed to update doctor");
    }
  };

  useEffect(() => {
    void loadPending();
  }, []);

  return (
    <WebLayout title="Admin Dashboard">
      <div className="p-6 space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pending doctors</h1>
          <p className="text-slate-500">Approve or reject new doctor accounts.</p>
        </div>

        <Card className="p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : doctors.length === 0 ? (
            <p className="text-sm text-slate-500">No pending doctors.</p>
          ) : (
            <div className="space-y-3">
              {doctors.map((doctor) => (
                <div key={doctor.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900">{doctor.name}</p>
                    <p className="text-sm text-slate-500">{doctor.email}</p>
                    <div className="text-xs text-slate-500 space-x-2">
                      {doctor.licenseNumber && <span>License: {doctor.licenseNumber}</span>}
                      {doctor.specialty && <span>Specialty: {doctor.specialty}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className={cn("gap-2", "bg-emerald-50 text-emerald-700 hover:bg-emerald-100")}
                      onClick={() => updateDoctor(doctor.id, "approve")}
                    >
                      <ShieldCheck className="h-4 w-4" /> Approve
                    </Button>
                    <Button
                      variant="ghost"
                      className="gap-2 text-red-600 hover:bg-red-50"
                      onClick={() => updateDoctor(doctor.id, "reject")}
                    >
                      <ShieldX className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </WebLayout>
  );
}
