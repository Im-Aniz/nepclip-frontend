import { Link } from "react-router-dom";
import { Check, ChevronDown, Clapperboard, Eye, Heart, Link2, Play, ShieldCheck, User, Wallet, XCircle } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { money } from "../../utils/format";
import { TERMS, TERMS_META, TERMS_NOTICE } from "./creatorTerms";
import { BRAND_TERMS, BRAND_TERMS_META, BRAND_TERMS_NOTICE } from "./brandTerms";

const Hero = ({ kicker, title, text, children }) => (
  <section className="border-b border-line bg-surface"><div className="mx-auto max-w-4xl px-4 py-16 text-center">
    <p className="label !text-brand">{kicker}</p><h1 className="text-4xl font-extrabold sm:text-5xl">{title}</h1>
    <p className="mx-auto mt-4 max-w-2xl text-lg text-mute">{text}</p><div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div></div></section>
);
const Section = ({ title, children }) => <section className="mx-auto max-w-4xl px-4 py-12">{title && <h2 className="mb-6 text-2xl font-extrabold">{title}</h2>}{children}</section>;
const Points = ({ items }) => <ul className="grid gap-3 sm:grid-cols-2">{items.map(([t, d]) => <li key={t} className="card flex gap-3 p-4"><Check className="mt-0.5 shrink-0 text-flag-green" size={18} /><div><p className="font-bold">{t}</p><p className="text-sm text-mute">{d}</p></div></li>)}</ul>;


/* ---------- Creator terms (content lives in ./creatorTerms.js) ---------- */
/** Renders **bold** segments inside a string. */
const Rich = ({ text }) => text.split(/(\*\*.+?\*\*)/g).map((part, i) =>
  part.startsWith("**") ? <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong> : part);

function TermsBlock({ block }) {
  if (Array.isArray(block)) return <ul className="ml-5 list-disc space-y-1.5 text-sm text-mute">{block.map((li) => <li key={li}><Rich text={li} /></li>)}</ul>;
  if (block.startsWith("### ")) return <h4 className="pt-2 font-bold">{block.slice(4)}</h4>;
  return <p className="text-sm leading-relaxed text-mute"><Rich text={block} /></p>;
}

/** Collapsible terms. `sections` is [[title, ...blocks]]; `id` lets you link to #id. */
function TermsAccordion({ id, meta, notice, sections }) {
  return (
    <div id={id} className="scroll-mt-24">
      <p className="mb-4 text-sm text-mute">Effective date: {meta.effective} · Last updated: {meta.updated}</p>
      <div className="card mb-3 space-y-2 p-5">
        <p className="flex items-center gap-2 font-bold"><ShieldCheck size={18} className="text-brand" />Important notice</p>
        {notice.map((p) => <p key={p} className="text-sm leading-relaxed text-mute">{p}</p>)}
      </div>
      <div className="space-y-3">
        {sections.map(([title, ...blocks], i) => (
          <details key={title} className="card group" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-bold [&::-webkit-details-marker]:hidden">
              {title}<ChevronDown size={18} className="shrink-0 text-mute transition group-open:rotate-180" />
            </summary>
            <div className="space-y-3 border-t border-line px-4 pb-5 pt-4">{blocks.map((b, j) => <TermsBlock key={j} block={b} />)}</div>
          </details>
        ))}
      </div>
    </div>
  );
}
const CreatorTerms = () => <TermsAccordion id="terms" meta={TERMS_META} notice={TERMS_NOTICE} sections={TERMS} />;
const BrandTerms = () => <TermsAccordion id="terms" meta={BRAND_TERMS_META} notice={BRAND_TERMS_NOTICE} sections={BRAND_TERMS} />;

export function ForCreators() {
  const s = useSettings();
  return (<>
    <Hero kicker="For creators" title="Get paid for clips you were going to make anyway" text="Join campaigns from Nepali brands, post clips on your own channel, and earn from every eligible view.">
      <Link to="/register" className="btn btn-primary">Start clipping</Link><Link to="/campaigns" className="btn btn-outline">Browse campaigns</Link></Hero>
    <Section title="What you get"><Points items={[
      ["Clear pay rates", "Each campaign shows its rate per 1,000 views, caps and minimums before you join."],
      ["Your channel, your audience", "Post on your own YouTube channel. We verify ownership so nobody can claim your clips."],
      ["Live earnings", "Views are refreshed on a schedule and your wallet updates as eligible views grow."],
      ["Local payouts", `Withdraw from ${money(s.min_withdrawal)} via eSewa, Khalti or bank transfer.`],
      ["Referral income", `Invite creators and earn ${s.referral_percent}% of the platform commission on their earnings.`],
      ["Weekly & monthly leaderboards", "Climb the rankings by views, earnings and approved clips."]]} /></Section>
    <Section title="Key terms at a glance"><Points items={[
      ["16 and over", "Creators must be at least 16. Creators aged 16 or 17 may need extra consent and verification under Nepalese law."],
      ["Admin-reviewed rewards", "Our admin team reviews submissions and approves eligible rewards. A view count alone is not a right to payment."],
      ["Eligible views are what pay", "Public view counts can differ because of location rules, campaign caps, reporting delays or fraud checks."],
      ["No view manipulation", "No bought views, bots, click farms or duplicate posts. Suspicious rewards may be held while we investigate."],
      ["No guaranteed earnings", "Earnings depend on campaign availability, budgets, verified performance and approval."],
      ["Manual payouts in NPR", "Withdrawals are processed by our admin team. A request is not a completed payment until it is confirmed."],
      ["You keep your content", "You own what you create and give NepClip a limited license to host and review it. Brand reuse needs campaign rules or a separate agreement."],
      ["Fair review", "Rejections come with a reason where practicable, and you can ask support to review a disputed decision."]]} /></Section>
    <Section title="Creator Terms and Conditions"><CreatorTerms /></Section></>);
}
export function ForBrands() {
  const s = useSettings();
  return (<>
    <Hero kicker="For brands" title="Reach Nepal's audiences with clips that creators want to make" text="Share your content, set a budget and rate, and pay only for performance. Every campaign is reviewed before it goes live.">
      <Link to="/launch-campaign" className="btn btn-primary">Launch a campaign</Link><Link to="/contact" className="btn btn-outline">Talk to our team</Link></Hero>
    <Section title="Why brands use NepClip"><Points items={[
      ["Pay on performance", "Set an RPM and a hard budget. Spend can't exceed what you allocate."],
      ["Control the rules", "Required hashtags, mentions, duration, niches, minimum followers and more."],
      ["Review before publish", "Our team checks every campaign. You can also approve individual clips."],
      ["Live analytics", "Views, eligible views, payouts and platform fee on one dashboard."],
      ["Anti-fraud checks", "Suspicious spikes and duplicate posts are flagged before they're paid."],
      ["Done-for-you option", `Prefer a hand? Our team will build and run the campaign. Platform fee ${s.platform_commission_percent}%.`]]} /></Section>
    <Section title="Key terms at a glance"><Points items={[
      ["18 and over, with authority", "You must be 18 or older. If you act for a company or agency, you confirm you can bind it to these terms."],
      ["Fund before you launch", "A campaign isn't treated as funded just because you started a transfer. Funding depends on confirmed payment."],
      ["Rewards follow eligible views", "Creators are paid for views that pass our verification and fraud checks, which can differ from the public view count."],
      ["No guaranteed results", "We don't guarantee a number of creators, views, sales or return on ad spend."],
      ["Refunds are reviewed", "A refund isn't automatic because a campaign got fewer views than expected. We review remaining funds, valid rewards and fees first."],
      ["Creators keep their content", "Funding a campaign doesn't transfer ownership. Reposting or paid ads need authorization from the creator or the campaign."],
      ["Honest advertising", "No fake testimonials or hidden sponsorships. You must explain required disclosures in your campaign instructions."],
      ["Disputes with evidence", "If you think views or rewards are wrong, send an explanation and proof to support and we'll investigate."]]} /></Section>
    <Section title="Brand Terms of Use"><BrandTerms /></Section></>);
}
export function HowItWorks() {
  const steps = [["Brand launches a campaign", "Budget, rate, rules and source content. Admin reviews and publishes it."], ["Creator joins", "Connect and verify a YouTube channel, check eligibility, accept the rules."],
    ["Creator posts and submits", "We validate the link, platform, ownership and campaign rules."], ["Views are tracked", "Snapshots are stored on a schedule. History is never overwritten."],
    ["Rewards are calculated", "Eligible views → caps → fraud check → budget check → final reward."], ["Wallet and withdrawal", "Earnings land in the wallet. Withdrawals are reviewed and paid by our team."]];
  return (<><Hero kicker="How it works" title="From clip to cash, step by step" text="No black boxes. Here's exactly what happens to every clip." />
    <Section><ol className="space-y-3">{steps.map(([t, d], i) => <li key={t} className="card flex gap-4 p-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand font-display font-extrabold text-brand-ink">{i + 1}</span><div><p className="font-bold">{t}</p><p className="text-sm text-mute">{d}</p></div></li>)}</ol></Section></>);
}
export function Pricing() {
  const s = useSettings();
  const fee = Number(s.platform_commission_percent), b = 100000;
  return (<><Hero kicker="Pricing" title="Free to join. We earn when you do." text="Brands fund a campaign budget. A platform fee is taken from that budget; the rest goes to creators as they earn." />
    <Section><div className="grid gap-4 sm:grid-cols-2">
      <div className="card p-6"><p className="label">Creators</p><p className="font-display text-4xl font-extrabold">Free</p><p className="mt-2 text-sm text-mute">No sign-up fee. Minimum withdrawal {money(s.min_withdrawal)}.</p></div>
      <div className="card border-brand p-6"><p className="label !text-brand">Brands</p><p className="font-display text-4xl font-extrabold">{fee}% platform fee</p><p className="mt-2 text-sm text-mute">Minimum campaign budget {money(s.min_campaign_budget)}.</p></div></div>
      <div className="card mt-6 p-6"><p className="font-bold">Example: a {money(b)} campaign</p>
        <dl className="mt-3 grid grid-cols-3 gap-3 text-center"><div className="rounded-xl bg-sunk p-3"><dt className="text-xs text-mute">Budget</dt><dd className="font-display text-xl font-bold">{money(b)}</dd></div>
          <div className="rounded-xl bg-sunk p-3"><dt className="text-xs text-mute">Creator payouts</dt><dd className="font-display text-xl font-bold">{money(b * (1 - fee / 100))}</dd></div>
          <div className="rounded-xl bg-sunk p-3"><dt className="text-xs text-mute">Platform fee</dt><dd className="font-display text-xl font-bold">{money(b * fee / 100)}</dd></div></dl>
        <p className="mt-3 text-xs text-mute">The fee percentage is set by platform admins and locked per campaign when it's approved.</p></div></Section></>);
}

/* ================= About ================= */

/** Gradient "phone" thumbnail used as a stand-in for clips. Sized by its parent width (9:16). */
const PHONE_TINTS = ["from-violet-400 to-sky-400", "from-teal-400 to-cyan-400", "from-pink-400 to-orange-400", "from-lime-400 to-teal-400", "from-indigo-400 to-fuchsia-400", "from-rose-400 to-amber-300"];
function Phone({ tint = 0, className = "" }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br shadow-lg ${PHONE_TINTS[tint % PHONE_TINTS.length]} ${className}`} style={{ aspectRatio: "9 / 16" }}>
      <span className="absolute left-1/2 top-1/2 grid h-[28%] w-[56%] -translate-x-1/2 -translate-y-1/2 place-items-center"><Play className="h-full w-full fill-white text-white opacity-90" /></span>
      <span className="absolute inset-x-[14%] bottom-[9%] h-[5%] rounded-full bg-white/70" />
    </div>
  );
}
const Chip = ({ className = "", green, children }) => (
  <span className={`absolute z-10 flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-md sm:gap-1.5 sm:px-3 sm:py-1 sm:text-sm ${green ? "bg-flag-green text-white" : "bg-surface"} ${className}`}>{children}</span>
);

function HeroVisual() {
  /* Cards sit on a 1000x380 grid so the curves below always meet their edges. */
  const cards = [["left-[2%] top-[20%] w-[12%]", 0], ["left-[17%] top-0 w-[10%]", 1], ["left-[15%] top-[52%] w-[10%]", 2],
    ["right-[2%] top-[20%] w-[12%]", 3], ["right-[17%] top-0 w-[10%]", 4], ["right-[15%] top-[52%] w-[10%]", 5]];
  const lines = ["M140 182 C300 182 380 190 460 190", "M270 89 C360 89 400 190 460 190", "M250 287 C350 287 400 190 460 190",
    "M860 182 C700 182 620 190 540 190", "M730 89 C640 89 600 190 540 190", "M750 287 C650 287 600 190 540 190"];
  return (
    <div className="relative mx-auto mt-12 w-full max-w-5xl" style={{ aspectRatio: "1000 / 380" }} aria-hidden="true">
      <svg viewBox="0 0 1000 380" className="absolute inset-0 h-full w-full text-brand" fill="none">
        {lines.map((d) => <path key={d} d={d} stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />)}
      </svg>
      {cards.map(([pos, tint]) => <Phone key={pos} tint={tint} className={`absolute ${pos}`} />)}
      <Chip className="left-[8%] top-[22%]"><Eye className="text-brand" size={14} />Views tracked</Chip>
      <Chip className="left-[19%] top-[40%]"><Heart className="text-brand" size={14} />Likes counted</Chip>
      <Chip green className="right-[14%] top-[44%]"><Wallet size={14} />Paid to wallet</Chip>
      <span className="absolute left-1/2 top-1/2 grid w-[20%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[28%] bg-brand-soft" style={{ aspectRatio: "1" }}>
        <span className="grid w-[72%] place-items-center rounded-[28%] bg-brand/15" style={{ aspectRatio: "1" }}>
          <span className="grid w-[72%] place-items-center rounded-[28%] bg-brand text-brand-ink shadow-lg" style={{ aspectRatio: "1" }}><Clapperboard className="h-1/2 w-1/2" /></span>
        </span>
      </span>
    </div>
  );
}

function StepCard({ title, text, children }) {
  return (
    <article className="card p-4 sm:p-5">
      <div className="grid h-60 place-items-center overflow-hidden rounded-2xl bg-violet-100/70 dark:bg-violet-500/10">{children}</div>
      <h3 className="mt-5 font-display text-2xl font-extrabold">{title}</h3>
      <p className="mt-2 text-mute">{text}</p>
    </article>
  );
}
const Field = ({ label }) => (<><p className="mt-3 text-left text-xs font-medium">{label}</p><div className="mt-1 rounded-lg border border-line px-2 py-1.5 text-left text-xs text-mute">Rs</div></>);

function SparkLine({ className = "" }) {
  const pts = "0,40 20,34 40,38 60,22 80,26 100,12 120,20 140,6";
  return (
    <svg viewBox="0 0 140 48" className={className} fill="none" preserveAspectRatio="none">
      <polygon points={`${pts} 140,48 0,48`} className="fill-brand/10" />
      <polyline points={pts} className="stroke-brand" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function HowSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-center text-4xl font-extrabold tracking-tight sm:text-5xl">How it works</h2>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        <StepCard title="Create your campaign" text="Set your budget and rate, explain what content you want, and go live once we've reviewed it.">
          <div className="w-56 rounded-2xl bg-surface p-3 shadow-md">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-zinc-800 text-white"><Clapperboard size={16} /></span>
              <div className="text-left"><p className="text-sm font-semibold">Your brand</p><p className="text-xs text-mute">New campaign</p></div>
            </div>
            <Field label="Rate per 1,000 views" />
            <Field label="Total budget" />
            <div className="mt-3 rounded-lg bg-brand py-1.5 text-center text-xs font-semibold text-brand-ink">Launch campaign</div>
          </div>
        </StepCard>

        <StepCard title="Creators join and post" text="Creators with a verified channel read your brief, accept the rules and start posting.">
          <div className="relative flex items-center gap-2">
            <Phone tint={0} className="w-16" />
            <Phone tint={1} className="w-24 -translate-y-2" />
            <Phone tint={2} className="w-16" />
            <Chip className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"><Eye className="text-brand" size={14} />Views counted</Chip>
          </div>
        </StepCard>

        <StepCard title="See your results" text="NepClip handles submissions, checks, approvals and creator payouts.">
          <div className="w-60 rounded-2xl bg-surface p-3 shadow-md">
            <div className="flex items-center justify-between"><p className="text-sm font-semibold">Results</p><span className="rounded-full border border-flag-green px-2 text-[10px] font-semibold text-flag-green">Sample data</span></div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-left">
              <div className="rounded-lg border border-line p-2"><p className="text-[10px] text-mute">Views delivered</p><p className="font-display text-lg font-bold">8.4M</p></div>
              <div className="rounded-lg border border-line p-2"><p className="text-[10px] text-mute">Total posts</p><p className="font-display text-lg font-bold">320</p></div>
            </div>
            <div className="mt-2 rounded-lg border border-line p-2"><SparkLine className="h-14 w-full" /></div>
          </div>
        </StepCard>
      </div>
    </section>
  );
}

function TrustSection() {
  const stages = [
    ["Submitted", "A creator posts to your campaign and submits the link."],
    ["Checked", "We validate the link, platform, channel ownership and campaign rules."],
    ["Re-checked", "Views are snapshotted on a schedule. History is never overwritten."],
    ["Decided", "Clear clips are approved, unusual ones go to a person, bad ones are rejected."],
  ];
  const connector = <span className="hidden h-px flex-1 border-t-2 border-dotted border-brand/40 md:block" />;
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-center text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">Every view is checked.<br />Only <span className="text-brand">real</span> ones get paid.</h2>
      <p className="mx-auto mt-5 max-w-2xl text-center text-lg text-mute">Every clip is checked when it's submitted, then again as views come in. Anything suspicious is stopped before it reaches your budget.</p>

      <div className="card mt-12 p-5 sm:p-8">
        <div className="flex flex-col items-center gap-8 md:flex-row md:gap-4">
          {/* submission */}
          <div className="w-60 shrink-0 rounded-2xl bg-surface p-4 shadow-md">
            <p className="flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-brand" />New submission</p>
            <p className="mt-3 flex items-center gap-2 text-sm"><span className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-400 to-sky-400" />@yourchannel <span className="text-xs text-mute">just now</span></p>
            <p className="mt-3 flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs"><Link2 size={14} />Post link added</p>
          </div>
          {connector}
          {/* checks */}
          <div className="relative mx-auto h-52 w-64 shrink-0">
            <span className="absolute inset-0 m-auto h-44 w-44 rounded-full border border-line" />
            <span className="absolute inset-0 m-auto h-28 w-28 rounded-full border border-line" />
            <span className="absolute inset-0 m-auto grid h-16 w-16 place-items-center rounded-full bg-surface shadow-md"><ShieldCheck size={26} /></span>
            <span className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full bg-sky-400 px-3 py-1 text-sm font-medium text-white shadow">Ownership</span>
            <span className="absolute left-0 top-[36%] rounded-full bg-surface px-3 py-1 text-sm font-medium shadow">Engagement</span>
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-surface px-3 py-1 text-sm font-medium shadow">Duplicates</span>
          </div>
          {connector}
          {/* live post */}
          <div className="relative w-60 shrink-0 rounded-2xl bg-surface p-4 shadow-md">
            <span className="absolute -top-3 right-2 rounded-full border border-flag-green bg-surface px-3 py-0.5 text-xs font-semibold text-flag-green">Re-checked on a schedule</span>
            <p className="flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-brand" />Live post</p>
            <SparkLine className="mt-3 h-16 w-full" />
            <p className="mt-1 text-xs text-mute">Views over time</p>
          </div>
          {connector}
          {/* outcomes */}
          <div className="flex shrink-0 flex-col gap-3">
            <span className="flex items-center gap-2 rounded-full border border-flag-green px-4 py-1.5 text-sm font-medium text-flag-green"><Check size={16} />Approved</span>
            <span className="flex items-center gap-2 rounded-full bg-violet-300 px-4 py-1.5 text-sm font-medium text-zinc-900"><User size={16} />Human review</span>
            <span className="flex items-center gap-2 rounded-full border border-brand px-4 py-1.5 text-sm font-medium text-brand"><XCircle size={16} />Rejected</span>
          </div>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stages.map(([t, d]) => <div key={t}><h3 className="font-display text-2xl font-extrabold">{t}</h3><p className="mt-1 text-sm text-mute">{d}</p></div>)}
        </div>
      </div>
      <p className="mx-auto mt-6 flex max-w-2xl items-start justify-center gap-2 text-center text-sm text-mute"><ShieldCheck className="mt-0.5 shrink-0 text-brand" size={16} />Fraud detection is a safeguard, not a guarantee, so a person reviews anything unusual before it's paid.</p>
    </section>
  );
}

export function About() {
  return (
    <>
      <section className="overflow-hidden px-4 pb-8 pt-16 text-center">
        <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">Built in Nepal,<br />for creators and <span className="text-brand">brands.</span></h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-mute">Short-form video is where Nepal's attention is. NepClip makes it easy for brands to reach it and for creators to be paid fairly for the reach they create.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/launch-campaign" className="btn btn-primary px-6">Launch a campaign</Link>
          <Link to="/register" className="btn btn-outline px-6">Join as a creator</Link>
        </div>
        <HeroVisual />
      </section>

      <HowSection />
      <TrustSection />

      <section className="mx-auto max-w-4xl px-4 pb-20">
        <div className="card p-8 text-center sm:p-12">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Transparent rules. Verified accounts. An audit trail for every rupee.</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/how-it-works" className="btn btn-outline">See every step</Link>
            <Link to="/contact" className="btn btn-primary">Talk to our team</Link>
          </div>
        </div>
      </section>
    </>
  );
}