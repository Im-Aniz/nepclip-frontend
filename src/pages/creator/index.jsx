import { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Banknote, BadgeCheck, Check, ChevronRight, Clapperboard, Copy, Eye, Film, Link2, Megaphone, Play, RefreshCw, Sparkles, Trash2, Trophy, Wallet, XCircle } from "lucide-react";
import CampaignCard from "../../components/CampaignCard";
import SupportChat from "../../components/SupportChat";
import { BarsChart, ChartCard, Donut, TrendChart } from "../../components/charts";
import { ActionModal, Badge, DataTable, EmptyState, ErrorState, Input, Modal, PageHeader, Select, Spinner, StatCard, Tabs, Textarea } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { useToast } from "../../context/ToastContext";
import useFetch from "../../hooks/useFetch";
import { del, patch, post } from "../../services/api";
import { cap, compact, date, errMsg, fieldErrors, money, num, pct, PLATFORM_LABEL } from "../../utils/format";
import BrowseCampaigns from "../public/Campaigns";

/* ---------- Dashboard ---------- */
export function Dashboard() {
  const { user } = useAuth();
  const { data: d, loading, error, reload } = useFetch("/creators/dashboard/");
  const { data: rec } = useFetch("/campaigns/recommended/");
  const { data: tx, loading: txLoading } = useFetch("/wallet/transactions/", { page: 1 });
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const w = d?.wallet || {};
  const feed = (tx?.results || []).slice(0, 6);
  const miniStats = [
    ["Total views", compact(d?.total_views), Eye],
    ["Active campaigns", d?.active_campaigns, Megaphone],
    ["Submitted", d?.total_submitted, Film],
    ["Approved", d?.approved, Check],
    ["Pending", d?.pending, RefreshCw],
    ["Rejected", d?.rejected, XCircle],
  ];

  return (
    <>
      <PageHeader
        title={`Hi, ${user?.display_name?.split(" ")[0] || user?.username}`}
        subtitle="Here's how your clips are performing."
        actions={<Link to="/creator/campaigns" className="btn btn-primary"><Megaphone size={16} />Find campaigns</Link>}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ---------- Left column ---------- */}
        <div className="min-w-0">
          <p className="text-sm font-medium text-mute">Total balance · All balances</p>
          {loading
            ? <div className="mt-2 h-12 w-48 animate-pulse rounded-lg bg-sunk" />
            : <p className="font-display text-5xl font-extrabold tracking-tight">{money(w.available, { decimals: 2 })}</p>}
          <p className="mt-1 text-sm text-mute">
            {Number(w.pending) ? `${money(w.pending)} in withdrawals` : "Ready to withdraw"}
          </p>

          <div className="mt-4 h-64 text-mute">
            {loading
              ? <div className="grid h-full place-items-center"><Spinner /></div>
              : <TrendChart data={d?.earnings_series} y="amount" color="#2E8B57" format={(v) => money(v)} />}
          </div>

          {/* compact stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {miniStats.map(([label, value, Icon]) => (
              <div key={label} className="card flex items-center gap-3 p-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-sunk"><Icon size={16} /></span>
                <div>
                  <p className="text-xs text-mute">{label}</p>
                  <p className="font-display text-lg font-bold">{loading ? "…" : (value ?? 0)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* views chart */}
          <div className="mt-6">
            <ChartCard title="Views over time" sub="Last 30 days">
              <TrendChart data={d?.views_series} y="views" />
            </ChartCard>
          </div>

          {rec?.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 flex items-center gap-2 text-xl font-bold"><Sparkles size={20} className="text-brand" />Recommended for you</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {rec.slice(0, 3).map((c) => <CampaignCard key={c.id} c={c} />)}
              </div>
            </section>
          )}
        </div>

        {/* ---------- Right column ---------- */}
        <aside className="space-y-5">
          {/* Balances */}
          <div className="card p-5">
            <h2 className="mb-3 font-display text-xl font-bold">Balances</h2>
            <div className="space-y-1">
              {[
                ["Available", w.available, "/creator/withdraw"],
                ["In withdrawals", w.pending, "/creator/earnings"],
                ["Withdrawn", w.withdrawn, "/creator/earnings"],
                ["Lifetime earnings", w.lifetime, "/creator/earnings"],
              ].map(([label, value, to]) => (
                <Link key={label} to={to} className="flex items-center justify-between rounded-xl px-2 py-2.5 transition hover:bg-sunk">
                  <span className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-brand"><Wallet size={16} /></span>
                    <span className="font-semibold">{label}</span>
                  </span>
                  <span className="flex items-center gap-1 font-display font-bold tabular-nums">
                    {money(value, { decimals: 2 })}<ChevronRight size={16} className="text-mute" />
                  </span>
                </Link>
              ))}
            </div>
            <Link to="/creator/withdraw" className="btn btn-primary mt-3 w-full"><Banknote size={16} />Withdraw</Link>
          </div>

          {/* Pulse / activity feed */}
          <div className="card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
              Pulse
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-flag-green opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-flag-green" />
              </span>
            </h2>
            {txLoading && <div className="grid place-items-center py-6"><Spinner /></div>}
            {!txLoading && feed.length === 0 && (
              <p className="py-4 text-sm text-mute">No activity yet. Earnings and payouts will show up here.</p>
            )}
            <ul className="space-y-4">
              {feed.map((t) => (
                <li key={t.id} className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sunk"><Activity size={16} /></span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">
                      {t.description || t.type_label}{" "}
                      <span className={Number(t.amount) < 0 ? "font-semibold text-brand" : "font-semibold text-flag-green"}>
                        {money(t.amount, { decimals: 2, sign: true })}
                      </span>
                    </p>
                    <p className="text-xs text-mute">{t.type_label} · {date(t.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
            {feed.length > 0 && <Link to="/creator/earnings" className="mt-4 block text-sm font-semibold text-brand">View all activity</Link>}
          </div>
        </aside>
      </div>
    </>
  );
}

/* ---------- Campaigns ---------- */
export function Browse() {
  return (<><PageHeader title="Campaigns" subtitle="Find a campaign that fits your channel." /><BrowseCampaigns embedded linkPrefix="/campaign" /></>);
}

/* ---------- Submissions ---------- */
function SubmissionDetail({ s, onClose }) {
  const { data, loading } = useFetch(s ? "/performance/" : null, { submission: s?.id });
  return (
    <Modal open={!!s} onClose={onClose} title={s?.campaign_name || "Submission"} wide>
      {s && <>
        <div className="mb-4 flex flex-wrap items-center gap-2"><Badge status={s.status} />{!s.post_available && <Badge tone="red">Post unavailable</Badge>}<a href={s.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand">Open post</a></div>
        {s.rejection_reason && <p className="mb-4 rounded-xl bg-brand-soft px-3 py-2 text-sm text-brand">Reason: {s.rejection_reason}</p>}
        {s.quality_flags?.length > 0 && <p className="mb-4 rounded-xl bg-amber-500/15 px-3 py-2 text-sm">Flags: {s.quality_flags.join(", ")}</p>}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Views", num(s.views)], ["Eligible", num(s.eligible_views)], ["Likes", num(s.likes)], ["Earned", money(s.reward_total)]].map(([k, v]) => <div key={k} className="rounded-xl bg-sunk p-3"><p className="text-xs text-mute">{k}</p><p className="font-display text-lg font-bold">{v}</p></div>)}</div>
        <p className="mb-2 font-semibold">View history</p>
        <div className="h-52 text-mute">{loading ? <div className="grid h-full place-items-center"><Spinner /></div> : <TrendChart data={data} x="captured_at" y="views" />}</div>
        <p className="mt-2 text-xs text-mute">Last checked {date(s.last_checked_at)}. Each check is stored as a snapshot; history is never overwritten.</p></>}
    </Modal>
  );
}
/** Pull the 11-char video id out of a YouTube watch, shorts, embed or youtu.be link. */
const ytId = (u = "") => (u.match(/(?:youtu\.be\/|youtube\.com\/(?:shorts\/|watch\?(?:.*&)?v=|embed\/|live\/))([\w-]{11})/) || [])[1];
const TILE_COLORS = [["#a78bfa", "#38bdf8"], ["#2dd4bf", "#22d3ee"], ["#f472b6", "#fb923c"], ["#a3e635", "#2dd4bf"], ["#818cf8", "#e879f9"]];
/** Small gradient square next to the campaign name; same campaign always gets the same colors. */
function tileStyle(name = "") {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const [a, b] = TILE_COLORS[h % TILE_COLORS.length];
  return { background: `linear-gradient(135deg, ${a}, ${b})` };
}

/** Thumbnail first (fast page), real YouTube player only after the creator taps play. */
function ClipPlayer({ s }) {
  const [play, setPlay] = useState(false);
  const id = ytId(s.url);
  if (!id) return (
    <a href={s.url} target="_blank" rel="noreferrer" className="grid aspect-[9/16] w-full place-items-center rounded-xl bg-zinc-900 text-white">
      <span className="flex flex-col items-center gap-2 text-sm"><PlatformIcon platform={s.platform} size={28} />Open post</span>
    </a>
  );
  return (
    <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-black">
      {play
        ? <iframe title={s.campaign_name || "Clip"} src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`} className="absolute inset-0 h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        : (
          <button type="button" onClick={() => setPlay(true)} aria-label="Play clip" className="group absolute inset-0">
            <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover" />
            <span className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white"><PlatformIcon platform="youtube" size={16} /></span>
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-black/60 text-white transition group-hover:bg-black/80"><Play size={24} className="ml-0.5 fill-current" /></span>
            </span>
          </button>
        )}
    </div>
  );
}

function SubmissionCard({ s, onOpen }) {
  return (
    <article className="card flex flex-col gap-3 p-3">
      <div className="px-1 pt-1">
        <p className="flex items-center gap-2 font-semibold"><span className="h-4 w-4 shrink-0 rounded" style={tileStyle(s.campaign_name)} /><span className="truncate">{s.campaign_name || "Campaign"}</span></p>
        <p className="mt-1 flex items-center gap-2 text-sm text-mute">
          {date(s.created_at)}
          {Number(s.reward_total) > 0 && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-flag-green">{money(s.reward_total)} earned</span>}
          {!s.post_available && <Badge tone="red">Post unavailable</Badge>}
        </p>
      </div>
      <ClipPlayer s={s} />
      <p className="px-1 text-sm text-mute">{num(s.views)} views</p>
      <button className="btn btn-outline w-full" onClick={onOpen}>View details</button>
    </article>
  );
}

export function Submissions() {
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [campaign, setCampaign] = useState("");
  const [sort, setSort] = useState("newest");
  const [sel, setSel] = useState(null);
  const { data: dash } = useFetch("/creators/dashboard/");
  const { data, loading, error, reload } = useFetch("/submissions/", { page, status });

  const rows = data?.results || [];
  const campaigns = [...new Set(rows.map((r) => r.campaign_name).filter(Boolean))];
  const sorters = {
    newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
    oldest: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    views: (a, b) => Number(b.views) - Number(a.views),
  };
  const shown = rows.filter((r) => !campaign || r.campaign_name === campaign).sort(sorters[sort]);
  const withCount = (label, n) => (n == null ? label : `${label} ${n}`);
  const tabs = [
    { value: "pending", label: withCount("Pending", dash?.pending) },
    { value: "approved", label: withCount("Approved", dash?.approved) },
    { value: "rejected", label: withCount("Rejected", dash?.rejected) },
    { value: "fraud_review", label: "Flagged" },
  ];
  const emptyText = { pending: "Clips waiting for review show up here.", approved: "Approved clips that earn views show up here.", rejected: "Nothing rejected. Keep it up.", fraud_review: "Clips held for a quality check show up here." }[status];

  return (
    <>
      <PageHeader title="My submissions" subtitle="Track every clip from review to payout." />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={status} onChange={(v) => { setStatus(v); setPage(1); setCampaign(""); }} tabs={tabs} />
        <div className="flex flex-wrap gap-2">
          <select className="input w-auto" aria-label="Filter by campaign" value={campaign} onChange={(e) => setCampaign(e.target.value)}>
            <option value="">All campaigns</option>
            {campaigns.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input w-auto" aria-label="Sort clips" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="views">Most views</option>
          </select>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="card aspect-[9/16] animate-pulse bg-sunk" />)}</div>}
      {!loading && !error && shown.length === 0 && (
        <div className="card"><EmptyState icon={Film} title="No clips here" text={emptyText} action={<Link to="/creator/campaigns" className="btn btn-primary">Browse campaigns</Link>} /></div>
      )}
      {!loading && !error && shown.length > 0 && (
        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((s) => <SubmissionCard key={s.id} s={s} onOpen={() => setSel(s)} />)}
        </div>
      )}

      {(page > 1 || data?.next) && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span className="text-sm text-mute">Page {page}</span>
          <button className="btn btn-outline" disabled={!data?.next} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
      <SubmissionDetail s={sel} onClose={() => setSel(null)} />
    </>
  );
}

/* ---------- Earnings ---------- */
export function Earnings() {
  const [tab, setTab] = useState("earnings");
  const [page, setPage] = useState(1);
  const { data: w, loading: wl } = useFetch("/wallet/");
  const { data, loading, error, reload } = useFetch(tab === "earnings" ? "/earnings/" : "/wallet/transactions/", { page });
  const ecols = [{ key: "campaign_name", label: "Campaign" }, { key: "eligible_views", label: "Eligible views", className: "tabular-nums", render: (r) => num(r.eligible_views) },
    { key: "amount", label: "Credited", className: "tabular-nums font-semibold", render: (r) => money(r.amount, { decimals: 2 }) }, { key: "created_at", label: "Date", render: (r) => date(r.created_at) }];
  const tcols = [{ key: "type_label", label: "Type" }, { key: "description", label: "Description" },
    { key: "amount", label: "Amount", className: "tabular-nums font-semibold", render: (r) => <span className={Number(r.amount) < 0 ? "text-brand" : "text-flag-green"}>{money(r.amount, { decimals: 2, sign: true })}</span> },
    { key: "balance_after", label: "Balance", className: "tabular-nums", render: (r) => money(r.balance_after, { decimals: 2 }) }, { key: "created_at", label: "Date", render: (r) => date(r.created_at) }];
  return (
    <>
      <PageHeader title="Earnings" actions={<Link to="/creator/withdraw" className="btn btn-primary"><Banknote size={16} />Withdraw</Link>} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Available balance" value={money(w?.available, { decimals: 2 })} loading={wl} icon={Wallet} accent />
        <StatCard label="In withdrawals" value={money(w?.pending, { decimals: 2 })} loading={wl} />
        <StatCard label="Lifetime earnings" value={money(w?.lifetime_earnings, { decimals: 2 })} loading={wl} />
        <StatCard label="Withdrawn" value={money(w?.withdrawn, { decimals: 2 })} loading={wl} />
      </div>
      <div className="mb-4"><Tabs value={tab} onChange={(v) => { setTab(v); setPage(1); }} tabs={[{ value: "earnings", label: "Earnings" }, { value: "transactions", label: "Transactions" }]} /></div>
      <DataTable columns={tab === "earnings" ? ecols : tcols} rows={data?.results} loading={loading} error={error} onRetry={reload} page={page} count={data?.count || 0} onPage={setPage}
        empty={<EmptyState icon={Wallet} title="No activity yet" text="Earnings appear once your approved clips collect eligible views." />} />
    </>
  );
}

/* ---------- Withdraw ---------- */
const DETAIL_FIELDS = { esewa: [["phone", "eSewa number"], ["name", "Account name"]], khalti: [["phone", "Khalti number"], ["name", "Account name"]], bank: [["bank", "Bank name"], ["account_number", "Account number"], ["name", "Account holder"]] };
/** The API stores one encrypted string and masks all but the last 3 characters, so put the account number last. */
export function formatAccount(method, d) {
  return method === "bank" ? `${d.name} · ${d.bank} · A/C ${d.account_number}` : `${d.name} · ${d.phone}`;
}
export function Withdraw() {
  const s = useSettings();
  const toast = useToast();
  const { data: w, reload: rw } = useFetch("/wallet/");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch("/withdrawals/", { page });
  const [method, setMethod] = useState(s.withdrawal_methods[0] || "esewa");
  const [amount, setAmount] = useState("");
  const [det, setDet] = useState({});
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErrs({});
    try { await post("/withdrawals/", { amount, method, account_details: formatAccount(method, det) }); toast.success("Withdrawal requested. We'll review it shortly."); setAmount(""); rw(); reload(); }
    catch (x) { setErrs(fieldErrors(x)); toast.error(errMsg(x)); } finally { setBusy(false); }
  };
  const cols = [{ key: "amount", label: "Amount", className: "tabular-nums font-semibold", render: (r) => money(r.amount) }, { key: "method_label", label: "Method" }, { key: "account_masked", label: "Account" },
    { key: "status", label: "Status", render: (r) => <><Badge status={r.status} />{r.admin_note && <p className="mt-1 text-xs text-mute">{r.admin_note}</p>}</> }, { key: "created_at", label: "Requested", render: (r) => date(r.created_at) }];
  return (
    <>
      <PageHeader title="Withdraw" subtitle={`Minimum ${money(s.min_withdrawal)}. Requests are reviewed and paid by our team.`} />
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <form onSubmit={submit} className="card h-fit space-y-4 p-5">
          <div className="rounded-xl bg-brand-soft p-4"><p className="text-xs font-semibold uppercase text-brand">Available</p><p className="font-display text-3xl font-extrabold">{money(w?.available, { decimals: 2 })}</p></div>
          <Input label="Amount (NPR)" type="number" min={s.min_withdrawal} step="1" value={amount} onChange={(e) => setAmount(e.target.value)} error={errs.amount} required />
          <Select label="Method" value={method} onChange={(e) => { setMethod(e.target.value); setDet({}); }} options={s.withdrawal_methods.map((m) => ({ value: m, label: { esewa: "eSewa", khalti: "Khalti", bank: "Bank transfer" }[m] || m }))} />
          {(DETAIL_FIELDS[method] || []).map(([k, l]) => <Input key={k} label={l} value={det[k] || ""} onChange={(e) => setDet({ ...det, [k]: e.target.value })} required />)}
          {(errs.account_details || errs.detail) && <p className="text-xs text-brand">{errs.account_details || errs.detail}</p>}
          <button className="btn btn-primary w-full" disabled={busy || !amount}>{busy && <Spinner size={14} />}Request withdrawal</button>
          <p className="text-xs text-mute">Payment details are stored encrypted and only shown masked.</p>
        </form>
        <DataTable columns={cols} rows={data?.results} loading={loading} error={error} onRetry={reload} page={page} count={data?.count || 0} onPage={setPage} empty={<EmptyState icon={Banknote} title="No withdrawals yet" />} />
      </div>
    </>
  );
}

/* ---------- Leaderboard ---------- */
export function Leaderboard() {
  const [period, setPeriod] = useState("weekly");
  const [by, setBy] = useState("score");
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch("/leaderboard/", { period });
  const rows = [...(data?.results || [])].sort((a, b) => Number(b[by]) - Number(a[by])).map((r, i) => ({ ...r, pos: i + 1 }));
  const cols = [{ key: "pos", label: "#", render: (r) => <span className={`font-display font-extrabold ${r.pos <= 3 ? "text-brand" : ""}`}>{r.pos}</span> },
    { key: "username", label: "Creator", render: (r) => <span className="font-semibold">{r.username}{r.username === user?.username && <Badge tone="brand"> You</Badge>}</span> },
    { key: "views", label: "Views", className: "tabular-nums", render: (r) => num(r.views) }, { key: "earnings", label: "Earned", className: "tabular-nums", render: (r) => money(r.earnings) },
    { key: "approved_clips", label: "Clips", className: "tabular-nums" }, { key: "score", label: "Score", className: "tabular-nums font-semibold" }];
  return (
    <>
      <PageHeader title="Leaderboard" subtitle="Top creators by views, earnings and approved clips. Only usernames are shown." />
      <div className="mb-4 flex flex-wrap gap-3"><Tabs value={period} onChange={setPeriod} tabs={[{ value: "weekly", label: "This week" }, { value: "monthly", label: "This month" }]} />
        <Tabs value={by} onChange={setBy} tabs={[{ value: "score", label: "Overall" }, { value: "views", label: "Views" }, { value: "earnings", label: "Earnings" }, { value: "approved_clips", label: "Clips" }]} /></div>
      <DataTable columns={cols} rows={rows} loading={loading} error={error} onRetry={reload} empty={<EmptyState icon={Trophy} title="No rankings yet" text="Rankings appear once clips are approved this period." />} />
    </>
  );
}

/* ---------- Referrals ---------- */
export function Referrals() {
  const { data, loading, error, reload } = useFetch("/referrals/");
  const toast = useToast();
  const copy = async () => { try { await navigator.clipboard.writeText(data.link); toast.success("Link copied"); } catch { toast.error("Couldn't copy. Select the link and copy manually."); } };
  if (error) return <ErrorState message={error} onRetry={reload} />;
  return (
    <>
      <PageHeader title="Invite a creator" subtitle={`Earn ${data?.percent ?? 10}% of the platform commission on every eligible earning your referrals make. It never reduces their pay.`} />
      <div className="card mb-6 p-5"><p className="label">Your referral link</p>
        <div className="flex flex-col gap-2 sm:flex-row"><input readOnly className="input font-mono" value={data?.link || ""} onFocus={(e) => e.target.select()} aria-label="Referral link" /><button className="btn btn-dark" onClick={copy} disabled={!data}><Copy size={16} />Copy</button></div></div>
      <div className="mb-6 grid grid-cols-2 gap-3"><StatCard label="Creators referred" value={data?.referred?.length ?? 0} loading={loading} /><StatCard label="Referral rewards" value={money(data?.total_reward, { decimals: 2 })} loading={loading} accent /></div>
      <DataTable columns={[{ key: "username", label: "Creator" }, { key: "joined", label: "Joined", render: (r) => date(r.joined) }, { key: "reward", label: "Your reward", className: "tabular-nums", render: (r) => money(r.reward, { decimals: 2 }) }]}
        rows={data?.referred} loading={loading} empty={<EmptyState title="No referrals yet" text="Share your link to start earning." />} />
    </>
  );
}

/* ---------- Connected accounts ---------- */
const BRAND_ICONS = {
  instagram: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></svg>,
  tiktok: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M15 3v11.5a4.5 4.5 0 1 1-4.5-4.5" /><path d="M15 3c.4 2.6 2.1 4.2 5 4.4" /></svg>,
  youtube: (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path fillRule="evenodd" d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z" /></svg>,
  x: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}><path d="M4 4l16 16M20 4 4 20" /></svg>,
};
function PlatformIcon({ platform, size = 18, className = "" }) {
  const Icon = BRAND_ICONS[platform];
  return Icon ? <Icon width={size} height={size} className={className} /> : <Link2 size={size} className={className} />;
}
const CONNECT_OPTIONS = [["instagram", "Instagram"], ["tiktok", "TikTok"], ["youtube", "YouTube"]];
/* position + size of each floating icon in the empty-state illustration */
const FLOATERS = [["tiktok", "left-[38%] top-0", 36], ["instagram", "right-[8%] top-[18%]", 36], ["instagram", "left-[8%] top-[28%]", 36], ["youtube", "left-[22%] bottom-[8%]", 36], ["x", "right-[14%] bottom-[14%]", 36]];

export function Accounts() {
  const s = useSettings();
  const toast = useToast();
  const { data, loading, error, reload } = useFetch("/social-accounts/");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("pick");
  const [platform, setPlatform] = useState("");
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState("");
  const [rm, setRm] = useState(null);
  const supported = s.supported_platforms || [];
  const label = (p) => PLATFORM_LABEL[p] || cap(p);

  const openModal = () => { setStep("pick"); setPlatform(""); setHandle(""); setOpen(true); };
  const closeModal = () => { if (busy !== "add") setOpen(false); };
  const pick = (p) => { if (!supported.includes(p)) return; setPlatform(p); setStep("details"); };

  const connect = async (e) => {
    e.preventDefault(); setBusy("add");
    try { await post("/social-accounts/", { platform, handle }); setOpen(false); setHandle(""); toast.success("Account found. Now verify that it's yours."); reload(); }
    catch (x) { toast.error(errMsg(x)); } finally { setBusy(""); }
  };
  const act = async (id, what) => {
    setBusy(`${what}${id}`);
    try { const r = await post(`/social-accounts/${id}/${what}/`); toast.success(what === "verify" ? "Account verified." : "Stats refreshed."); reload(); return r; } catch (x) { toast.error(errMsg(x)); } finally { setBusy(""); }
  };
  const hasAccounts = !!data?.length;

  return (
    <>
      <PageHeader title="Connected accounts" subtitle="Clips only count if they're posted from an account you've verified."
        actions={hasAccounts ? <button className="btn btn-primary" onClick={openModal}>Connect account</button> : null} />

      {loading && <div className="card p-5"><Spinner /></div>}
      {error && <ErrorState message={error} onRetry={reload} />}

      {/* Empty state */}
      {!loading && !error && !hasAccounts && (
        <div className="flex flex-col items-center px-4 py-10 text-center">
          <div className="relative mx-auto h-56 w-72 max-w-full">
            {FLOATERS.map(([p, pos, size], i) => (
              <span key={i} className={`absolute ${pos} grid place-items-center rounded-full bg-zinc-800 text-white shadow-md`} style={{ width: size, height: size }}>
                <PlatformIcon platform={p} size={16} />
              </span>
            ))}
            <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl bg-zinc-800 text-white shadow-lg"><Clapperboard size={26} /></span>
          </div>
          <p className="mt-2 max-w-xs text-sm text-mute">Connect your social media accounts to send submissions and get paid for them!</p>
          <button className="btn btn-primary mt-6 px-8" onClick={openModal}>Connect Account</button>
        </div>
      )}

      {/* Connected list */}
      {hasAccounts && (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((a) => (
            <div key={a.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-zinc-800 text-white"><PlatformIcon platform={a.platform} size={18} /></span>
                  <div>
                    <p className="text-xs font-semibold text-mute">{label(a.platform)}</p>
                    <p className="font-display text-xl font-bold">{a.handle}</p>
                  </div>
                </div>
                <Badge status={a.status}>{a.status === "connected" ? "Eligible" : a.status_label}</Badge>
              </div>
              <p className="mt-3 text-sm text-mute">Followers: {num(a.followers)} · Engagement {pct(a.avg_engagement_rate)}</p>
              {a.status !== "connected" && (
                <div className="mt-4 rounded-xl bg-sunk p-4 text-sm"><p className="font-semibold">Prove it's yours</p>
                  <p className="mt-1 text-mute">Add this code anywhere in your channel description, then press Verify. You can remove it afterwards.</p>
                  <code className="mt-2 inline-block rounded-lg bg-surface px-3 py-1.5 font-mono font-bold">{a.verification_code}</code></div>)}
              <div className="mt-4 flex flex-wrap gap-2">
                {a.status !== "connected" && <button className="btn btn-primary" disabled={!!busy} onClick={() => act(a.id, "verify")}>{busy === `verify${a.id}` ? <Spinner size={14} /> : <BadgeCheck size={16} />}Verify</button>}
                <button className="btn btn-outline" disabled={!!busy} onClick={() => act(a.id, "refresh")}><RefreshCw size={16} />Refresh stats</button>
                <button className="btn btn-ghost text-brand" onClick={() => setRm(a)}><Trash2 size={16} />Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connect modal */}
      <Modal open={open} onClose={closeModal} title="Connect Account">
        {step === "pick" && (
          <>
            <p className="mb-4 text-sm text-mute">Select a social network to link your account:</p>
            <div className="space-y-3">
              {CONNECT_OPTIONS.map(([p, name]) => {
                const live = supported.includes(p);
                return (
                  <button key={p} type="button" disabled={!live} onClick={() => pick(p)}
                    className="flex w-full items-center justify-between rounded-2xl border border-line px-4 py-4 text-left transition hover:border-ink focus-visible:border-ink focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line">
                    <span className="flex items-center gap-3 font-medium"><PlatformIcon platform={p} size={18} />{name}</span>
                    {live ? <ChevronRight size={18} className="text-mute" /> : <span className="text-xs font-semibold text-mute">Coming soon</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
        {step === "details" && (
          <form onSubmit={connect} className="space-y-4">
            <button type="button" className="flex items-center gap-2 text-sm font-semibold text-mute hover:text-brand" onClick={() => setStep("pick")}>
              <ChevronRight size={16} className="rotate-180" />Back
            </button>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-zinc-800 text-white"><PlatformIcon platform={platform} size={18} /></span>
              <p className="font-display text-lg font-bold">{label(platform)}</p>
            </div>
            <Input label="Handle or channel link" placeholder="@yourchannel" value={handle} onChange={(e) => setHandle(e.target.value)} required autoFocus />
            <button className="btn btn-primary w-full" disabled={busy === "add" || !handle}>{busy === "add" && <Spinner size={14} />}Connect</button>
            <p className="text-xs text-mute">We'll give you a short code to add to your profile so we can confirm the account is yours.</p>
          </form>
        )}
      </Modal>

      <ActionModal open={!!rm} onClose={() => setRm(null)} danger title="Remove this account?" text="Existing submissions stay, but you won't be able to submit new clips from it."
        confirmLabel="Remove" onConfirm={async () => { try { await del(`/social-accounts/${rm.id}/`); toast.success("Account removed."); setRm(null); reload(); } catch (x) { toast.error(errMsg(x)); } }} />
    </>
  );
}

/* ---------- Profile ---------- */
export function Profile() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const { data, loading } = useFetch("/creators/profile/");
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  const cur = f || (data && { ...data, niches: (data.niches || []).join(", "), phone: user?.phone || "" });
  const set = (k) => (e) => setF({ ...cur, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      await patch("/creators/profile/", { full_name: cur.full_name, bio: cur.bio, city: cur.city, niches: cur.niches.split(",").map((n) => n.trim().toLowerCase()).filter(Boolean) });
      if (cur.phone !== user.phone) await patch("/auth/me/", { phone: cur.phone });
      await refresh(); toast.success("Profile saved.");
    } catch (x) { toast.error(errMsg(x)); } finally { setBusy(false); }
  };
  if (loading || !cur) return <Spinner size={24} />;
  return (
    <>
      <PageHeader title="Profile" subtitle="Your niches help us recommend campaigns that fit." />
      <form onSubmit={save} className="card max-w-2xl space-y-4 p-5">
        <Input label="Full name" value={cur.full_name} onChange={set("full_name")} required />
        <div className="grid gap-4 sm:grid-cols-2"><Input label="City" value={cur.city} onChange={set("city")} /><Input label="Phone" value={cur.phone} onChange={set("phone")} /></div>
        <Input label="Niches" value={cur.niches} onChange={set("niches")} hint="Comma separated, e.g. gaming, comedy, food" />
        <Textarea label="Bio" value={cur.bio} onChange={set("bio")} />
        <p className="text-xs text-mute">Email {user?.email} · Username @{user?.username}</p>
        <button className="btn btn-primary" disabled={busy}>{busy && <Spinner size={14} />}Save changes</button>
      </form>
    </>
  );
}

/* ---------- Support chat ---------- */
export function Support() {
  return (
    <>
      <PageHeader title="Support chat" subtitle="Message the NepClip team about payouts, clips or your account. You can send photos and screenshots too." />
      <div className="card overflow-hidden"><SupportChat url="/support/chat/" /></div>
    </>
  );
}