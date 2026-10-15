import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { Input, Select, Spinner, Textarea } from "./ui";
import { post } from "../services/api";
import { errMsg, fieldErrors } from "../utils/format";
import { useToast } from "../context/ToastContext";

const EMPTY = { name: "", company: "", email: "", phone: "", estimated_budget: "", campaign_type: "view", promote: "", message: "" };

/** Saved to the brand_inquiries table; admins work it through New → Contacted → Negotiating → Converted. */
export default function InquiryForm({ presetPromote = "", compact }) {
  const [f, setF] = useState({ ...EMPTY, promote: presetPromote });
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const toast = useToast();
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErrs({});
    try {
      await post("/inquiries/", { ...f, estimated_budget: f.estimated_budget || null });
      setDone(true);
    } catch (err) { setErrs(fieldErrors(err)); toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  if (done) return (
    <div className="card rise p-8 text-center"><CheckCircle2 className="mx-auto text-flag-green" size={40} />
      <h3 className="mt-3 text-xl font-bold">Thanks, we've got it.</h3><p className="mt-1 text-sm text-mute">Our team will contact you at {f.email} within one working day.</p></div>
  );
  return (
    <form onSubmit={submit} className="card space-y-4 p-5 sm:p-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Your name" value={f.name} onChange={set("name")} error={errs.name} required />
        <Input label="Company" value={f.company} onChange={set("company")} error={errs.company} required />
        <Input label="Email" type="email" value={f.email} onChange={set("email")} error={errs.email} required />
        <Input label="Phone" value={f.phone} onChange={set("phone")} error={errs.phone} />
        <Input label="Estimated budget (NPR)" type="number" min="0" value={f.estimated_budget} onChange={set("estimated_budget")} error={errs.estimated_budget} />
        <Select label="Campaign type" value={f.campaign_type} onChange={set("campaign_type")} options={[{ value: "view", label: "View-based (pay per 1,000 views)" }, { value: "fixed", label: "Fixed (pay per approved clip)" }, { value: "hybrid", label: "Hybrid" }, { value: "", label: "Not sure yet" }]} />
      </div>
      <Textarea label="What do you want to promote?" value={f.promote} onChange={set("promote")} error={errs.promote} required />
      {!compact && <Textarea label="Message" value={f.message} onChange={set("message")} error={errs.message} />}
      <button className="btn btn-primary w-full sm:w-auto" disabled={busy}>{busy ? <Spinner size={16} /> : <Send size={16} />}Send to our team</button>
    </form>
  );
}
