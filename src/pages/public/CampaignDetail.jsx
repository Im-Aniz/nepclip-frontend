import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, BarChart3, CalendarDays, CheckCircle2, ChevronLeft, Eye, Facebook, FileText, Instagram, LayoutGrid, Link2, Lock, ShieldCheck, Users, Youtube } from "lucide-react";
import { BrandMark, paymentLabel } from "../../components/CampaignCard";
import { ErrorState, Input, Modal, Skeleton, Spinner, Textarea, Check } from "../../components/ui";
import useFetch from "../../hooks/useFetch";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { post } from "../../services/api";
import { compact, date, daysLeft, errMsg, fieldErrors, money, num, pct, PLATFORM_LABEL } from "../../utils/format";

// true = rules and reference files stay locked (skeleton bars) until the creator joins. false = always visible.
const LOCK_RULES = true;

const TYPE_LABEL = { view: "Per view", fixed: "Fixed", hybrid: "Hybrid" };

const TikTokIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);
const XIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.215 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const PLATFORM_ICON = { facebook: Facebook, instagram: Instagram, tiktok: TikTokIcon, youtube: Youtube, x: XIcon, twitter: XIcon };
const PlatformIcon = ({ p, size = 16 }) => {
  const I = PLATFORM_ICON[p];
  return I ? <I size={size} /> : <span className="text-[10px] font-bold uppercase">{String(p).slice(0, 2)}</span>;
};

const Pill = ({ icon: Icon, children, className = "" }) => (
  <span className={`inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold ${className}`}>{Icon && <Icon size={16} />}{children}</span>
);

const Panel = ({ icon: Icon, title, aside, children, className = "" }) => (
  <section className={`card overflow-hidden ${className}`}>
    <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
      <h2 className="flex items-center gap-2.5 font-semibold">{Icon && <span className="text-mute"><Icon size={16} /></span>}{title}</h2>
      {aside && <div className="flex items-center gap-2 text-sm text-mute">{aside}</div>}
    </header>
    {children}
  </section>
);

const Row = ({ k, v }) => v ? <div className="flex justify-between gap-4 border-b border-line py-2.5 text-sm last:border-0"><dt className="text-mute">{k}</dt><dd className="text-right font-semibold">{v}</dd></div> : null;

export function ruleRows(r) {
  if (!r) return [];
  return [
    ["Minimum followers", r.min_followers ? num(r.min_followers) : null], ["Maximum followers", r.max_followers ? num(r.max_followers) : null],
    ["Minimum engagement", Number(r.min_engagement_rate) ? pct(r.min_engagement_rate) : null], ["Account age", r.account_age_days ? `${r.account_age_days}+ days` : null],
    ["Countries", r.countries?.join(", ")], ["Verified account", r.require_verified ? "Required" : null],
    ["Video length", r.min_duration_seconds || r.max_duration_seconds ? `${r.min_duration_seconds || 0}s${r.max_duration_seconds ? ` – ${r.max_duration_seconds}s` : "+"}` : null],
    ["Aspect ratio", r.aspect_ratio], ["Required hashtags", r.required_hashtags?.join(" ")], ["Required mentions", r.required_mentions?.join(" ")],
    ["Required sound", r.required_sound], ["Required caption", r.required_caption], ["Logo", r.requires_logo ? "Must be visible" : null], ["Template", r.required_template],
    ["Allowed niches", r.allowed_niches?.join(", ")], ["Not allowed", [...(r.prohibited_niches || []), ...(r.prohibited_keywords || [])].join(", ")],
    ["Original content", r.originality_required ? "Required" : null], ["Watermarks", r.watermark_rules], ["AI-generated content", r.ai_content_rule],
  ].filter(([, v]) => v);
}

export function RuleList({ r }) {
  const rows = ruleRows(r);
  if (!rows.length) return null;
  return <dl>{rows.map(([k, v]) => <Row key={k} k={k} v={v} />)}</dl>;
}

function JoinModal({ c, open, onClose, onJoined }) {
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const join = async () => {
    setBusy(true);
    try { await post(`/campaigns/${c.id}/join/`, { accept_rules: true }); toast.success("You've joined the campaign."); onJoined(); onClose(); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Review the campaign rules" wide
      footer={<><button className="btn btn-outline" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!ok || busy} onClick={join}>{busy && <Spinner size={14} />}Join campaign</button></>}>
      <p className="mb-3 text-sm text-mute">Clips that break these rules can be rejected and won't earn.</p>
      <RuleList r={c.rules} />
      <div className="mt-4 rounded-xl bg-sunk p-3"><Check checked={ok} onChange={(e) => setOk(e.target.checked)} label="I've read and accept these campaign rules" /></div>
    </Modal>
  );
}

function SubmitForm({ c, onDone }) {
  const [f, setF] = useState({ platform: c.platforms?.[0] || "youtube", url: "", caption: "", notes: "" });
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const go = async (e) => {
    e.preventDefault(); setBusy(true); setErrs({});
    try { await post(`/campaigns/${c.id}/submit/`, f); toast.success("Clip submitted. We're checking it now."); setF({ ...f, url: "", caption: "", notes: "" }); onDone?.(); }
    catch (err) { setErrs(fieldErrors(err)); toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={go} className="space-y-3" noValidate>
      <Input label="Post URL" placeholder="https://www.youtube.com/shorts/…" value={f.url} onChange={set("url")} error={errs.url || errs.detail} required />
      <Textarea label="Notes (optional)" value={f.notes} onChange={set("notes")} error={errs.notes} />
      <button className="btn btn-primary w-full" disabled={busy || !f.url}>{busy ? <Spinner size={16} /> : <Link2 size={16} />}Submit clip</button>
      <p className="text-xs text-mute">The post must be on a social account you've connected and verified on NepClip.</p>
    </form>
  );
}

const LockedBars = () => (
  <div className="space-y-3 bg-sunk/60 px-5 py-6" aria-hidden="true">
    {["w-[68%]", "w-[55%]", "w-[62%]"].map((w) => <div key={w} className={`h-2.5 rounded-full bg-line ${w}`} />)}
  </div>
);

const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

export default function CampaignDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { data: c, loading, error, reload } = useFetch(`/campaigns/${id}/`);
  const isCreator = user?.role === "creator";
  const { data: elig } = useFetch(isCreator && c && !c.joined ? `/campaigns/${id}/eligibility/` : null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [more, setMore] = useState(false);

  if (error) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorState message={error} onRetry={reload} /></div>;
  if (loading || !c) return <div className="mx-auto max-w-5xl space-y-4 px-4 py-10"><Skeleton className="h-10 w-40" /><Skeleton className="h-96" /><Skeleton className="h-24" /></div>;

  const dl = daysLeft(c.end_date);
  const left = Number(c.remaining_budget), budget = Number(c.budget);
  const spent = Math.max(0, budget - left);
  const usedPct = budget ? Math.min(100, (spent / budget) * 100) : 0;
  const open = c.is_open && c.status === "published";
  const cover = c.cover_image || c.banner_url || c.banner; // adjust to your API's image field
  const longDesc = (c.description || "").length > 150;

  const nRules = ruleRows(c.rules).length;
  const nFiles = c.source_url ? 1 : 0;
  const unlock = [nRules && plural(nRules, "rule"), nFiles && plural(nFiles, "file")].filter(Boolean).join(" and ");
  const canSee = c.joined || !LOCK_RULES || (user && !isCreator);

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); toast.success("Link copied."); }
    catch { toast.error("Couldn't copy the link."); }
  };

  const joinButton = (label = "Join Campaign") => {
    if (!user) return <Link to="/register" className="btn btn-primary !rounded-full !px-6">{label}</Link>;
    if (!isCreator || !open) return null;
    if (c.joined) return <span className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-bold text-flag-green"><CheckCircle2 size={16} />Joined</span>;
    return <button className="btn btn-primary !rounded-full !px-6" disabled={!elig?.eligible} onClick={() => setJoinOpen(true)}>{label}</button>;
  };

  const statusLabel = open ? "Accepting clips" : c.status === "published" ? "Closed" : <span className="capitalize">{c.status}</span>;
  const showBar = !c.joined && open && (!user || isCreator);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-6">
      <button onClick={() => nav(-1)} className="btn btn-ghost mb-4 !rounded-full bg-sunk !px-4"><ChevronLeft size={16} />Back</button>

      {/* Banner */}
      <div className="relative flex h-[26rem] items-end overflow-hidden rounded-2xl bg-ink sm:h-[24rem]"
        style={cover ? { background: `url(${cover}) center/cover` } : { background: "linear-gradient(135deg, rgb(var(--brand) / .85), #17171c)" }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
        <button onClick={copyLink} aria-label="Copy campaign link" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white text-black shadow transition hover:scale-105"><Link2 size={18} /></button>
        <div className="relative flex w-full flex-col gap-5 p-5 text-white sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <div className="min-w-0 sm:max-w-[55%]">
            <span className="mb-3 inline-flex items-center gap-2 rounded-xl bg-black/50 py-1.5 pl-1.5 pr-3 text-sm font-semibold backdrop-blur"><BrandMark c={c} size={28} />{c.brand_name}</span>
            <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">{c.name}</h1>
          </div>
          {c.description && (
            <div className="text-sm text-white/80 sm:max-w-sm">
              <p className={`whitespace-pre-line ${more ? "max-h-40 overflow-y-auto" : ""}`}
                style={more ? undefined : { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.description}</p>
              {longDesc && <button onClick={() => setMore(!more)} className="mt-1 font-semibold text-white">{more ? "Show less" : "Show more"}</button>}
            </div>
          )}
        </div>
      </div>

      {/* Pills + join */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Pill icon={open ? Eye : AlertCircle}>{statusLabel}</Pill>
        {c.platforms?.map((p) => <span key={p} title={PLATFORM_LABEL[p] || p} className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface"><PlatformIcon p={p} /></span>)}
        {c.category && <Pill icon={LayoutGrid}><span className="capitalize">{c.category}</span></Pill>}
        <Pill icon={Users}>{num(c.creators_count)}</Pill>
        <Pill icon={Eye} className="text-brand">{TYPE_LABEL[c.campaign_type] || c.campaign_type}</Pill>
        <div className="ml-auto flex items-center gap-3">
          {user && !isCreator && <p className="text-sm text-mute">Only creator accounts can join campaigns.</p>}
          {joinButton()}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {isCreator && open && !c.joined && elig && !elig.eligible && (
          <div className="rounded-2xl border border-line bg-brand-soft p-4 text-sm">
            <p className="mb-1 font-bold text-brand">You don't qualify yet</p>
            <ul className="list-disc space-y-0.5 pl-5">{elig.reasons?.map((r) => <li key={r}>{r}</li>)}</ul>
            <Link to="/creator/accounts" className="mt-2 inline-block font-semibold text-brand">Connect or verify an account</Link>
          </div>
        )}

        {isCreator && open && c.joined && (
          <Panel icon={Link2} title="Submit a clip">
            <div className="p-5">
              {c.rules?.required_hashtags?.length > 0 && <p className="mb-3 rounded-xl bg-sunk px-3 py-2 text-sm"><b>Don't forget:</b> {c.rules.required_hashtags.join(" ")}</p>}
              <SubmitForm c={c} onDone={() => nav("/creator/submissions")} />
            </div>
          </Panel>
        )}

        {/* Payout per platform */}
        <div className="grid gap-4 sm:grid-cols-2">
          {c.platforms?.map((p) => (
            <section key={p} className="card overflow-hidden">
              <h2 className="flex items-center gap-2.5 border-b border-line px-5 py-4 font-semibold"><span className="text-mute"><PlatformIcon p={p} /></span>{PLATFORM_LABEL[p] || p}</h2>
              <dl className="grid grid-cols-3 divide-x divide-line">
                {[
                  ["Per 1K views", c.rpm ? money(c.rpm) : paymentLabel(c)],
                  ["Min views", c.min_views ? num(c.min_views) : "None"],
                  ["Max per post", c.max_payout_per_post ? money(c.max_payout_per_post) : "No cap"],
                ].map(([k, v]) => <div key={k} className="px-5 py-4"><dt className="text-xs text-mute">{k}</dt><dd className="mt-3 text-lg font-semibold tabular-nums">{v}</dd></div>)}
              </dl>
            </section>
          ))}
        </div>

        {/* Budget */}
        <Panel icon={BarChart3} title="Budget">
          <div className="px-5 py-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display text-2xl font-bold tabular-nums">{money(spent)}</p>
              <p className="text-mute">{money(left)} remaining</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-sunk"><div className="h-full rounded-full bg-flag-green" style={{ width: `${usedPct}%` }} /></div>
          </div>
          <p className="border-t border-line px-5 py-4 text-sm text-mute">
            {left <= 0 ? "The budget has been fully used." : <><b className="text-flag-green">{money(left)}</b>{usedPct < 70 ? " still up for grabs, plenty of room to join." : " left. Join soon before the budget runs out."}</>}
          </p>
        </Panel>

        {/* Campaign details */}
        <Panel icon={CalendarDays} title="Campaign details">
          <dl className="px-5 py-2">
            <Row k="Objective" v={c.objective} />
            <Row k="Starts" v={date(c.start_date)} />
            <Row k="Ends" v={`${date(c.end_date)}${dl > 0 ? ` (${dl} days left)` : ""}`} />
            <Row k="Submission deadline" v={date(c.submission_deadline)} />
            <Row k="Post must stay up for" v={c.min_post_lifetime_days ? `${c.min_post_lifetime_days} days` : null} />
            <Row k="Max submissions per creator" v={c.max_submissions_per_creator} />
            <Row k="Max earnings per creator" v={c.max_payout_per_creator ? money(c.max_payout_per_creator) : null} />
            <Row k="Max eligible views per post" v={c.max_eligible_views ? num(c.max_eligible_views) : null} />
            {c.campaign_type === "hybrid" && c.bonus_threshold_views && <Row k="Bonus" v={`${money(c.bonus_amount)} after ${compact(c.bonus_threshold_views)} views`} />}
          </dl>
        </Panel>

        {/* Reference materials */}
        {nFiles > 0 && (
          <Panel icon={FileText} title="Reference materials" aside={<>{plural(nFiles, "file")}{!canSee && <span className="text-ink"><Lock size={14} /></span>}</>}>
            {canSee ? (
              <div className="p-5"><a href={c.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-semibold text-brand">Open source content<Link2 size={14} /></a></div>
            ) : <LockedBars />}
          </Panel>
        )}

        {/* Content requirements */}
        {nRules > 0 && (
          <Panel icon={ShieldCheck} title="Content requirements" aside={<>{plural(nRules, "rule")}{!canSee && <span className="text-ink"><Lock size={14} /></span>}</>}>
            {canSee ? <div className="px-5 py-2"><RuleList r={c.rules} /></div> : <LockedBars />}
          </Panel>
        )}

        {/* Unlock bar */}
        {showBar && (
          <div className="card sticky bottom-4 z-30 flex flex-wrap items-center justify-between gap-3 px-5 py-4 shadow-xl">
            <p className="flex items-center gap-3 font-semibold"><Lock size={16} />{unlock ? `Join to unlock ${unlock}` : "Join to start submitting clips"}</p>
            <div className="flex items-center gap-3">
              {!user && <Link to="/login" state={{ from: `/campaign/${c.id}` }} className="text-sm font-semibold text-brand">Log in</Link>}
              {user && elig?.eligible && <span className="hidden items-center gap-1.5 text-sm font-semibold text-flag-green sm:inline-flex"><CheckCircle2 size={16} />You meet the requirements</span>}
              {user ? joinButton("Join now") : <Link to="/register" className="btn btn-primary !rounded-full !px-6">Create a creator account</Link>}
            </div>
          </div>
        )}
      </div>

      <JoinModal c={c} open={joinOpen} onClose={() => setJoinOpen(false)} onJoined={reload} />
    </div>
  );
}
