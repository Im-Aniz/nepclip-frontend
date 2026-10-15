import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Building2, Clapperboard } from "lucide-react";
import { Input, Spinner, Textarea } from "../../components/ui";
import { homeFor, useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { errMsg, fieldErrors } from "../../utils/format";
import { AuthShell } from "./Login";

export default function Register() {
  const { code } = useParams();
  const [qs] = useSearchParams();
  const [kind, setKind] = useState(qs.get("role") === "brand" ? "brand" : "creator");
  const [f, setF] = useState({ full_name: "", username: "", email: "", password: "", phone: "", country: "NP", company_name: "", contact_person: "", website: "", description: "", referral_code: code || qs.get("ref") || "" });
  const [avatar, setAvatar] = useState(null);
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const { register } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErrs({});
    const keys = kind === "creator" ? ["full_name", "username", "email", "password", "phone", "country", "referral_code"] : ["company_name", "contact_person", "username", "email", "password", "phone", "website", "description"];
    const fd = new FormData();
    keys.forEach((k) => f[k] !== "" && fd.append(k, f[k]));
    if (kind === "creator" && avatar) fd.append("avatar", avatar);
    try { const u = await register(kind, fd); toast.success("Welcome to NepClip!"); nav(homeFor(u.role), { replace: true }); }
    catch (x) { setErrs(fieldErrors(x)); toast.error(errMsg(x)); } finally { setBusy(false); }
  };
  const tab = (k, Icon, label) => (
    <button type="button" onClick={() => setKind(k)} className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold ${kind === k ? "bg-surface shadow-sm" : "text-mute"}`}><Icon size={16} />{label}</button>);
  return (
    <AuthShell title="Create your account" subtitle={kind === "creator" ? "Start earning from your clips" : "Launch campaigns and reach new audiences"}>
      <div className="mb-5 flex gap-1 rounded-xl bg-sunk p-1">{tab("creator", Clapperboard, "I'm a creator")}{tab("brand", Building2, "I'm a brand")}</div>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {kind === "creator" ? <Input label="Full name" value={f.full_name} onChange={set("full_name")} error={errs.full_name} required />
          : <><Input label="Company / brand name" value={f.company_name} onChange={set("company_name")} error={errs.company_name} required /><Input label="Contact person" value={f.contact_person} onChange={set("contact_person")} error={errs.contact_person} required /></>}
        <Input label="Username" value={f.username} onChange={set("username")} error={errs.username} hint="Letters, numbers, _ or ." required />
        <Input label="Email" type="email" value={f.email} onChange={set("email")} error={errs.email} required />
        <Input label="Phone" type="tel" value={f.phone} onChange={set("phone")} error={errs.phone} required />
        <Input label="Password" type="password" autoComplete="new-password" value={f.password} onChange={set("password")} error={errs.password} hint="At least 8 characters" required />
        {kind === "creator" ? <>
          <Input label="Country" value={f.country} onChange={(e) => setF({ ...f, country: e.target.value.toUpperCase().slice(0, 2) })} error={errs.country} hint="2-letter code, e.g. NP" />
          <div><label className="label">Profile picture (optional)</label><input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0] || null)} className="input !p-2 text-sm" /></div>
          <Input label="Referral code (optional)" value={f.referral_code} onChange={set("referral_code")} error={errs.referral_code} /></>
          : <><Input label="Company website" type="url" placeholder="https://" value={f.website} onChange={set("website")} error={errs.website} /><Textarea label="Business description" value={f.description} onChange={set("description")} error={errs.description} /></>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy && <Spinner size={16} />}Create account</button>
      </form>
      <p className="mt-5 text-center text-sm text-mute">Already registered? <Link to="/login" className="font-semibold text-brand">Log in</Link></p>
    </AuthShell>
  );
}
