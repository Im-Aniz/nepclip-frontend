import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Input, Spinner, Logo } from "../../components/ui";
import { homeFor, useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { errMsg } from "../../utils/format";

const GOOGLE_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="mx-auto grid min-h-[80vh] max-w-md place-items-center px-4 py-10">
      <div className="w-full"><div className="mb-6 text-center"><Logo /><h1 className="mt-5 text-3xl font-extrabold">{title}</h1><p className="mt-1 text-sm text-mute">{subtitle}</p></div>
        <div className="card p-5 sm:p-6">{children}</div></div>
    </div>
  );
}

function GoogleButton({ onCredential }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!GOOGLE_ID) return;
    const init = () => { window.google?.accounts.id.initialize({ client_id: GOOGLE_ID, callback: (r) => onCredential(r.credential) }); window.google?.accounts.id.renderButton(ref.current, { theme: "outline", size: "large", width: 320 }); };
    if (window.google) return init();
    const s = document.createElement("script"); s.src = "https://accounts.google.com/gsi/client"; s.async = true; s.onload = init; document.head.appendChild(s);
  }, [onCredential]);
  if (!GOOGLE_ID) return null;
  return <><div className="my-4 flex items-center gap-3 text-xs text-mute"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div><div ref={ref} className="flex justify-center" /></>;
}

export default function Login() {
  const { login, google } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const toast = useToast();
  const [f, setF] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const done = (u) => nav(loc.state?.from || homeFor(u.role), { replace: true });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { done(await login(f.email.trim(), f.password)); } catch (x) { setErr(errMsg(x, "Incorrect email or password.")); } finally { setBusy(false); }
  };
  return (
    <AuthShell title="Welcome back" subtitle="Log in to your NepClip account">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {err && <p role="alert" className="rounded-xl bg-brand-soft px-3 py-2 text-sm text-brand">{err}</p>}
        <Input label="Email" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
        <Input label="Password" type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
        <div className="text-right"><Link to="/forgot-password" className="text-sm font-semibold text-brand">Forgot password?</Link></div>
        <button className="btn btn-primary w-full" disabled={busy || !f.email || !f.password}>{busy && <Spinner size={16} />}Log in</button>
      </form>
      <GoogleButton onCredential={async (c) => { try { done(await google(c)); } catch (x) { toast.error(errMsg(x)); } }} />
      <p className="mt-5 text-center text-sm text-mute">New to NepClip? <Link to="/register" className="font-semibold text-brand">Create an account</Link></p>
    </AuthShell>
  );
}
