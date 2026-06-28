import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { Shield, Zap, Database, Stethoscope, UserRound, HelpCircle, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { AeyeLogo } from "@/components/AeyeLogo";
import { PasswordRequirements } from "@/components/PasswordRequirements";
import { isPasswordValid } from "@/lib/passwordPolicy";

export default function LandingPage() {
  const { signInWithPassword, signUpWithPassword, resendVerificationEmail, isLoading, lastError } = useAuth();
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
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setResendError(null);

    try {
      if (mode === "signin") {
        await signInWithPassword(formState.email, formState.password);
        setNeedsVerification(false);
      } else {
        const result = await signUpWithPassword({
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

        if (result.requiresEmailConfirmation) {
          setMode("signin");
          setNeedsVerification(true);
          setFeedback(
            role === "doctor"
              ? "Check your email to confirm your account. After confirming, sign in to finish setup and wait for admin approval."
              : "Check your email to confirm your account, then sign in to finish setup.",
          );
        } else {
          setNeedsVerification(false);
          setFeedback(role === "doctor" ? "Doctor account created. Await admin approval." : "Account created. You are signed in.");
        }
      }
    } catch (error: any) {
      console.error("Authentication error", error);
      const code = error?.code ?? "";
      const message = (error?.message ?? "").toLowerCase();
      if (
        code === "email_not_confirmed" ||
        message.includes("not confirmed") ||
        message.includes("confirm your email")
      ) {
        setNeedsVerification(true);
      }
    }
  };

  const handleResend = async () => {
    setFeedback(null);
    setResendError(null);
    setResending(true);
    try {
      await resendVerificationEmail(formState.email);
      setFeedback("Verification email sent. Check your inbox (and spam folder).");
    } catch (error: any) {
      setResendError(error?.message ?? "Could not resend verification email.");
    } finally {
      setResending(false);
    }
  };

  const isSubmitDisabled =
    !formState.email ||
    !formState.password ||
    (mode === "signup" &&
      (!formState.name ||
        !isPasswordValid(formState.password) ||
        (role === "doctor" && (!formState.licenseNumber || !formState.specialty))));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between mx-auto px-6">
          <div className="flex items-center gap-3">
            <AeyeLogo className="h-10 w-auto" />
            <span className="sr-only">AEYE</span>
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
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left Side - Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Shield className="w-4 h-4" />
                AI-Powered Detection
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight">
                Diabetic Retinopathy,
                <span className="text-primary block mt-2">Detected in Seconds</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl">
                Upload fundus images and receive AI-driven severity grading, confidence scores, and explainable heatmaps — fast and secure.
              </p>

              <div className="flex items-center gap-3 mt-6">
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
                  Get Started
                </Button>
                <Link href="/faq">
                  <Button variant="outline" size="lg">Learn more</Button>
                </Link>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Zap, title: "< 45 Seconds", desc: "Fast analysis" },
                { icon: Shield, title: "Secure", desc: "HIPAA compliant" },
                { icon: Database, title: "Cloud Storage", desc: "Access anywhere" },
                { icon: CheckCircle, title: "95%+ Accuracy", desc: "Reliable AI" },
              ].map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.title} className="p-4 border-0 bg-white/60 dark:bg-slate-800/60">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                        <p className="text-sm text-slate-600">{feature.desc}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <Card id="auth" className="p-8 border-0 shadow-2xl bg-white dark:bg-slate-900 md:translate-y-6 md:rounded-2xl">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  ACCESS
                </h2>
                <p className="text-sm text-slate-600">Sign in or create account</p>
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
                          <Label>Account Type</Label>
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
                          <Label>Full Name</Label>
                          <Input
                            value={formState.name}
                            onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                            placeholder="Your name"
                          />
                        </div>

                        {role === "patient" && (
                          <>
                            <div className="space-y-2">
                              <Label>Phone</Label>
                              <Input
                                type="tel"
                                value={formState.phone}
                                onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                                placeholder="+1 555 555 5555"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label>Date of birth</Label>
                                <Input
                                  type="date"
                                  value={formState.dateOfBirth}
                                  onChange={(e) => setFormState({ ...formState, dateOfBirth: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Gender</Label>
                                <Input
                                  value={formState.gender}
                                  onChange={(e) => setFormState({ ...formState, gender: e.target.value })}
                                  placeholder="Male / Female / Other"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Address</Label>
                              <Input
                                value={formState.address}
                                onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                                placeholder="Street, City, Country"
                              />
                            </div>
                          </>
                        )}

                        {role === "doctor" && (
                          <>
                            <div className="space-y-2">
                              <Label>License Number</Label>
                              <Input
                                value={formState.licenseNumber}
                                onChange={(e) => setFormState({ ...formState, licenseNumber: e.target.value })}
                                placeholder="MD-123456"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Specialty</Label>
                              <Input
                                value={formState.specialty}
                                onChange={(e) => setFormState({ ...formState, specialty: e.target.value })}
                                placeholder="Ophthalmology"
                              />
                            </div>
                          </>
                        )}
                      </>
                    )}

                    <div className="space-y-2">
                      <Label>Email address</Label>
                      <Input
                        type="email"
                        value={formState.email}
                        onChange={(e) => {
                          setFormState({ ...formState, email: e.target.value });
                          setNeedsVerification(false);
                          setResendError(null);
                        }}
                        placeholder="you@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Password</Label>
                        {mode === "signin" && (
                          <Link href="/forgot-password">
                            <span className="text-xs text-primary hover:underline cursor-pointer">
                              Forgot password?
                            </span>
                          </Link>
                        )}
                      </div>
                      <Input
                        type="password"
                        value={formState.password}
                        onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                        placeholder="••••••••"
                      />
                      {mode === "signup" && formState.password.length > 0 && (
                        <PasswordRequirements password={formState.password} className="pt-1" />
                      )}
                    </div>

                    {lastError && <p className="text-sm text-red-600">{lastError}</p>}
                    {feedback && <p className="text-sm text-green-600">{feedback}</p>}

                    {mode === "signin" && needsVerification && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
                        <p className="text-amber-800 dark:text-amber-300">
                          Your email address hasn&apos;t been verified yet.
                        </p>
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={resending || !formState.email}
                          className="mt-1 font-medium text-primary hover:underline disabled:opacity-50"
                        >
                          {resending ? "Sending…" : "Resend verification email"}
                        </button>
                        {resendError && <p className="mt-1 text-red-600">{resendError}</p>}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full gap-2"
                      size="lg"
                      disabled={isSubmitDisabled || isLoading}
                    >
                      {isLoading ? "Loading..." : mode === "signin" ? "Sign in" : "Create account"}
                      <ArrowRight className="w-4 h-4" />
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
        </div>
      </div>
    </div>
  );
}
