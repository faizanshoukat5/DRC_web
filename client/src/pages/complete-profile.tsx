import { FormEvent, useEffect, useState } from "react";
import { UserRound, Stethoscope, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AeyeLogo } from "@/components/AeyeLogo";
import { useAuth } from "@/hooks/useAuth";

// Shown after a Google (OAuth) sign-in when the account has no app profile yet.
// Google doesn't tell us whether the user is a patient or a doctor, so we
// collect the role and the required fields here, then create the profile.
export default function CompleteProfilePage() {
  const { pendingProfile, completeProfile, signOut, lastError } = useAuth();
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    licenseNumber: "",
    specialty: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Prefill the name from the Google profile once it's available.
  useEffect(() => {
    if (pendingProfile?.name) {
      setForm((prev) => (prev.name ? prev : { ...prev, name: pendingProfile.name }));
    }
  }, [pendingProfile?.name]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await completeProfile({
        email: pendingProfile?.email,
        name: form.name,
        role,
        phone: form.phone || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        address: form.address || undefined,
        licenseNumber: role === "doctor" ? form.licenseNumber || undefined : undefined,
        specialty: role === "doctor" ? form.specialty || undefined : undefined,
      });
      // On success the auth state updates and the router moves to the dashboard.
    } catch (err: any) {
      setError(err.message ?? "Could not save your profile.");
    } finally {
      setLoading(false);
    }
  };

  const disabled =
    loading || !form.name || (role === "doctor" && (!form.licenseNumber || !form.specialty));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <AeyeLogo className="h-10 w-auto" />
        </div>

        <Card className="p-8 border-0 shadow-2xl bg-white">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900">Complete your profile</h2>
              <p className="text-sm text-slate-600 mt-1">
                {pendingProfile?.email
                  ? `Signed in as ${pendingProfile.email}. Tell us a bit more to finish setup.`
                  : "Tell us a bit more to finish setting up your account."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Account type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={role === "patient" ? "default" : "outline"}
                    className="h-16 flex-col gap-1"
                    onClick={() => setRole("patient")}
                  >
                    <UserRound className="w-5 h-5" />
                    <span>Patient</span>
                  </Button>
                  <Button
                    type="button"
                    variant={role === "doctor" ? "default" : "outline"}
                    className="h-16 flex-col gap-1"
                    onClick={() => setRole("doctor")}
                  >
                    <Stethoscope className="w-5 h-5" />
                    <span>Doctor</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Full name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>

              {role === "patient" && (
                <>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+1 555 555 5555"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Date of birth</Label>
                      <Input
                        type="date"
                        value={form.dateOfBirth}
                        onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Input
                        value={form.gender}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                        placeholder="Male / Female / Other"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Street, City, Country"
                    />
                  </div>
                </>
              )}

              {role === "doctor" && (
                <>
                  <div className="space-y-2">
                    <Label>License number</Label>
                    <Input
                      value={form.licenseNumber}
                      onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                      placeholder="MD-123456"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Specialty</Label>
                    <Input
                      value={form.specialty}
                      onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                      placeholder="Ophthalmology"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Doctor accounts require admin approval before accessing diagnostics.
                  </p>
                </>
              )}

              {(error || lastError) && <p className="text-sm text-red-600">{error || lastError}</p>}

              <Button type="submit" className="w-full gap-2" size="lg" disabled={disabled}>
                {loading ? "Saving…" : "Finish setup"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <button
              type="button"
              onClick={signOut}
              className="w-full text-center text-sm text-slate-500 hover:text-primary"
            >
              Cancel and sign out
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
