import { Link } from "react-router-dom";
import { CalendarClock, Users } from "lucide-react";
import { Badge } from "./ui";
import { compact, daysLeft, money, num, PLATFORM_LABEL } from "../utils/format";

export function paymentLabel(c) {
  if (c.campaign_type === "fixed") return `${money(c.fixed_reward)} per approved clip`;
  if (c.campaign_type === "hybrid") return `${money(c.base_reward)} base + ${money(c.rpm)} / 1,000 views`;
  return `${money(c.rpm)} / 1,000 views`;
}

export function BrandMark({ c, size = 44 }) {
  return c.brand_logo || c.logo
    ? <img src={c.logo || c.brand_logo} alt="" style={{ width: size, height: size }} className="rounded-xl object-cover" />
    : <span style={{ width: size, height: size }} className="grid shrink-0 place-items-center rounded-xl bg-ink font-display text-lg font-extrabold text-bg">{(c.brand_name || "?")[0]}</span>;
}

export default function CampaignCard({ c, to = `/campaign/${c.id}` }) {
  const budget = Number(c.budget), left = Number(c.remaining_budget);
  const usedPct = budget ? Math.min(100, Math.round(((budget - left) / budget) * 100)) : 0;
  const dl = daysLeft(c.end_date);
  return (
    <Link to={to} className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-brand/40">
      <div className="flex items-start gap-3">
        <BrandMark c={c} />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base font-bold leading-snug">{c.name}</h3>
          <p className="text-sm text-mute">{c.brand_name}</p>
        </div>
        {c.joined ? <Badge tone="green">Joined</Badge> : c.status !== "published" && <Badge status={c.status} />}
      </div>
      <div className="mt-4 rounded-xl bg-brand-soft px-3.5 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">{c.campaign_type} campaign</p>
        <p className="font-display text-xl font-extrabold leading-tight">{paymentLabel(c)}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {(c.platforms || []).map((p) => <span key={p} className="rounded-md bg-sunk px-2 py-0.5 text-xs font-semibold">{PLATFORM_LABEL[p] || p}</span>)}
        {c.category && <span className="rounded-md bg-sunk px-2 py-0.5 text-xs font-semibold capitalize">{c.category}</span>}
      </div>
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-mute"><span>{money(left)} left</span><span>of {money(budget)}</span></div>
        <div className="h-1.5 overflow-hidden rounded-full bg-sunk" role="progressbar" aria-valuenow={usedPct} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-brand" style={{ width: `${usedPct}%` }} /></div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-mute">
        <span className="inline-flex items-center gap-1"><Users size={13} />{num(c.creators_count)} creators · {c.rules?.min_followers ? `${compact(c.rules.min_followers)}+ followers` : "Open to all"}</span>
        <span className="inline-flex items-center gap-1"><CalendarClock size={13} />{dl == null ? "—" : dl < 0 ? "Ended" : dl === 0 ? "Last day" : `${dl}d left`}</span>
      </div>
    </Link>
  );
}

export function CampaignCardSkeleton() {
  return <div className="card space-y-4 p-5"><div className="flex gap-3"><div className="skeleton h-11 w-11" /><div className="flex-1 space-y-2"><div className="skeleton h-4 w-3/4" /><div className="skeleton h-3 w-1/3" /></div></div><div className="skeleton h-16 w-full" /><div className="skeleton h-3 w-full" /></div>;
}
