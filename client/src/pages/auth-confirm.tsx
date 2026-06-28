import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, MailCheck, AlertCircle } from "lucide-react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AeyeLogo } from "@/components/AeyeLogo";
import { supabase } from "@/lib/supabaseClient";

type Status = "verifying" | "success" | "error";

// Handles email confirmation links that use {{ .TokenHash }} (scanner-proof:
// the one-time token is only consumed when verifyOtp runs in the browser, so
// email link pre-fetchers like Gmail can't burn it). On success the user has a
// session and we send them to "/", which routes to their dashboard.
export default function AuthConfirmPage() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      const query = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

      if (
        query.get("error_code") ||
        hashParams.get("error_code") ||
        hashParams.get("error_description")
      ) {
        if (active) {
          setStatus("error");
          setMessage("This confirmation link has expired or has already been used.");
        }
        return;
      }

      const tokenHash = query.get("token_hash") ?? hashParams.get("token_hash");
      const type = (query.get("type") ?? hashParams.get("type") ?? "signup") as EmailOtpType;

      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
        if (!active) return;
        if (error) {
          setStatus("error");
          setMessage(error.message || "We couldn't confirm your email.");
          return;
        }
        setStatus("success");
        setTimeout(() => navigate("/"), 1500);
        return;
      }

      // Fallback: an implicit-flow token in the fragment was already turned into
      // a session by supabase-js during initialization.
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        setStatus("success");
        setTimeout(() => navigate("/"), 1500);
      } else {
        setStatus("error");
        setMessage("This confirmation link is missing its token or has already been used.");
      }
    })();

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <AeyeLogo className="h-10 w-auto" />
        </div>

        <Card className="p-8 border-0 shadow-2xl bg-white text-center space-y-3">
          {status === "verifying" && (
            <>
              <Loader2 className="w-7 h-7 text-primary animate-spin mx-auto" />
              <p className="text-sm text-slate-600">Confirming your email…</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <MailCheck className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Email confirmed</h2>
              <p className="text-sm text-slate-600">Taking you to your dashboard…</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Confirmation failed</h2>
              <p className="text-sm text-slate-600">{message ?? "This link is invalid or has expired."}</p>
              <Button className="w-full" size="lg" onClick={() => navigate("/")}>
                Back to sign in
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
