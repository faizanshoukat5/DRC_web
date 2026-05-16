import { FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AeyeLogo } from "@/components/AeyeLogo";
import { useAuth } from "@/hooks/useAuth";

export default function ResetPasswordPage() {
  const { isPasswordRecovery, updatePassword } = useAuth();
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // If not in recovery mode after a short grace period, redirect home
  useEffect(() => {
    if (isPasswordRecovery || done) return;
    const t = setTimeout(() => navigate("/"), 3000);
    return () => clearTimeout(t);
  }, [isPasswordRecovery, done, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => navigate("/"), 2000);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <AeyeLogo className="h-10 w-auto" />
        </div>

        <Card className="p-8 border-0 shadow-2xl bg-white">
          {done ? (
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <KeyRound className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Password updated</h2>
              <p className="text-sm text-slate-600">Redirecting you to sign in…</p>
            </div>
          ) : !isPasswordRecovery ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-slate-600">
                This link has expired or is invalid. Redirecting…
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Set new password</h2>
                <p className="text-sm text-slate-600 mt-1">Choose a strong password of at least 8 characters.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>New password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={8}
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label>Confirm password</Label>
                  <Input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    minLength={8}
                    required
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={!password || !confirm || loading}
                >
                  {loading ? "Updating…" : "Update password"}
                </Button>
              </form>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
