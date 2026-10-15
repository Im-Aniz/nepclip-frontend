import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { Input, Spinner } from "../../components/ui";
import { post } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { errMsg } from "../../utils/format";
import { AuthShell } from "./Login";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const toast = useToast();
  const go = async (e) => { e.preventDefault(); setBusy(true); try { await post("/auth/forgot-password/", { email }); setSent(true); } catch (x) { toast.error(errMsg(x)); } finally { setBusy(false); } };
  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a reset link">
      {sent ? <div className="py-4 text-center"><MailCheck className="mx-auto text-flag-green" size={36} /><p className="mt-3 font-semibold">Check your inbox</p><p className="text-sm text-mute">If an account exists for {email}, a reset link is on its way.</p></div> : (
        <form onSubmit={go} className="space-y-4"><Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button className="btn btn-primary w-full" disabled={busy || !email}>{busy && <Spinner size={16} />}Send reset link</button></form>)}
      <p className="mt-5 text-center text-sm"><Link to="/login" className="font-semibold text-brand">Back to log in</Link></p>
    </AuthShell>
  );
}

export function ResetPassword() {
  const [qs] = useSearchParams();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const toast = useToast();
  const go = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await post("/auth/reset-password/", { uid: qs.get("uid"), token: qs.get("token"), password: pw }); toast.success("Password updated. Please log in."); nav("/login"); }
    catch (x) { toast.error(errMsg(x, "This reset link is invalid or has expired.")); } finally { setBusy(false); }
  };
  return (
    <AuthShell title="Choose a new password" subtitle="Use at least 8 characters">
      <form onSubmit={go} className="space-y-4"><Input label="New password" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        <button className="btn btn-primary w-full" disabled={busy || pw.length < 8}>{busy && <Spinner size={16} />}Update password</button></form>
    </AuthShell>
  );
}
