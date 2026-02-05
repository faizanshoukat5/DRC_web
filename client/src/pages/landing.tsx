import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { ScanEye, Shield, Zap, Database, Stethoscope, UserRound, HelpCircle, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

export default function LandingPage() {
  const { signInWithPassword, signUpWithPassword, isLoading, lastError } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<"patient" | "doctor">("patient");

  const [formState, setFormState] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    licenseNumber: "",
    specialty: "",
  });
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    try {
      if (mode === "signin") {
        await signInWithPassword(formState.email, formState.password);
      } else {
        await signUpWithPassword({
          email: formState.email,
          password: formState.password,
          role,
          name: formState.name,
          phone: formState.phone || undefined,
          dateOfBirth: formState.dateOfBirth || undefined,
          gender: formState.gender || undefined,
          address: formState.address || undefined,
          licenseNumber: role === "doctor" ? formState.licenseNumber : undefined,
          specialty: role === "doctor" ? formState.specialty : undefined,
        });
        setFeedback(role === "doctor" ? "Doctor account created. Await admin approval." : "Account created. You are signed in.");
      }
    } catch (error) {
      console.error("Authentication error", error);
    }
  };

  const isSubmitDisabled =
    !formState.email ||
    !formState.password ||
    (mode === "signup" && (!formState.name || (role === "doctor" && (!formState.licenseNumber || !formState.specialty))));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between mx-auto px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <ScanEye className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              RetinaAI
            </h1>
          </div>
          <Link href="/faq">
            <Button variant="ghost" className="gap-2">
              <HelpCircle className="w-4 h-4" />
              Help & FAQ
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start max-w-7xl mx-auto">
          {/* Left — Big visual hero */}
          <section className="space-y-8">
            <div className="rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 p-8 shadow-2xl">
              <div className="flex flex-col lg:flex-row items-start gap-8">
                <div className="flex-1">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <Shield className="w-4 h-4" />
                    AI-Powered Detection
                  </span>

                  <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight">
                    RetinaAI — Fast, Explainable DR Screening
                  </h1>

                  <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
                    Automated diabetic retinopathy grading with clinically-actionable heatmaps, confidence scoring and secure storage — built for real workflows.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button
                      size="lg"
                      className="shadow-lg"
                      onClick={() => {
                        setMode("signup");
                        setRole("patient");
                        const el = document.getElementById("auth");
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                    >
                      Get started — Free
                    </Button>
                    <Link href="/faq">
                      <Button variant="outline" size="lg">How it works</Button>
                    </Link>
                  </div>
                </div>

                <div className="hidden lg:flex lg:items-center lg:justify-center lg:flex-1">
                  <div className="w-[380px] h-[240px] rounded-2xl bg-gradient-to-tr from-primary/20 to-primary/5 p-4 flex items-center justify-center">
                    <img src="/assets/retina-mock.png" alt="Retina preview" className="rounded-lg shadow-lg object-cover w-full h-full" />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[{ icon: Zap, title: "<45s", desc: "Fast inference" }, { icon: CheckCircle, title: "Explainable", desc: "Heatmaps & confidence" }, { icon: Database, title: "Secure", desc: "Encrypted storage" }, { icon: Shield, title: "Compliant", desc: "Privacy-first" }].map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.title} className="flex items-start gap-3 p-4 bg-white/70 dark:bg-slate-800/60 rounded-lg">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{f.title}</div>
                        <div className="text-sm text-slate-600">{f.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Demo + Testimonials */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 shadow">
                <h3 className="font-semibold">Live demo</h3>
                <p className="mt-2 text-sm text-slate-600">Upload a sample fundus image to see AI grading and heatmap overlays.</p>
                <div className="mt-4 h-40 bg-gradient-to-br from-slate-100 to-white rounded-lg flex items-center justify-center text-slate-400">Demo area</div>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-r from-white to-white/60 dark:from-slate-900 dark:to-slate-800 shadow">
                <h3 className="font-semibold">Trusted by clinicians</h3>
                <p className="mt-2 text-sm text-slate-600">"RetinaAI shortened our screening time and improved detection consistency." — Dr. Samir Ali</p>
              </div>
            </div>
          </section>

          {/* Right — Authentication / CTA card */}
          <aside className="sticky top-24">
            <Card id="auth" className="p-8 border-0 shadow-2xl bg-white dark:bg-slate-900 rounded-2xl">
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Get access</h2>
                  <p className="text-sm text-slate-600">Create an account or sign in</p>
                </div>

                <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign in</TabsTrigger>
                    <TabsTrigger value="signup">Sign up</TabsTrigger>
                  </TabsList>

                  <TabsContent value={mode} className="mt-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {mode === "signup" && (
                        <>
                          <div className="space-y-2">
                            <Label>Account</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <Button type="button" variant={role === "patient" ? "default" : "outline"} onClick={() => setRole("patient")}>Patient</Button>
                              <Button type="button" variant={role === "doctor" ? "default" : "outline"} onClick={() => setRole("doctor")}>Doctor</Button>
                            </div>
                          </div>

                          <Input value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} placeholder="Full name" />
                          {role === "patient" && (
                            <>
                              <Input type="tel" value={formState.phone} onChange={(e) => setFormState({ ...formState, phone: e.target.value })} placeholder="Phone" />
                              <Input type="date" value={formState.dateOfBirth} onChange={(e) => setFormState({ ...formState, dateOfBirth: e.target.value })} />
                            </>
                          )}

                          {role === "doctor" && (
                            <>
                              <Input value={formState.licenseNumber} onChange={(e) => setFormState({ ...formState, licenseNumber: e.target.value })} placeholder="License #" />
                              <Input value={formState.specialty} onChange={(e) => setFormState({ ...formState, specialty: e.target.value })} placeholder="Specialty" />
                            </>
                          )}
                        </>
                      )}

                      <Input type="email" value={formState.email} onChange={(e) => setFormState({ ...formState, email: e.target.value })} placeholder="Email" />
                      <Input type="password" value={formState.password} onChange={(e) => setFormState({ ...formState, password: e.target.value })} placeholder="Password" />

                      {lastError && <p className="text-sm text-red-600">{lastError}</p>}
                      {feedback && <p className="text-sm text-green-600">{feedback}</p>}

                      <Button type="submit" size="lg" className="w-full" disabled={isSubmitDisabled || isLoading}>
                        {isLoading ? "Loading..." : mode === "signin" ? "Sign in" : "Create account"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <div className="text-center">
                  <Link href="/faq">
                    <span className="text-sm text-slate-600 hover:text-primary inline-flex items-center gap-1 cursor-pointer">
                      <HelpCircle className="w-4 h-4" />
                      Have questions? Check our FAQ
                    </span>
                  </Link>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
