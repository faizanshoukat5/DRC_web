import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AeyeLogo } from "@/components/AeyeLogo";
import { useAuth } from "@/hooks/useAuth";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
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
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Mail className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Check your inbox</h2>
              <p className="text-sm text-slate-600">
                We sent a reset link to <strong>{email}</strong>. Click the link in the email to set a new password.
              </p>
              <p className="text-xs text-slate-400">Didn't get it? Check your spam folder.</p>
              <Link href="/">
                <Button variant="outline" className="w-full mt-2">Back to sign in</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Reset password</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email address</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={!email || loading}
                >
                  {loading ? "Sending..." : "Send reset link"}
                </Button>
              </form>

              <Link href="/">
                <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-primary">
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
