import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Banknote, Eye, Film, Megaphone, Pencil, Plus, Send, Wallet } from "lucide-react";
import { paymentLabel } from "../../components/CampaignCard";
import SupportChat from "../../components/SupportChat";
import { ChartCard, TrendChart } from "../../components/charts";
import { ActionModal, Badge, Check, DataTable, EmptyState, ErrorState, Input, PageHeader, Select, Skeleton, Spinner, StatCard, Tabs, Textarea } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { useToast } from "../../context/ToastContext";
import useFetch from "../../hooks/useFetch";
import api, { patch, post } from "../../services/api";
import { compact, date, errMsg, fieldErrors, money, num, PLATFORM_LABEL } from "../../utils/format";

/* ---------- Dashboard ---------- */
export function Dashboard() {
  const { user } = useAuth();
  const { data: d, loading, error, reload } = useFetch("/brands/dashboard/");
  if (error) return <ErrorState message={error} onRetry={reload} />;
  return (
    <>
      <PageHeader title={`Welcome, ${user?.display_name || "brand"}`} subtitle="Campaign performance and spend at a glance." actions={<Link to="/brand/campaigns/new" className="btn btn-primary"><Plus size={16} />New campaign</Link>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Campaigns" value={d?.campaigns} sub={`${d?.live ?? 0} live · ${d?.in_review ?? 0} in review`} icon={Megaphone} loading={loading} />
        <StatCard label="Total views" value={compact(d?.total_views)} icon={Eye} loading={loading} />
        <StatCard label="Clips submitted" value={d?.submissions} sub={`${d?.pending_review ?? 0} awaiting review`} icon={Film} loading={loading} />
        <StatCard label="Total spent" value={money(d?.spent)} sub={`of ${money(d?.total_budget)} budget`} icon={Wallet} accent loading={loading} />
        <StatCard label="Creator payouts" value={money(d?.creator_payouts)} icon={Banknote} loading={loading} />
        <StatCard label="Platform fee" value={money(d?.platform_fee)} loading={loading} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Views over time" sub="Last 30 days"><TrendChart data={d?.views_series} y="views" /></ChartCard>
        <ChartCard title="Spend over time" sub="Last 30 days"><TrendChart data={d?.spend_series} y="amount" color="#1D5FA8" format={(v) => money(v)} /></ChartCard>
      </div>
    </>
  );
}

/* ---------- Campaign list ---------- */
export function Campaigns() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch("/brands/campaigns/", { page, ...(status && { status }) });
  const cols = [
    { key: "name", label: "Campaign", render: (r) => <Link to={`/brand/campaigns/${r.id}`} className="font-semibold hover:text-brand">{r.name}</Link> },
    { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
    { key: "pay", label: "Payment", render: (r) => paymentLabel(r) },
    { key: "budget", label: "Budget", className: "tabular-nums", render: (r) => <>{money(r.budget)}<p className="text-xs text-mute">{money(r.remaining_budget)} left</p></> },
    { key: "creators_count", label: "Creators", className: "tabular-nums" },
    { key: "end_date", label: "Ends", render: (r) => date(r.end_date) },
    { key: "a", label: "", render: (r) => ["draft", "rejected"].includes(r.status) && <Link to={`/brand/campaigns/${r.id}/edit`} className="btn btn-outline !py-1.5"><Pencil size={14} />Edit</Link> },
  ];
  return (
    <>
      <PageHeader title="My campaigns" actions={<Link to="/brand/campaigns/new" className="btn btn-primary"><Plus size={16} />New campaign</Link>} />
      <div className="mb-4"><Tabs value={status} onChange={(v) => { setStatus(v); setPage(1); }} tabs={[{ value: "", label: "All" }, "draft", "submitted", "published", "rejected", "ended"]} /></div>
      <DataTable columns={cols} rows={data?.results} loading={loading} error={error} onRetry={reload} page={page} count={data?.count || 0} onPage={setPage}
        empty={<EmptyState icon={Megaphone} title="No campaigns yet" text="Build your first campaign. Our team reviews it before it goes live." action={<Link to="/brand/campaigns/new" className="btn btn-primary">Create a campaign</Link>} />} />
    </>
  );
}

/* ---------- Campaign builder ---------- */
const list = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);
const tag = (arr, ch) => arr.map((x) => (ch && !x.startsWith(ch) ? ch + x : x));
const blank = () => {
  const d = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  return { name: "", description: "", objective: "", source_url: "", category: "", campaign_type: "view", platforms: ["youtube"], budget: "", rpm: "", fixed_reward: "", base_reward: "", bonus_threshold_views: "", bonus_amount: "",
    brand: "", platform_fee_percent: "", min_views: 1000, max_eligible_views: "", max_payout_per_post: "", max_payout_per_creator: "", max_submissions_per_creator: 5, auto_approve: false, start_date: d(1), end_date: d(31), submission_deadline: d(24), min_post_lifetime_days: 7,
    min_followers: 1000, max_followers: "", min_engagement: "", account_age_days: "", countries: "NP", require_verified: false,
    min_duration_seconds: 10, max_duration_seconds: "", required_hashtags: "", required_mentions: "", required_sound: "", required_caption: "", requires_logo: false, required_template: "",
    allowed_niches: "", prohibited_niches: "", prohibited_keywords: "", originality_required: true, watermark_rules: "", ai_content_rule: "", aspect_ratio: "9:16" };
};
const fromApi = (c) => ({ ...blank(), ...Object.fromEntries(Object.entries(c).filter(([k]) => k in blank() && c[k] !== null)),
  min_followers: c.rules?.min_followers ?? 0, max_followers: c.rules?.max_followers ?? "", min_engagement: c.rules ? +(Number(c.rules.min_engagement_rate) * 100).toFixed(2) || "" : "", account_age_days: c.rules?.account_age_days || "",
  countries: (c.rules?.countries || []).join(", "), require_verified: !!c.rules?.require_verified, min_duration_seconds: c.rules?.min_duration_seconds ?? 0, max_duration_seconds: c.rules?.max_duration_seconds ?? "",
  required_hashtags: (c.rules?.required_hashtags || []).join(", "), required_mentions: (c.rules?.required_mentions || []).join(", "), required_sound: c.rules?.required_sound || "", required_caption: c.rules?.required_caption || "",
  requires_logo: !!c.rules?.requires_logo, required_template: c.rules?.required_template || "", allowed_niches: (c.rules?.allowed_niches || []).join(", "), prohibited_niches: (c.rules?.prohibited_niches || []).join(", "),
  prohibited_keywords: (c.rules?.prohibited_keywords || []).join(", "), originality_required: c.rules?.originality_required ?? true, watermark_rules: c.rules?.watermark_rules || "", ai_content_rule: c.rules?.ai_content_rule || "", aspect_ratio: c.rules?.aspect_ratio || "",
  platforms: c.platforms || ["youtube"] });
const num0 = (v) => (v === "" || v == null ? null : Number(v));

export function toPayload(f) {
  const body = { name: f.name, description: f.description, objective: f.objective, source_url: f.source_url, category: f.category.toLowerCase(), campaign_type: f.campaign_type, platforms: f.platforms,
    budget: f.budget, rpm: f.campaign_type === "fixed" ? 0 : f.rpm || 0, fixed_reward: f.campaign_type === "fixed" ? f.fixed_reward || 0 : 0, base_reward: f.campaign_type === "hybrid" ? f.base_reward || 0 : 0,
    bonus_threshold_views: f.campaign_type === "hybrid" ? num0(f.bonus_threshold_views) : null, bonus_amount: f.campaign_type === "hybrid" ? f.bonus_amount || 0 : 0,
    min_views: Number(f.min_views) || 0, max_eligible_views: num0(f.max_eligible_views), max_payout_per_post: f.max_payout_per_post || null, max_payout_per_creator: f.max_payout_per_creator || null,
    max_submissions_per_creator: Number(f.max_submissions_per_creator) || 1, auto_approve: f.auto_approve, start_date: f.start_date, end_date: f.end_date, submission_deadline: f.submission_deadline || null, min_post_lifetime_days: Number(f.min_post_lifetime_days) || 0,
    rules: { min_followers: Number(f.min_followers) || 0, max_followers: num0(f.max_followers), min_engagement_rate: f.min_engagement ? Number(f.min_engagement) / 100 : 0, account_age_days: Number(f.account_age_days) || 0,
      countries: list(f.countries).map((c) => c.toUpperCase()), require_verified: f.require_verified, min_duration_seconds: Number(f.min_duration_seconds) || 0, max_duration_seconds: num0(f.max_duration_seconds),
      required_hashtags: tag(list(f.required_hashtags), "#"), required_mentions: tag(list(f.required_mentions), "@"), required_sound: f.required_sound, required_caption: f.required_caption, requires_logo: f.requires_logo, required_template: f.required_template,
      allowed_niches: list(f.allowed_niches).map((s) => s.toLowerCase()), prohibited_niches: list(f.prohibited_niches).map((s) => s.toLowerCase()), prohibited_keywords: list(f.prohibited_keywords), originality_required: f.originality_required,
      watermark_rules: f.watermark_rules, ai_content_rule: f.ai_content_rule, aspect_ratio: f.aspect_ratio } };
  return body;
}
const flatten = (e) => { const o = {}; Object.entries(e || {}).forEach(([k, v]) => { if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(o, flatten(v)); else o[k] = Array.isArray(v) ? v[0] : v; }); return o; };

const Sec = ({ title, sub, children }) => <section className="card p-5"><h2 className="font-display text-lg font-bold">{title}</h2>{sub && <p className="mb-3 text-sm text-mute">{sub}</p>}<div className="mt-3 grid gap-4 sm:grid-cols-2">{children}</div></section>;

export function Builder({ admin = false }) {
  const { id } = useParams();
  const [qs] = useSearchParams();
  const inquiryId = admin ? qs.get("inquiry") : null;
  const nav = useNavigate();
  const toast = useToast();
  const s = useSettings();
  const base = admin ? "/admin/campaigns" : "/brands/campaigns";
  const { data: existing, loading } = useFetch(id ? `${base}/${id}/` : null);
  const { data: brandList } = useFetch(admin ? "/admin/users/" : null, { role: "brand" });
  const { data: inquiry } = useFetch(inquiryId ? `/admin/inquiries/${inquiryId}/` : null);
  const [f, setF] = useState(blank);
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState("");
  const [cover, setCover] = useState(null);
  const [coverUrl, setCoverUrl] = useState("");
  useEffect(() => {
    if (!cover) { setCoverUrl(""); return undefined; }
    const u = URL.createObjectURL(cover);
    setCoverUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [cover]);
  const pickCover = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const max = s.max_upload_mb || 5;
    if (file.size > max * 1024 * 1024) { toast.error(`Image must be under ${max} MB.`); e.target.value = ""; return; }
    setCover(file);
  };
  useEffect(() => { if (existing) setF(fromApi(existing)); }, [existing]);
  useEffect(() => {
    if (inquiry && !id) setF((x) => ({ ...x, name: x.name || `${inquiry.company} campaign`, description: x.description || inquiry.promote, budget: x.budget || inquiry.estimated_budget || "", campaign_type: inquiry.campaign_type || x.campaign_type }));
  }, [inquiry, id]);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const E = (k) => errs[k];
  const fee = Number(f.platform_fee_percent || existing?.effective_fee_percent || s.platform_commission_percent), b = Number(f.budget) || 0;
  const togglePlatform = (p) => setF((x) => ({ ...x, platforms: x.platforms.includes(p) ? x.platforms.filter((q) => q !== p) : [...x.platforms, p] }));

  const save = async (andSubmit) => {
    setBusy(andSubmit ? "submit" : "draft"); setErrs({});
    try {
      const body = toPayload(f);
      if (admin) {
        if (f.brand) body.brand = Number(f.brand);
        if (f.platform_fee_percent !== "") body.platform_fee_percent = f.platform_fee_percent;
        if (inquiryId && !id) body.inquiry_id = Number(inquiryId);
      }
      const { data } = id ? await api.patch(`${base}/${id}/`, body) : await api.post(`${base}/`, body);
      if (cover) {
        try { const fd = new FormData(); fd.append("cover_image", cover); await patch(`${base}/${data.id}/`, fd); }
        catch (x) { toast.error(`Saved, but the banner couldn't be uploaded: ${errMsg(x)}`); }
      }
      if (admin) {
        if (andSubmit && ["draft", "rejected"].includes(data.status || existing?.status || "draft")) await post(`${base}/${data.id}/submit/`);
        if (andSubmit) { await post(`${base}/${data.id}/approve/`, { publish: true }); toast.success("Campaign created and published."); } else toast.success("Draft saved.");
        nav("/admin/campaigns");
      } else {
        if (andSubmit) { await post(`/brands/campaigns/${data.id}/submit-for-review/`); toast.success("Submitted. Our team will review it shortly."); } else toast.success("Draft saved.");
        nav(`/brand/campaigns/${data.id}`);
      }
    } catch (x) { setErrs(flatten(x.response?.data)); toast.error(errMsg(x)); } finally { setBusy(""); }
  };
  if (id && loading) return <Skeleton className="h-96" />;
  return (
    <form onSubmit={(e) => { e.preventDefault(); save(true); }} className="space-y-5">
      <PageHeader title={id ? "Edit campaign" : admin ? "Create campaign for a brand" : "New campaign"} subtitle={admin ? "Created on the brand's behalf. Publishing goes through the normal approval steps and is audited." : "Campaigns go live only after admin approval."} />
      {admin && <Sec title="Brand & commission">
        <Select label="Brand" value={f.brand} onChange={set("brand")} error={E("brand")} placeholder="Select a brand" options={(brandList?.results || []).filter((u) => u.brand_profile_id).map((u) => ({ value: u.brand_profile_id, label: u.display_name }))} hint={inquiry ? `From inquiry: ${inquiry.company} (${inquiry.email}). Create their brand account from the Inquiries page first.` : undefined} />
        <Input label="Platform fee override (%)" type="number" step="0.5" min="0" max="60" value={f.platform_fee_percent} onChange={set("platform_fee_percent")} error={E("platform_fee_percent")} hint={`Blank = platform default (${s.platform_commission_percent}%)`} /></Sec>}
      {existing?.status === "rejected" && <p className="rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand"><b>Rejected:</b> {existing.rejection_reason}. Update the campaign and resubmit.</p>}
      <Sec title="Basics">
        <Input className="sm:col-span-2" label="Campaign name" value={f.name} onChange={set("name")} error={E("name")} required />
        <Textarea className="sm:col-span-2" label="Description" value={f.description} onChange={set("description")} error={E("description")} required />
        <Input label="Objective" value={f.objective} onChange={set("objective")} error={E("objective")} placeholder="e.g. Drive streams of our new single" />
        <Input label="Category / niche" value={f.category} onChange={set("category")} error={E("category")} placeholder="music, gaming, food…" />
        <div className="sm:col-span-2">
          <label className="label">Banner image</label>
          <div className="mt-1 overflow-hidden rounded-xl border border-line bg-sunk">
            {coverUrl || existing?.cover_image
              ? <img src={coverUrl || existing.cover_image} alt="Banner preview" className="h-40 w-full object-cover" />
              : <div className="grid h-40 place-items-center text-sm text-mute">No banner yet</div>}
          </div>
          <input type="file" accept="image/*" onChange={pickCover} className="mt-2 text-sm" aria-label="Banner image" />
          <p className="mt-1 text-xs text-mute">Wide image, about 1200×400. Shown at the top of the campaign page. Max {s.max_upload_mb || 5} MB.</p>
          {E("cover_image") && <p className="text-xs text-brand">{E("cover_image")}</p>}
        </div>
        <Input className="sm:col-span-2" label="Source video / content link" type="url" value={f.source_url} onChange={set("source_url")} error={E("source_url")} placeholder="https://youtube.com/watch?v=…" hint="The long-form content creators will clip. Your logo comes from your business profile." />
      </Sec>
      <Sec title="Platforms"><div className="flex flex-wrap gap-4 sm:col-span-2">{["youtube", "tiktok", "instagram"].map((p) => {
        const on = s.supported_platforms.includes(p);
        return <Check key={p} label={`${PLATFORM_LABEL[p]}${on ? "" : " (coming soon)"}`} checked={f.platforms.includes(p)} disabled={!on} onChange={() => togglePlatform(p)} />; })}</div>
        {E("platforms") && <p className="text-xs text-brand sm:col-span-2">{E("platforms")}</p>}</Sec>
      <Sec title="Payment">
        <Select label="Campaign type" value={f.campaign_type} onChange={set("campaign_type")} options={[{ value: "view", label: "View-based (RPM)" }, { value: "fixed", label: "Fixed per approved clip" }, { value: "hybrid", label: "Hybrid" }]} />
        <Input label="Campaign budget (NPR)" type="number" min="0" value={f.budget} onChange={set("budget")} error={E("budget")} hint={`Minimum ${money(s.min_campaign_budget)}`} required />
        {f.campaign_type !== "fixed" && <Input label="RPM (per 1,000 eligible views)" type="number" min="0" value={f.rpm} onChange={set("rpm")} error={E("rpm")} required />}
        {f.campaign_type === "fixed" && <Input label="Fixed reward per approved clip" type="number" min="0" value={f.fixed_reward} onChange={set("fixed_reward")} error={E("fixed_reward")} required />}
        {f.campaign_type === "hybrid" && <><Input label="Base reward per approved clip" type="number" min="0" value={f.base_reward} onChange={set("base_reward")} error={E("base_reward")} required />
          <Input label="Bonus views threshold" type="number" min="0" value={f.bonus_threshold_views} onChange={set("bonus_threshold_views")} error={E("bonus_threshold_views")} hint="e.g. 100000" /><Input label="Bonus amount" type="number" min="0" value={f.bonus_amount} onChange={set("bonus_amount")} error={E("bonus_amount")} /></>}
        <Input label="Minimum views to earn" type="number" min="0" value={f.min_views} onChange={set("min_views")} error={E("min_views")} />
        <Input label="Max eligible views per post" type="number" min="0" value={f.max_eligible_views} onChange={set("max_eligible_views")} error={E("max_eligible_views")} hint="Optional" />
        <Input label="Max payout per post" type="number" min="0" value={f.max_payout_per_post} onChange={set("max_payout_per_post")} error={E("max_payout_per_post")} />
        <Input label="Max payout per creator" type="number" min="0" value={f.max_payout_per_creator} onChange={set("max_payout_per_creator")} error={E("max_payout_per_creator")} />
        <Input label="Max submissions per creator" type="number" min="1" value={f.max_submissions_per_creator} onChange={set("max_submissions_per_creator")} error={E("max_submissions_per_creator")} />
        <div className="self-end"><Check label="Auto-approve clips that pass all checks" checked={f.auto_approve} onChange={set("auto_approve")} /></div>
        <div className="rounded-xl bg-sunk p-4 text-sm sm:col-span-2"><p className="font-semibold">Budget split ({fee}% platform fee)</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center"><div><p className="text-xs text-mute">Budget</p><b>{money(b)}</b></div><div><p className="text-xs text-mute">Creator payouts</p><b>{money(b * (1 - fee / 100))}</b></div><div><p className="text-xs text-mute">Platform fee</p><b>{money((b * fee) / 100)}</b></div></div></div>
      </Sec>
      <Sec title="Creator requirements" sub="Creators who don't meet these can't join.">
        <Input label="Minimum followers" type="number" min="0" value={f.min_followers} onChange={set("min_followers")} error={E("min_followers")} />
        <Input label="Maximum followers" type="number" min="0" value={f.max_followers} onChange={set("max_followers")} error={E("max_followers")} hint="Optional" />
        <Input label="Minimum engagement (%)" type="number" step="0.1" min="0" value={f.min_engagement} onChange={set("min_engagement")} error={E("min_engagement_rate")} hint="(likes + comments) ÷ views" />
        <Input label="Account age (days)" type="number" min="0" value={f.account_age_days} onChange={set("account_age_days")} error={E("account_age_days")} />
        <Input label="Countries" value={f.countries} onChange={set("countries")} error={E("countries")} hint="Comma separated codes, e.g. NP, IN. Blank = any" />
        <div className="self-end"><Check label="Platform-verified accounts only" checked={f.require_verified} onChange={set("require_verified")} /></div>
        <Input label="Allowed niches" value={f.allowed_niches} onChange={set("allowed_niches")} hint="Comma separated. Blank = any" /><Input label="Prohibited niches" value={f.prohibited_niches} onChange={set("prohibited_niches")} />
      </Sec>
      <Sec title="Content requirements">
        <Input label="Min duration (sec)" type="number" min="0" value={f.min_duration_seconds} onChange={set("min_duration_seconds")} /><Input label="Max duration (sec)" type="number" min="0" value={f.max_duration_seconds} onChange={set("max_duration_seconds")} />
        <Input label="Required hashtags" value={f.required_hashtags} onChange={set("required_hashtags")} hint="Comma separated" /><Input label="Required mentions" value={f.required_mentions} onChange={set("required_mentions")} hint="Comma separated" />
        <Input label="Required sound" value={f.required_sound} onChange={set("required_sound")} /><Input label="Required caption text" value={f.required_caption} onChange={set("required_caption")} />
        <Input label="Template notes" value={f.required_template} onChange={set("required_template")} /><Select label="Aspect ratio" value={f.aspect_ratio} onChange={set("aspect_ratio")} options={[{ value: "", label: "Any" }, "9:16", "1:1", "16:9"]} />
        <Input label="Prohibited keywords / content" value={f.prohibited_keywords} onChange={set("prohibited_keywords")} hint="Comma separated" /><Input label="Watermark rules" value={f.watermark_rules} onChange={set("watermark_rules")} />
        <Input label="AI-content rules" value={f.ai_content_rule} onChange={set("ai_content_rule")} />
        <div className="flex flex-col justify-end gap-2"><Check label="Must show our logo" checked={f.requires_logo} onChange={set("requires_logo")} /><Check label="Original content required" checked={f.originality_required} onChange={set("originality_required")} /></div>
      </Sec>
      <Sec title="Schedule">
        <Input label="Start date" type="date" value={f.start_date} onChange={set("start_date")} error={E("start_date")} required /><Input label="End date" type="date" value={f.end_date} onChange={set("end_date")} error={E("end_date")} required />
        <Input label="Submission deadline" type="date" value={f.submission_deadline} onChange={set("submission_deadline")} error={E("submission_deadline")} /><Input label="Minimum post lifetime (days)" type="number" min="0" value={f.min_post_lifetime_days} onChange={set("min_post_lifetime_days")} />
      </Sec>
      {E("detail") && <p className="text-sm text-brand">{E("detail")}</p>}
      <div className="sticky bottom-0 -mx-4 flex flex-wrap justify-end gap-2 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <button type="button" className="btn btn-outline" disabled={!!busy} onClick={() => save(false)}>{busy === "draft" && <Spinner size={14} />}Save draft</button>
        <button className="btn btn-primary" disabled={!!busy || (admin && !f.brand && !id)}>{busy === "submit" ? <Spinner size={14} /> : <Send size={16} />}{admin ? "Create & publish" : "Save & submit for review"}</button>
      </div>
    </form>
  );
}

/* ---------- Campaign view: analytics + submission review ---------- */
export function CampaignView() {
  const { id } = useParams();
  const toast = useToast();
  const { data: c, loading, error, reload } = useFetch(`/brands/campaigns/${id}/`);
  const { data: a } = useFetch(`/brands/campaigns/${id}/analytics/`);
  const [page, setPage] = useState(1);
  const { data: subs, loading: sl, reload: rs } = useFetch(`/brands/campaigns/${id}/submissions/`, { page });
  const [act, setAct] = useState(null);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !c) return <Skeleton className="h-64" />;
  const submit = async () => { try { await post(`/brands/campaigns/${id}/submit-for-review/`); toast.success("Submitted for review."); reload(); } catch (x) { toast.error(errMsg(x)); } };
  const review = async (reason) => { try { await post(`/brands/submissions/${act.row.id}/review/`, { decision: act.decision, reason }); toast.success(`Clip ${act.decision}.`); setAct(null); rs(); } catch (x) { toast.error(errMsg(x)); } };
  const cols = [{ key: "creator_username", label: "Creator", render: (r) => <b>@{r.creator_username}</b> }, { key: "url", label: "Post", render: (r) => <a className="text-brand" href={r.url} target="_blank" rel="noreferrer">Open</a> },
    { key: "status", label: "Status", render: (r) => <Badge status={r.status}>{r.status_label}</Badge> }, { key: "views", label: "Views", className: "tabular-nums", render: (r) => num(r.views) },
    { key: "reward_total", label: "Paid out", className: "tabular-nums", render: (r) => money(r.reward_total) },
    { key: "a", label: "", render: (r) => ["pending", "under_review"].includes(r.status) && <div className="flex gap-1.5"><button className="btn btn-outline !py-1.5" onClick={() => setAct({ row: r, decision: "approved" })}>Approve</button><button className="btn btn-ghost !py-1.5 text-brand" onClick={() => setAct({ row: r, decision: "rejected" })}>Reject</button></div> }];
  return (
    <>
      <PageHeader title={c.name} subtitle={`${paymentLabel(c)} · ${(c.platforms || []).map((p) => PLATFORM_LABEL[p] || p).join(", ")}`}
        actions={<><Badge status={c.status} />{["draft", "rejected"].includes(c.status) && <><Link to={`/brand/campaigns/${id}/edit`} className="btn btn-outline"><Pencil size={14} />Edit</Link><button className="btn btn-primary" onClick={submit}><Send size={14} />Submit for review</button></>}</>} />
      {c.status === "rejected" && <p className="mb-4 rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand"><b>Rejected:</b> {c.rejection_reason}</p>}
      {c.status === "submitted" && <p className="mb-4 rounded-xl bg-amber-500/15 px-4 py-3 text-sm">In review. We'll notify you when it's approved.</p>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Campaign budget" value={money(a?.budget)} loading={!a} /><StatCard label="Creator payouts" value={money(a?.creator_payouts)} loading={!a} />
        <StatCard label="Platform fee" value={money(a?.platform_fee)} loading={!a} /><StatCard label="Remaining budget" value={money(a?.remaining)} loading={!a} accent />
        <StatCard label="Total views" value={compact(a?.views)} sub={`${compact(a?.eligible_views)} eligible`} loading={!a} /><StatCard label="Clips" value={a?.submissions} loading={!a} /><StatCard label="Creators" value={a?.creators} loading={!a} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2"><ChartCard title="Views" sub="Last 30 days"><TrendChart data={a?.views_series} y="views" /></ChartCard><ChartCard title="Spend" sub="Last 30 days"><TrendChart data={a?.spend_series} y="amount" color="#1D5FA8" format={(v) => money(v)} /></ChartCard></div>
      <h2 className="mb-3 mt-8 text-xl font-bold">Creator submissions</h2>
      <DataTable columns={cols} rows={subs?.results} loading={sl} page={page} count={subs?.count || 0} onPage={setPage} empty={<EmptyState icon={Film} title="No clips yet" text="Submissions will appear here once creators join and post." />} />
      <p className="mt-2 text-xs text-mute">Fraud decisions are handled by NepClip admins. Use Contact Platform to report a concern.</p>
      <ActionModal open={!!act} onClose={() => setAct(null)} title={act?.decision === "approved" ? "Approve this clip?" : "Reject this clip"} needReason={act?.decision === "rejected"} danger={act?.decision === "rejected"} confirmLabel={act?.decision === "approved" ? "Approve" : "Reject"} onConfirm={review} />
    </>
  );
}

/* ---------- Support ---------- */
export function Support() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, loading, reload } = useFetch("/reports/", { page });
  const [f, setF] = useState({ category: "payment", subject: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("chat");
  const send = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await post("/reports/", f); toast.success("Sent. The NepClip team will respond here."); setF({ ...f, subject: "", description: "" }); reload(); } catch (x) { toast.error(errMsg(x)); } finally { setBusy(false); }
  };
  const cols = [{ key: "subject", label: "Subject", render: (r) => <b>{r.subject}</b> }, { key: "category", label: "Type", className: "capitalize" }, { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
    { key: "resolution", label: "Response", render: (r) => r.resolution || "—" }, { key: "created_at", label: "Sent", render: (r) => date(r.created_at) }];
  return (
    <>
      <PageHeader title="Contact the platform" subtitle="Chat with our team (photos welcome), or file a formal report about a creator, a clip or a payment." />
      <div className="mb-4"><Tabs value={tab} onChange={setTab} tabs={[{ value: "chat", label: "Chat with us" }, { value: "report", label: "Report an issue" }]} /></div>
      {tab === "chat" ? <div className="card overflow-hidden"><SupportChat url="/support/chat/" /></div> : <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <form onSubmit={send} className="card h-fit space-y-4 p-5">
          <Select label="Topic" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} options={[{ value: "payment", label: "Payment / billing" }, { value: "campaign", label: "Campaign help" }, { value: "creator", label: "Report a creator" }, { value: "submission", label: "Report a clip" }, { value: "fraud", label: "Suspected fraud" }]} />
          <Input label="Subject" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} required /><Textarea label="Details" rows={5} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} required />
          <button className="btn btn-primary w-full" disabled={busy || !f.subject || !f.description}>{busy && <Spinner size={14} />}Send</button></form>
        <DataTable columns={cols} rows={data?.results} loading={loading} page={page} count={data?.count || 0} onPage={setPage} empty={<EmptyState title="No messages yet" />} />
      </div>}
    </>
  );
}

/* ---------- Business profile ---------- */
export function Profile() {
  const toast = useToast();
  const { data, loading, reload } = useFetch("/brands/profile/");
  const [f, setF] = useState(null);
  const [logo, setLogo] = useState(null);
  const [busy, setBusy] = useState(false);
  const cur = f || data;
  const set = (k) => (e) => setF({ ...cur, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const fd = new FormData(); ["company_name", "contact_person", "website", "description"].forEach((k) => fd.append(k, cur[k] ?? "")); if (logo) fd.append("logo", logo);
      await patch("/brands/profile/", fd); toast.success("Profile saved."); setLogo(null); reload(); } catch (x) { toast.error(errMsg(x)); } finally { setBusy(false); }
  };
  if (loading || !cur) return <Spinner size={24} />;
  return (
    <>
      <PageHeader title="Business profile" />
      <form onSubmit={save} className="card max-w-2xl space-y-4 p-5">
        <div className="flex items-center gap-4">{data?.logo ? <img src={data.logo} alt="" className="h-16 w-16 rounded-xl object-cover" /> : <span className="grid h-16 w-16 place-items-center rounded-xl bg-ink font-display text-2xl font-extrabold text-bg">{cur.company_name?.[0]}</span>}
          <div><label className="label">Logo</label><input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] || null)} className="text-sm" /></div></div>
        <Input label="Company name" value={cur.company_name} onChange={set("company_name")} required /><Input label="Contact person" value={cur.contact_person} onChange={set("contact_person")} required />
        <Input label="Website" type="url" value={cur.website} onChange={set("website")} /><Textarea label="About your business" value={cur.description} onChange={set("description")} />
        <button className="btn btn-primary" disabled={busy}>{busy && <Spinner size={14} />}Save changes</button>
      </form>
    </>
  );
}
