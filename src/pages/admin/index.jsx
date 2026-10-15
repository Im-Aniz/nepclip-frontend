import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Banknote, ChevronLeft, Eye, Film, Inbox, Megaphone, MessagesSquare, Plus, ScrollText, Search, ShieldAlert, Users as UsersIcon, Wallet } from "lucide-react";
import { paymentLabel } from "../../components/CampaignCard";
import { BarsChart, ChartCard, TrendChart } from "../../components/charts";
import SupportChat from "../../components/SupportChat";
import { ActionModal, Avatar, Badge, DataTable, EmptyState, ErrorState, Input, Modal, PageHeader, Select, Skeleton, Spinner, StatCard, Tabs, Textarea } from "../../components/ui";
import { useSettings } from "../../context/SettingsContext";
import { useToast } from "../../context/ToastContext";
import useFetch from "../../hooks/useFetch";
import { del, get, patch, post, put } from "../../services/api";
import { cap, compact, date, errMsg, money, num } from "../../utils/format";
import { Builder } from "../brand/index";

export const CampaignBuilder = () => <Builder admin />;

/* ---------- shared helpers ---------- */
function useList(endpoint, base = {}) {
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState("");
  const [q, setQ] = useState("");
  const res = useFetch(endpoint, { ...base, page, ...(tab && { [base.__tab || "status"]: tab }), ...(q && { search: q }) });
  return { ...res, page, setPage, tab, setTab: (v) => { setTab(v); setPage(1); }, q, setQ: (v) => { setQ(v); setPage(1); } };
}
const SearchBox = ({ value, onChange, placeholder = "Search" }) => (
  <div className="relative min-w-[200px] flex-1 sm:max-w-xs"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
    <input className="input !pl-9" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} aria-label={placeholder} /></div>
);
/** Runs a POST/PATCH with toast + reload. Returns [run, busy]. */
function useRun(reload) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = async (fn, ok = "Done.") => { setBusy(true); try { const r = await fn(); toast.success(ok); reload?.(); return r ?? true; } catch (e) { toast.error(errMsg(e)); return false; } finally { setBusy(false); } };
  return [run, busy];
}
const Btn = ({ children, tone = "outline", ...p }) => <button className={`btn !px-3 !py-1.5 ${tone === "primary" ? "btn-primary" : tone === "danger" ? "btn-ghost text-brand" : "btn-outline"}`} {...p}>{children}</button>;
const Dl = ({ rows }) => <dl className="divide-y divide-line text-sm">{rows.filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2"><dt className="text-mute">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>)}</dl>;

/* ---------- Dashboard ---------- */
export function Dashboard() {
  const { data, loading, error, reload } = useFetch("/admin/dashboard/");
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const c = data?.cards || {}, ch = data?.charts || {};
  const attention = [["/admin/requests", "Campaign requests", c.campaign_requests], ["/admin/submissions", "Pending submissions", c.pending_submissions], ["/admin/withdrawals", "Pending withdrawals", c.pending_withdrawals],
    ["/admin/fraud", "Fraud reviews", c.fraud_review], ["/admin/inquiries", "New brand inquiries", c.new_inquiries], ["/admin/reports", "Open reports", c.open_reports], ["/admin/support", "Unread chats", c.unread_chats]];
  return (
    <>
      <PageHeader title="Admin dashboard" subtitle="Everything happening across NepClip." />
      <div className="mb-5 flex flex-wrap gap-2">{attention.map(([to, l, n]) => <Link key={to} to={to} className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${n ? "border-brand bg-brand-soft text-brand" : "border-line text-mute"}`}>{l}: {n ?? "–"}</Link>)}</div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total users" value={num(c.total_users)} icon={UsersIcon} loading={loading} /><StatCard label="Active creators" value={num(c.active_creators)} loading={loading} />
        <StatCard label="Active brands" value={num(c.active_brands)} loading={loading} /><StatCard label="Active campaigns" value={num(c.active_campaigns)} icon={Megaphone} loading={loading} />
        <StatCard label="Total views" value={compact(c.total_views)} icon={Eye} loading={loading} /><StatCard label="Creator earnings" value={money(c.total_earnings)} icon={Wallet} loading={loading} />
        <StatCard label="Platform revenue" value={money(c.platform_revenue)} icon={Banknote} accent loading={loading} /><StatCard label="Pending withdrawals" value={c.pending_withdrawals} loading={loading} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="User growth" sub="New users per day"><BarsChart data={ch.user_growth} x="date" y="value" color="#1D5FA8" /></ChartCard>
        <ChartCard title="Campaign growth" sub="New campaigns per day"><BarsChart data={ch.campaign_growth} x="date" y="value" color="#E8B422" /></ChartCard>
        <ChartCard title="Total views"><TrendChart data={ch.views} y="views" /></ChartCard>
        <ChartCard title="Platform revenue"><TrendChart data={ch.platform_revenue} y="amount" color="#2E8B57" format={(v) => money(v)} /></ChartCard>
        <ChartCard title="Creator payouts"><TrendChart data={ch.creator_payouts} y="amount" color="#7A5AF8" format={(v) => money(v)} /></ChartCard>
        <ChartCard title="Campaign spending"><TrendChart data={ch.campaign_spending} y="value" color="#D6213A" format={(v) => money(v)} /></ChartCard>
      </div>
    </>
  );
}

/* ---------- Users / Creators / Brands ---------- */
function UserModal({ id, onClose, reload }) {
  const { data: u, loading, reload: rl } = useFetch(id ? `/admin/users/${id}/` : null);
  const [run, busy] = useRun(() => { rl(); reload(); });
  const [adj, setAdj] = useState({ amount: "", reason: "" });
  return (
    <Modal open={!!id} onClose={onClose} title={u?.display_name || "User"} wide>
      {loading || !u ? <Skeleton className="h-40" /> : <>
        <div className="mb-3 flex flex-wrap items-center gap-2"><Badge status={u.status} /><Badge tone="blue">{u.role}</Badge><span className="text-sm text-mute">{u.email} · {u.phone}</span></div>
        <Dl rows={[["Username", `@${u.username}`], ["Joined", date(u.date_joined)], ["Last login", date(u.last_login)], ["Country", u.country], ["Available balance", money(u.wallet?.available, { decimals: 2 })], ["Lifetime earnings", money(u.wallet?.lifetime_earnings, { decimals: 2 })], ["Withdrawn", money(u.wallet?.withdrawn, { decimals: 2 })]]} />
        {u.social_accounts?.length > 0 && <><h3 className="mb-1 mt-4 font-bold">Connected accounts</h3><ul className="text-sm">{u.social_accounts.map((a, i) => <li key={i} className="flex justify-between border-b border-line py-1.5"><span>{a.platform} {a.handle}</span><span>{num(a.followers)} followers · <Badge status={a.status} /></span></li>)}</ul></>}
        {u.submissions?.length > 0 && <><h3 className="mb-1 mt-4 font-bold">Recent submissions</h3><ul className="text-sm">{u.submissions.slice(0, 8).map((s) => <li key={s.id} className="flex justify-between border-b border-line py-1.5"><span className="truncate pr-3">{s.campaign_name || `#${s.id}`}</span><span><Badge status={s.status} /> {num(s.views)} views</span></li>)}</ul></>}
        {u.role !== "admin" && <div className="mt-5 flex flex-wrap gap-2">
          {u.status !== "active" ? <Btn tone="primary" disabled={busy} onClick={() => run(() => post(`/admin/users/${u.id}/reactivate/`), "User reactivated.")}>Reactivate</Btn> : <>
            <Btn disabled={busy} onClick={() => run(() => post(`/admin/users/${u.id}/suspend/`), "User suspended.")}>Suspend</Btn><Btn tone="danger" disabled={busy} onClick={() => run(() => post(`/admin/users/${u.id}/ban/`), "User banned.")}>Ban</Btn></>}</div>}
        {u.role === "creator" && <div className="mt-5 rounded-xl bg-sunk p-4"><p className="mb-2 font-semibold">Manual wallet adjustment</p><p className="mb-2 text-xs text-mute">Use a negative amount to deduct. Always audited.</p>
          <div className="grid gap-2 sm:grid-cols-[120px_1fr_auto]"><input className="input" type="number" placeholder="Amount" value={adj.amount} onChange={(e) => setAdj({ ...adj, amount: e.target.value })} aria-label="Adjustment amount" />
            <input className="input" placeholder="Reason" value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })} aria-label="Reason" /><Btn tone="primary" disabled={busy || !adj.amount || !adj.reason} onClick={async () => { if (await run(() => post(`/admin/users/${u.id}/adjust/`, adj), "Balance adjusted.")) setAdj({ amount: "", reason: "" }); }}>Apply</Btn></div></div>}
      </>}
    </Modal>
  );
}
function UsersPage({ role, title }) {
  const L = useList("/admin/users/", { ...(role && { role }), __tab: "status" });
  const [sel, setSel] = useState(null);
  const cols = [{ key: "display_name", label: "User", render: (r) => <button onClick={() => setSel(r.id)} className="text-left"><b className="hover:text-brand">{r.display_name}</b><p className="text-xs text-mute">@{r.username} · {r.email}</p></button> },
    ...(role ? [] : [{ key: "role", label: "Role", className: "capitalize" }]), { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> }, { key: "phone", label: "Phone" },
    { key: "balance", label: "Balance", className: "tabular-nums", render: (r) => money(r.balance) }, { key: "date_joined", label: "Joined", render: (r) => date(r.date_joined) }];
  return (<><PageHeader title={title} /><div className="mb-4 flex flex-wrap gap-3"><SearchBox value={L.q} onChange={L.setQ} placeholder="Search name, email, phone" /><Tabs value={L.tab} onChange={L.setTab} tabs={[{ value: "", label: "All" }, "active", "suspended", "banned"]} /></div>
    <DataTable columns={cols} rows={L.data?.results} loading={L.loading} error={L.error} onRetry={L.reload} page={L.page} count={L.data?.count || 0} onPage={L.setPage} /><UserModal id={sel} onClose={() => setSel(null)} reload={L.reload} /></>);
}
export const Users = () => <UsersPage title="Users" />;
export const Creators = () => <UsersPage role="creator" title="Creators" />;
export const Brands = () => <UsersPage role="brand" title="Brands" />;

/* ---------- Campaigns & requests ---------- */
function CampaignsTable({ title, tabs, defaultTab, showCreate }) {
  const L = useList("/admin/campaigns/");
  const [run, busy] = useRun(L.reload);
  const [dlg, setDlg] = useState(null);
  const tabList = tabs || [{ value: "", label: "All" }, "draft", "submitted", "admin_review", "approved", "published", "paused", "rejected", "ended"];
  const doAction = (c, action, body, ok) => run(() => post(`/admin/campaigns/${c.id}/${action}/`, body), ok);
  const cols = [{ key: "name", label: "Campaign", render: (r) => <><b>{r.name}</b><p className="text-xs text-mute">{r.brand_name}</p></> }, { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
    { key: "pay", label: "Payment", render: (r) => paymentLabel(r) }, { key: "budget", label: "Budget", className: "tabular-nums", render: (r) => <>{money(r.budget)}<p className="text-xs text-mute">{money(r.spent)} spent · fee {r.effective_fee_percent}%</p></> },
    { key: "a", label: "Actions", render: (r) => <div className="flex flex-wrap gap-1.5">
      {r.status === "submitted" && <Btn disabled={busy} onClick={() => doAction(r, "start-review", {}, "Review started.")}>Start review</Btn>}
      {["submitted", "admin_review"].includes(r.status) && <><Btn tone="primary" disabled={busy} onClick={() => doAction(r, "approve", { publish: true }, "Approved and published.")}>Approve &amp; publish</Btn><Btn tone="danger" onClick={() => setDlg({ c: r, kind: "reject" })}>Reject</Btn></>}
      {r.status === "approved" && <Btn tone="primary" disabled={busy} onClick={() => doAction(r, "publish", {}, "Published.")}>Publish</Btn>}
      {r.status === "published" && <Btn disabled={busy} onClick={() => doAction(r, "pause", {}, "Paused.")}>Pause</Btn>}
      {r.status === "paused" && <Btn disabled={busy} onClick={() => doAction(r, "resume", {}, "Resumed.")}>Resume</Btn>}
      {["published", "paused"].includes(r.status) && <Btn tone="danger" onClick={() => setDlg({ c: r, kind: "end" })}>End</Btn>}
      <Link to={`/admin/campaigns/${r.id}/edit`} className="btn btn-outline !px-3 !py-1.5">Edit</Link>
      {["draft", "rejected", "ended"].includes(r.status) && <Btn tone="danger" onClick={() => setDlg({ c: r, kind: "delete" })}>Delete</Btn>}</div> }];
  return (<>
    <PageHeader title={title} actions={showCreate && <Link to="/admin/campaigns/new" className="btn btn-primary"><Plus size={16} />Create campaign</Link>} />
    <div className="mb-4 flex flex-wrap gap-3"><SearchBox value={L.q} onChange={L.setQ} placeholder="Search campaign or brand" /><Tabs value={L.tab} onChange={L.setTab} tabs={tabList} /></div>
    <DataTable columns={cols} rows={L.data?.results} loading={L.loading} error={L.error} onRetry={L.reload} page={L.page} count={L.data?.count || 0} onPage={L.setPage} empty={<EmptyState icon={Inbox} title="Nothing here" />} />
    <ActionModal open={dlg?.kind === "reject"} onClose={() => setDlg(null)} title="Reject campaign" needReason danger confirmLabel="Reject" text="The brand sees this reason and can edit and resubmit."
      onConfirm={async (reason) => { if (await doAction(dlg.c, "reject", { reason }, "Campaign rejected.")) setDlg(null); }} />
    <ActionModal open={dlg?.kind === "end"} onClose={() => setDlg(null)} title="End this campaign?" danger confirmLabel="End campaign" text="No new clips will be accepted and rewards stop accruing."
      onConfirm={async () => { if (await doAction(dlg.c, "end", {}, "Campaign ended.")) setDlg(null); }} />
    <ActionModal open={dlg?.kind === "delete"} onClose={() => setDlg(null)} title="Delete this campaign?" danger confirmLabel="Delete" text="Campaigns with paid earnings can't be deleted."
      onConfirm={async () => { if (await run(() => del(`/admin/campaigns/${dlg.c.id}/`), "Campaign deleted.")) setDlg(null); }} /></>);
}
export const Campaigns = () => <CampaignsTable title="Campaigns" showCreate />;
export const Requests = () => <CampaignsTable title="Campaign requests" tabs={[{ value: "submitted", label: "New" }, { value: "admin_review", label: "In review" }]} />;

/* ---------- Brand inquiries ---------- */
export function Inquiries() {
  const L = useList("/admin/inquiries/");
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState({});
  const [run, busy] = useRun(L.reload);
  const open = (r) => { setSel(r); setForm({ status: r.status, admin_notes: r.admin_notes }); };
  const cols = [{ key: "company", label: "Company", render: (r) => <button className="text-left" onClick={() => open(r)}><b className="hover:text-brand">{r.company}</b><p className="text-xs text-mute">{r.name} · {r.email}</p></button> },
    { key: "estimated_budget", label: "Budget", className: "tabular-nums", render: (r) => (r.estimated_budget ? money(r.estimated_budget) : "—") }, { key: "campaign_type", label: "Type", className: "capitalize" },
    { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> }, { key: "created_at", label: "Received", render: (r) => date(r.created_at) }];
  return (<>
    <PageHeader title="Brand inquiries" subtitle="Leads from “Launch a campaign” and “Talk to our team”." />
    <div className="mb-4 flex flex-wrap gap-3"><SearchBox value={L.q} onChange={L.setQ} placeholder="Search company, name, email" /><Tabs value={L.tab} onChange={L.setTab} tabs={[{ value: "", label: "All" }, "new", "contacted", "negotiating", "converted", "rejected", "completed"]} /></div>
    <DataTable columns={cols} rows={L.data?.results} loading={L.loading} error={L.error} onRetry={L.reload} page={L.page} count={L.data?.count || 0} onPage={L.setPage} />
    <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.company} wide footer={<><button className="btn btn-outline" onClick={() => setSel(null)}>Close</button>
      <button className="btn btn-primary" disabled={busy} onClick={async () => { if (await run(() => patch(`/admin/inquiries/${sel.id}/`, form), "Inquiry updated.")) setSel(null); }}>{busy && <Spinner size={14} />}Save</button></>}>
      {sel && <><Dl rows={[["Contact", sel.name], ["Email", <a className="text-brand" href={`mailto:${sel.email}`}>{sel.email}</a>], ["Phone", sel.phone], ["Budget", sel.estimated_budget ? money(sel.estimated_budget) : null], ["Campaign type", cap(sel.campaign_type)], ["Received", date(sel.created_at)]]} />
        <p className="label mt-4">What they want to promote</p><p className="text-sm">{sel.promote}</p>{sel.message && <><p className="label mt-3">Message</p><p className="text-sm">{sel.message}</p></>}
        <div className="mt-4 grid gap-3"><Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={["new", "contacted", "negotiating", "converted", "rejected", "completed"]} />
          <Textarea label="Internal notes" value={form.admin_notes} onChange={(e) => setForm({ ...form, admin_notes: e.target.value })} /></div>
        <div className="mt-4 flex flex-wrap gap-2"><Btn disabled={busy} onClick={() => run(() => post(`/admin/inquiries/${sel.id}/create-brand/`), "Brand account created and set-password email sent.")}>Create brand account</Btn>
          <Link to={`/admin/campaigns/new?inquiry=${sel.id}`} className="btn btn-primary !px-3 !py-1.5"><Plus size={14} />Create campaign for them</Link></div></>}
    </Modal></>);
}

/* ---------- Submissions & fraud ---------- */
function SubmissionModal({ id, onClose, reload }) {
  const { data: s, loading, reload: rl } = useFetch(id ? `/admin/submissions/${id}/` : null);
  const [run, busy] = useRun(() => { rl(); reload(); });
  const [dlg, setDlg] = useState(null);
  return (<Modal open={!!id} onClose={onClose} title={s?.campaign_name || "Submission"} wide>
    {loading || !s ? <Skeleton className="h-48" /> : <>
      <div className="mb-3 flex flex-wrap items-center gap-2"><Badge status={s.status}>{s.status_label}</Badge><Badge status={s.fraud_override || s.fraud_level}>{`Fraud ${s.fraud_score}/100${s.fraud_override ? " (overridden)" : ""}`}</Badge><a className="text-sm font-semibold text-brand" href={s.url} target="_blank" rel="noreferrer">Open post</a></div>
      <Dl rows={[["Creator", `@${s.creator_username}`], ["Brand", s.brand_name], ["Views / eligible", `${num(s.views)} / ${num(s.eligible_views)}`], ["Likes / comments", `${num(s.likes)} / ${num(s.comments)}`], ["Paid out", money(s.reward_total, { decimals: 2 })], ["Last checked", date(s.last_checked_at)], ["Post available", s.post_available ? "Yes" : "No"]]} />
      {s.snapshots?.length > 0 && <div className="mt-4 h-44 text-mute"><TrendChart data={s.snapshots} x="captured_at" y="views" /></div>}
      {s.flags?.length > 0 && <><h3 className="mb-1 mt-4 font-bold">Fraud signals</h3><ul className="space-y-1 text-sm">{s.flags.map((f, i) => <li key={i} className="flex justify-between rounded-lg bg-sunk px-3 py-1.5"><span>{cap(f.code)}{f.detail ? ` · ${f.detail}` : ""}</span><b>+{f.points ?? f.weight ?? ""}</b></li>)}</ul></>}
      {s.quality_flags?.length > 0 && <p className="mt-3 text-sm">Quality flags: {s.quality_flags.join(", ")}</p>}
      <div className="mt-5 flex flex-wrap gap-2">
        {["pending", "under_review"].includes(s.status) && <><Btn tone="primary" disabled={busy} onClick={() => run(() => post(`/admin/submissions/${s.id}/review/`, { decision: "approved" }), "Clip approved.")}>Approve</Btn><Btn tone="danger" onClick={() => setDlg("reject")}>Reject</Btn></>}
        {s.status === "fraud_review" && <><Btn tone="primary" disabled={busy} onClick={() => run(() => post(`/admin/submissions/${s.id}/fraud-override/`, { level: "normal", reason: "Reviewed by admin" }), "Cleared. Rewards can now accrue.")}>Clear as legitimate</Btn><Btn tone="danger" disabled={busy} onClick={() => run(() => post(`/admin/submissions/${s.id}/fraud-override/`, { level: "high_risk", reason: "Confirmed by admin" }), "Fraud confirmed.")}>Confirm fraud</Btn></>}
        {s.fraud_override && <Btn disabled={busy} onClick={() => run(() => post(`/admin/submissions/${s.id}/fraud-override/`, { level: "" }), "Override removed.")}>Remove override</Btn>}</div>
      <ActionModal open={dlg === "reject"} onClose={() => setDlg(null)} title="Reject clip" needReason danger confirmLabel="Reject" onConfirm={async (reason) => { if (await run(() => post(`/admin/submissions/${s.id}/review/`, { decision: "rejected", reason }), "Clip rejected.")) setDlg(null); }} />
    </>}</Modal>);
}
const subCols = (open) => [{ key: "creator_username", label: "Creator", render: (r) => <button className="text-left" onClick={() => open(r.id)}><b className="hover:text-brand">@{r.creator_username}</b><p className="text-xs text-mute">{r.campaign_name}</p></button> },
  { key: "status", label: "Status", render: (r) => <Badge status={r.status}>{r.status_label}</Badge> }, { key: "views", label: "Views", className: "tabular-nums", render: (r) => num(r.views) },
  { key: "fraud_score", label: "Fraud score", render: (r) => <Badge status={r.fraud_override || r.fraud_level}>{r.fraud_score}</Badge> }, { key: "reward_total", label: "Paid", className: "tabular-nums", render: (r) => money(r.reward_total) }, { key: "created_at", label: "Submitted", render: (r) => date(r.created_at) }];
export function Submissions() {
  const L = useList("/admin/submissions/");
  const [sel, setSel] = useState(null);
  return (<><PageHeader title="Submissions" />
    <div className="mb-4 flex flex-wrap gap-3"><SearchBox value={L.q} onChange={L.setQ} placeholder="Search creator, campaign, URL" /><Tabs value={L.tab} onChange={L.setTab} tabs={[{ value: "", label: "All" }, "pending", "under_review", "approved", "rejected", "fraud_review", "paid"]} /></div>
    <DataTable columns={subCols(setSel)} rows={L.data?.results} loading={L.loading} error={L.error} onRetry={L.reload} page={L.page} count={L.data?.count || 0} onPage={L.setPage} /><SubmissionModal id={sel} onClose={() => setSel(null)} reload={L.reload} /></>);
}
export function Fraud() {
  const { data, loading, error, reload } = useFetch("/admin/fraud/");
  const [sel, setSel] = useState(null);
  return (<><PageHeader title="Fraud detection" subtitle="Clips the risk engine flagged for human review." />
    {data?.disclaimer && <p className="mb-4 rounded-xl bg-amber-500/15 px-4 py-3 text-sm">{data.disclaimer}</p>}
    <DataTable columns={subCols(setSel)} rows={data?.results} loading={loading} error={error} onRetry={reload} empty={<EmptyState icon={ShieldAlert} title="Nothing flagged" text="High-risk clips appear here before they can earn." />} />
    <SubmissionModal id={sel} onClose={() => setSel(null)} reload={reload} /></>);
}

/* ---------- Withdrawals, transactions ---------- */
export function Withdrawals() {
  const L = useList("/admin/withdrawals/");
  const [run, busy] = useRun(L.reload);
  const [dlg, setDlg] = useState(null);
  const [ref, setRef] = useState("");
  const { data: detail } = useFetch(dlg?.kind === "complete" || dlg?.kind === "details" ? `/admin/withdrawals/${dlg.w.id}/` : null);
  const act = (w, a, body = {}, ok) => run(() => post(`/admin/withdrawals/${w.id}/${a}/`, body), ok);
  const cols = [{ key: "username", label: "Creator", render: (r) => <button className="font-semibold hover:text-brand" onClick={() => setDlg({ kind: "details", w: r })}>@{r.username}</button> }, { key: "amount", label: "Amount", className: "tabular-nums font-semibold", render: (r) => money(r.amount) },
    { key: "method_label", label: "Method" }, { key: "account_masked", label: "Account" }, { key: "status", label: "Status", render: (r) => <><Badge status={r.status} />{r.payment_reference && <p className="mt-1 text-xs text-mute">{r.payment_reference}</p>}</> },
    { key: "a", label: "Actions", render: (r) => <div className="flex flex-wrap gap-1.5">
      {r.status === "pending" && <Btn tone="primary" disabled={busy} onClick={() => act(r, "approve", {}, "Approved.")}>Approve</Btn>}
      {r.status === "approved" && <Btn disabled={busy} onClick={() => act(r, "process", {}, "Marked processing.")}>Processing</Btn>}
      {["approved", "processing"].includes(r.status) && <Btn tone="primary" onClick={() => { setRef(""); setDlg({ kind: "complete", w: r }); }}>Mark paid</Btn>}
      {["pending", "approved", "processing"].includes(r.status) && <Btn tone="danger" onClick={() => setDlg({ kind: "reject", w: r })}>Reject</Btn>}</div> }];
  const Details = ({ w }) => <Dl rows={[["Creator", `@${w.username}`], ["Amount", money(w.amount)], ["Method", w.method_label], ["Payout account", detail?.account_details]]} />;
  return (<><PageHeader title="Withdrawals" subtitle="Review requests, pay them manually, then mark them paid." />
    <div className="mb-4 flex flex-wrap gap-3"><SearchBox value={L.q} onChange={L.setQ} placeholder="Search creator or reference" /><Tabs value={L.tab} onChange={L.setTab} tabs={[{ value: "", label: "All" }, "pending", "approved", "processing", "completed", "rejected"]} /></div>
    <DataTable columns={cols} rows={L.data?.results} loading={L.loading} error={L.error} onRetry={L.reload} page={L.page} count={L.data?.count || 0} onPage={L.setPage} />
    <Modal open={dlg?.kind === "details"} onClose={() => setDlg(null)} title="Withdrawal details">{dlg?.w && (detail ? <Details w={dlg.w} /> : <Skeleton className="h-24" />)}</Modal>
    <Modal open={dlg?.kind === "complete"} onClose={() => setDlg(null)} title="Mark as paid" footer={<><button className="btn btn-outline" onClick={() => setDlg(null)}>Cancel</button><button className="btn btn-primary" disabled={busy || !ref} onClick={async () => { if (await act(dlg.w, "complete", { reference: ref }, "Marked as paid.")) setDlg(null); }}>Confirm payment sent</button></>}>
      {dlg?.w && <><p className="mb-3 text-sm text-mute">Send the money first, then record the transaction reference.</p>{detail && <Details w={dlg.w} />}<div className="mt-3"><Input label="Payment reference" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="eSewa / bank transaction ID" /></div></>}</Modal>
    <ActionModal open={dlg?.kind === "reject"} onClose={() => setDlg(null)} title="Reject withdrawal" needReason danger confirmLabel="Reject & refund" text="The amount returns to the creator's available balance."
      onConfirm={async (note) => { if (await act(dlg.w, "reject", { note }, "Rejected and refunded.")) setDlg(null); }} /></>);
}
export function Transactions() {
  const L = useList("/admin/transactions/", { __tab: "type" });
  const cols = [{ key: "username", label: "User", render: (r) => `@${r.username}` }, { key: "type", label: "Type", render: (r) => cap(r.type) }, { key: "description", label: "Description" }, { key: "reference", label: "Ref" },
    { key: "amount", label: "Amount", className: "tabular-nums font-semibold", render: (r) => <span className={Number(r.amount) < 0 ? "text-brand" : "text-flag-green"}>{money(r.amount, { decimals: 2, sign: true })}</span> },
    { key: "balance_after", label: "Balance after", className: "tabular-nums", render: (r) => money(r.balance_after, { decimals: 2 }) }, { key: "created_at", label: "Date", render: (r) => date(r.created_at) }];
  return (<><PageHeader title="Transactions" subtitle="The wallet ledger. Every balance change is recorded here." />
    <div className="mb-4 flex flex-wrap gap-3"><SearchBox value={L.q} onChange={L.setQ} placeholder="Search user or reference" /><Tabs value={L.tab} onChange={L.setTab} tabs={[{ value: "", label: "All" }, "earning", "referral", "withdrawal_hold", "withdrawal_paid", "withdrawal_release", "adjustment"]} /></div>
    <DataTable columns={cols} rows={L.data?.results} loading={L.loading} error={L.error} onRetry={L.reload} page={L.page} count={L.data?.count || 0} onPage={L.setPage} /></>);
}

/* ---------- Reports ---------- */
export function Reports() {
  const L = useList("/admin/reports/");
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState({});
  const [run, busy] = useRun(L.reload);
  const cols = [{ key: "subject", label: "Report", render: (r) => <button className="text-left" onClick={() => { setSel(r); setForm({ status: r.status, resolution: r.resolution || "" }); }}><b className="hover:text-brand">{r.subject}</b><p className="text-xs text-mute">by @{r.reporter_username}</p></button> },
    { key: "category", label: "Type", className: "capitalize" }, { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> }, { key: "created_at", label: "Filed", render: (r) => date(r.created_at) }];
  return (<><PageHeader title="Reports & disputes" />
    <div className="mb-4"><Tabs value={L.tab} onChange={L.setTab} tabs={[{ value: "", label: "All" }, "open", "investigating", "resolved", "rejected"]} /></div>
    <DataTable columns={cols} rows={L.data?.results} loading={L.loading} error={L.error} onRetry={L.reload} page={L.page} count={L.data?.count || 0} onPage={L.setPage} empty={<EmptyState title="No reports" />} />
    <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.subject} footer={<><button className="btn btn-outline" onClick={() => setSel(null)}>Close</button><button className="btn btn-primary" disabled={busy} onClick={async () => { if (await run(() => patch(`/admin/reports/${sel.id}/`, form), "Report updated.")) setSel(null); }}>Save</button></>}>
      {sel && <><p className="mb-1 text-xs text-mute">{cap(sel.category)} · filed by @{sel.reporter_username}</p><p className="mb-4 whitespace-pre-line text-sm">{sel.description}</p>
        <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={["open", "investigating", "resolved", "rejected"]} />
        <div className="mt-3"><Textarea label="Resolution (shared with the reporter)" value={form.resolution} onChange={(e) => setForm({ ...form, resolution: e.target.value })} /></div></>}</Modal></>);
}

/* ---------- Referrals, notifications ---------- */
export function Referrals() {
  const { data, loading, error, reload } = useFetch("/admin/referrals/");
  return (<><PageHeader title="Referrals" />
    <div className="mb-4 max-w-xs"><StatCard label="Total referral rewards paid" value={money(data?.total_rewards, { decimals: 2 })} loading={loading} icon={Wallet} /></div>
    <DataTable columns={[{ key: "referrer", label: "Referrer", render: (r) => `@${r.referrer}` }, { key: "referred", label: "Referred creator", render: (r) => `@${r.referred}` }, { key: "joined", label: "Joined", render: (r) => date(r.joined) }, { key: "reward", label: "Reward", className: "tabular-nums", render: (r) => money(r.reward, { decimals: 2 }) }]}
      rows={data?.results} loading={loading} error={error} onRetry={reload} empty={<EmptyState title="No referrals yet" />} /></>);
}
export function Notify() {
  const [f, setF] = useState({ role: "", title: "", body: "" });
  const [run, busy] = useRun();
  return (<><PageHeader title="Notifications" subtitle="Send an in-app announcement. Users see it in their notifications." />
    <form className="card max-w-xl space-y-4 p-5" onSubmit={async (e) => { e.preventDefault(); const r = await run(() => post("/admin/notifications/broadcast/", f), "Sent."); if (r) setF({ ...f, title: "", body: "" }); }}>
      <Select label="Audience" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} options={[{ value: "", label: "Everyone" }, { value: "creator", label: "All creators" }, { value: "brand", label: "All brands" }]} />
      <Input label="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required /><Textarea label="Message" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
      <button className="btn btn-primary" disabled={busy || !f.title}>{busy && <Spinner size={14} />}Send announcement</button></form></>);
}

/* ---------- Platform settings ---------- */
const NUM = [["default_rpm", "Default RPM (NPR / 1,000 views)"], ["min_withdrawal", "Minimum withdrawal"], ["referral_percent", "Referral percentage (% of platform commission)"], ["platform_commission_percent", "Platform commission (%)"],
  ["min_campaign_budget", "Minimum campaign budget"], ["max_campaign_budget", "Maximum campaign budget"], ["max_active_campaigns_per_brand", "Max active campaigns per brand"], ["max_active_campaigns_per_creator", "Max active campaigns per creator"],
  ["max_upload_mb", "Allowed file size (MB)"], ["account_min_followers", "Minimum followers to connect an account"]];
const LISTS = [["supported_countries", "Supported countries (codes)"], ["supported_platforms", "Supported platforms"], ["withdrawal_methods", "Withdrawal methods"]];
export function Settings() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch("/admin/settings/");
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <Skeleton className="h-96" />;
  const cur = f || { ...data, ...Object.fromEntries(LISTS.map(([k]) => [k, (data[k] || []).join(", ")])) };
  const set = (k) => (e) => setF({ ...cur, [k]: e.target.value });
  const setNested = (g, k) => (e) => setF({ ...cur, [g]: { ...cur[g], [k]: e.target.value } });
  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    const body = {};
    for (const [k] of NUM) if (String(cur[k]) !== String(data[k])) body[k] = Number(cur[k]);
    for (const [k] of LISTS) { const v = String(cur[k]).split(",").map((x) => x.trim()).filter(Boolean); if (v.join() !== (data[k] || []).join()) body[k] = v; }
    for (const g of ["fraud_weights", "fraud_thresholds"]) { const v = Object.fromEntries(Object.entries(cur[g]).map(([k, x]) => [k, Number(x)])); if (JSON.stringify(v) !== JSON.stringify(data[g])) body[g] = v; }
    for (const k of ["currency", "currency_symbol"]) if (cur[k] !== data[k]) body[k] = cur[k];
    if (!Object.keys(body).length) { toast.info("No changes to save."); setBusy(false); return; }
    try { await put("/admin/settings/", body); toast.success("Settings saved and audited."); setF(null); reload(); } catch (x) { toast.error(errMsg(x)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={save} className="space-y-5"><PageHeader title="Platform settings" subtitle="Business rules live here, not in code. Changes are audited." />
      <section className="card p-5"><h2 className="mb-3 font-display text-lg font-bold">Money &amp; limits</h2><div className="grid gap-4 sm:grid-cols-2">{NUM.map(([k, l]) => <Input key={k} label={l} type="number" step="any" min="0" value={cur[k]} onChange={set(k)} />)}
        <Input label="Currency code" value={cur.currency} onChange={set("currency")} /><Input label="Currency symbol" value={cur.currency_symbol} onChange={set("currency_symbol")} /></div></section>
      <section className="card p-5"><h2 className="mb-3 font-display text-lg font-bold">Supported options</h2><div className="grid gap-4 sm:grid-cols-3">{LISTS.map(([k, l]) => <Input key={k} label={l} value={cur[k]} onChange={set(k)} hint="Comma separated" />)}</div></section>
      <section className="card p-5"><h2 className="font-display text-lg font-bold">Fraud scoring</h2><p className="mb-3 text-sm text-mute">Points added to a clip's 0–100 risk score when a signal fires. This is a screening aid, not proof of fraud.</p>
        <div className="grid gap-4 sm:grid-cols-3">{Object.keys(cur.fraud_weights).map((k) => <Input key={k} label={cap(k)} type="number" min="0" value={cur.fraud_weights[k]} onChange={setNested("fraud_weights", k)} />)}</div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">{Object.keys(cur.fraud_thresholds).map((k) => <Input key={k} label={`${cap(k)} threshold (score ≥)`} type="number" min="0" max="100" value={cur.fraud_thresholds[k]} onChange={setNested("fraud_thresholds", k)} />)}</div></section>
      <div className="flex justify-end"><button className="btn btn-primary" disabled={busy}>{busy && <Spinner size={14} />}Save settings</button></div></form>
  );
}

/* ---------- Audit log ---------- */
export function Audit() {
  const L = useList("/admin/audit-logs/");
  const json = (v) => (v == null ? "—" : <code className="block max-w-[240px] truncate text-xs" title={JSON.stringify(v)}>{typeof v === "string" ? v : JSON.stringify(v)}</code>);
  const cols = [{ key: "created_at", label: "When", render: (r) => new Date(r.created_at).toLocaleString("en-GB") }, { key: "actor_name", label: "Admin", render: (r) => r.actor_name || "system" }, { key: "action", label: "Action", render: (r) => <b>{r.action}</b> },
    { key: "target_type", label: "Target", render: (r) => `${r.target_type} ${r.target_id}` }, { key: "previous_value", label: "Previous", render: (r) => json(r.previous_value) }, { key: "new_value", label: "New", render: (r) => json(r.new_value) }];
  return (<><PageHeader title="Audit logs" subtitle="Who changed what, and when." /><div className="mb-4"><SearchBox value={L.q} onChange={L.setQ} placeholder="Search action or target ID" /></div>
    <DataTable columns={cols} rows={L.data?.results} loading={L.loading} error={L.error} onRetry={L.reload} page={L.page} count={L.data?.count || 0} onPage={L.setPage} empty={<EmptyState icon={ScrollText} title="No activity yet" />} /></>);
}

/* ---------- Support chat inbox ---------- */
const when = (iso) => {
  if (!iso) return "";
  const d = new Date(iso), now = new Date();
  return d.toDateString() === now.toDateString() ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

export function SupportInbox() {
  const toast = useToast();
  const [tab, setTab] = useState("");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [sel, setSel] = useState(null);

  const load = useCallback(async () => {
    const params = { page_size: 50, ...(q && { search: q }), ...(tab === "unread" ? { unread: 1 } : tab ? { status: tab } : {}) };
    try { const d = await get("/admin/support/threads/", params); setRows(d.results); setError(null); }
    catch (e) { setError(errMsg(e, "Couldn't load chats.")); }
  }, [q, tab]);
  useEffect(() => {
    load();
    const t = setInterval(() => { if (!document.hidden) load(); }, 8000);
    return () => clearInterval(t);
  }, [load]);

  const open = (t) => { setSel(t); setRows((r) => r && r.map((x) => (x.id === t.id ? { ...x, staff_unread: 0 } : x))); };
  const setStatus = async (status) => {
    try {
      await post(`/admin/support/threads/${sel.id}/status/`, { status });
      setSel((s) => ({ ...s, status })); setRows((r) => r && r.map((x) => (x.id === sel.id ? { ...x, status } : x)));
      toast.success(status === "closed" ? "Marked as resolved." : "Conversation reopened.");
    } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <>
      <PageHeader title="Support chat" subtitle="Conversations with creators and brands. New messages appear automatically." />
      <div className="grid gap-4 lg:h-[calc(100vh-13rem)] lg:min-h-[480px] lg:grid-cols-[340px_1fr]">
        <section className={`card flex min-h-0 flex-col overflow-hidden ${sel ? "hidden lg:flex" : "flex"}`}>
          <div className="space-y-3 border-b border-line p-3">
            <SearchBox value={q} onChange={setQ} placeholder="Search name or email" />
            <Tabs value={tab} onChange={setTab} tabs={[{ value: "", label: "All" }, { value: "unread", label: "Unread" }, { value: "open", label: "Open" }, { value: "closed", label: "Resolved" }]} />
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {error && <li className="p-4 text-sm text-mute">{error}</li>}
            {!error && rows === null && <li className="grid place-items-center p-8"><Spinner size={20} /></li>}
            {rows?.length === 0 && <li className="p-6"><EmptyState icon={MessagesSquare} title="No conversations" text="When a creator or brand writes in, it shows up here." /></li>}
            {rows?.map((t) => (
              <li key={t.id}>
                <button onClick={() => open(t)} aria-current={sel?.id === t.id} className={`flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left transition hover:bg-sunk ${sel?.id === t.id ? "bg-sunk" : ""}`}>
                  <Avatar name={t.user.display_name} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2"><b className="truncate text-sm">{t.user.display_name}</b><span className="shrink-0 text-xs text-mute">{when(t.last_message_at)}</span></span>
                    <span className="flex items-center justify-between gap-2">
                      <span className={`truncate text-sm ${t.staff_unread ? "font-semibold" : "text-mute"}`}>{t.last_from_staff ? "You: " : ""}{t.last_preview}</span>
                      {t.staff_unread > 0 && <span className="shrink-0 rounded-full bg-brand px-1.5 text-xs font-bold text-brand-ink" aria-label={`${t.staff_unread} unread`}>{t.staff_unread}</span>}
                    </span>
                    <span className="mt-1 flex gap-1.5"><Badge tone="blue">{t.user.role}</Badge>{t.status === "closed" && <Badge status="closed">Resolved</Badge>}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className={`card min-h-0 flex-col overflow-hidden ${sel ? "flex" : "hidden lg:flex"}`}>
          {!sel ? <div className="grid flex-1 place-items-center p-8"><EmptyState icon={MessagesSquare} title="Select a conversation" text="Pick a chat on the left to read and reply." /></div> : (
            <>
              <header className="flex items-center gap-3 border-b border-line px-4 py-3">
                <button className="btn btn-ghost !p-1.5 lg:hidden" onClick={() => setSel(null)} aria-label="Back to conversations"><ChevronLeft size={18} /></button>
                <Avatar name={sel.user.display_name} />
                <div className="min-w-0 flex-1"><p className="truncate font-bold">{sel.user.display_name}</p><p className="truncate text-xs text-mute">{sel.user.email} · {sel.user.role}</p></div>
                {sel.status === "closed" ? <Btn onClick={() => setStatus("open")}>Reopen</Btn> : <Btn onClick={() => setStatus("closed")}>Mark resolved</Btn>}
              </header>
              <SupportChat key={sel.id} staff url={`/admin/support/threads/${sel.id}/`} className="min-h-0 flex-1" />
            </>
          )}
        </section>
      </div>
    </>
  );
}
