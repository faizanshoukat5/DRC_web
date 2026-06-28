import { FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AeyeLogo } from "@/components/AeyeLogo";
import { PasswordRequirements } from "@/components/PasswordRequirements";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { isPasswordValid, validatePassword } from "@/lib/passwordPolicy";

type LinkStatus = "checking" | "ready" | "invalid";

// verifyOtp consumes the one-time token. A successful verify fires
// PASSWORD_RECOVERY, which flips the router to a different branch and remounts
// this page — without this module-level guard the fresh mount would call
// verifyOtp again with the now-spent token and wrongly report "invalid".
const consumedTokens = new Set<string>();

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<LinkStatus>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Validate the recovery link. supabase-js (implicit flow + detectSessionInUrl)
  // processes the token from the URL fragment during initialization and then
  // strips it from the URL, so we must not rely solely on catching the one-time
  // PASSWORD_RECOVERY event (it can fire before this listener subscribes).
  // Instead we await getSession(), which resolves only after that processing
  // completes, and also listen for the event as a belt-and-suspenders.
  useEffect(() => {
    let active = true;
    const settle = (next: LinkStatus) => {
      if (active) setStatus(next);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) settle("ready");
    });

    (async () => {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const queryParams = new URLSearchParams(window.location.search);

      // Supabase redirects expired/consumed links back with an explicit error.
      if (
        hashParams.get("error_code") ||
        hashParams.get("error_description") ||
        queryParams.get("error_code")
      ) {
        settle("invalid");
        return;
      }

      // If a recovery session already exists (e.g. a prior mount of this page
      // already verified the token, or implicit flow processed the fragment),
      // use it directly instead of re-verifying a now-spent token.
      const { data: existing } = await supabase.auth.getSession();
      if (existing.session) {
        settle("ready");
        return;
      }

      // Preferred flow: a token_hash in the query string (email template uses
      // {{ .TokenHash }} instead of {{ .ConfirmationURL }}). This survives email
      // link scanners (e.g. Gmail) that pre-fetch links, because the one-time
      // token is only consumed when verifyOtp runs in the browser — scanners
      // don't execute JS. Also works across devices.
      const tokenHash = queryParams.get("token_hash") ?? hashParams.get("token_hash");
      if (tokenHash) {
        if (consumedTokens.has(tokenHash)) {
          // Already verified by an earlier mount; wait for the session to settle.
          const { data } = await supabase.auth.getSession();
          settle(data.session ? "ready" : "invalid");
          return;
        }
        consumedTokens.add(tokenHash);
        const { error: verifyError } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash: tokenHash,
        });
        if (!verifyError) {
          // Strip the spent token so a remount can't try to reuse it.
          window.history.replaceState({}, "", window.location.pathname);
        }
        settle(verifyError ? "invalid" : "ready");
        return;
      }

      // PKCE fallback: if a one-time code is present, exchange it for a session.
      const code = queryParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        settle(exchangeError ? "invalid" : "ready");
        return;
      }

      // Implicit flow fallback: the token in the URL fragment has already been
      // turned into a session by the time getSession() resolves.
      const { data } = await supabase.auth.getSession();
      settle(data.session ? "ready" : "invalid");
    })();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
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
          ) : status === "checking" ? (
            <div className="text-center space-y-3 py-4">
              <Loader2 className="w-7 h-7 text-primary animate-spin mx-auto" />
              <p className="text-sm text-slate-600">Validating your reset link…</p>
            </div>
          ) : status === "invalid" ? (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Link expired or invalid</h2>
              <p className="text-sm text-slate-600">
                This password reset link is no longer valid. Reset links expire after a
                short time and can only be used once. Please request a new one.
              </p>
              <Button className="w-full" size="lg" onClick={() => navigate("/forgot-password")}>
                Request a new link
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
                Back to sign in
              </Button>
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
                  {password.length > 0 && <PasswordRequirements password={password} className="pt-1" />}
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
                  disabled={!isPasswordValid(password) || !confirm || loading}
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
