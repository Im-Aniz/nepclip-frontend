import { Link } from "react-router-dom";
import { BadgeCheck, ChevronRight, Clapperboard, Eye, Handshake, Megaphone, Share2, Star, Wallet } from "lucide-react";
import CampaignCard, { CampaignCardSkeleton } from "../../components/CampaignCard";
import useFetch from "../../hooks/useFetch";
import { compact } from "../../utils/format";

// [left %, top %, size px, opacity, rotation deg]
const STARS = [[8, 14, 22, 0.5, -12], [22, 52, 14, 0.4, 10], [34, 18, 12, 0.35, 0], [46, 8, 18, 0.45, 15], [62, 20, 26, 0.55, -8], [76, 10, 14, 0.4, 20], [88, 30, 20, 0.5, -15], [14, 34, 10, 0.3, 0], [70, 46, 12, 0.35, 8], [92, 56, 14, 0.4, -5]];

const Stars = () => (
  <div className="pointer-events-none absolute inset-0" aria-hidden="true">
    {STARS.map(([x, y, size, o, r], i) => (
      <Star key={i} size={size} fill="currentColor" strokeWidth={0} className="absolute text-white" style={{ left: `${x}%`, top: `${y}%`, opacity: o, transform: `rotate(${r}deg)` }} />
    ))}
  </div>
);

const Tile = ({ to, icon: Icon, image, stars = false, title, text, className = "", style }) => (
  <Link to={to} style={style} className={`group relative flex h-72 flex-col justify-end overflow-hidden rounded-3xl p-6 ${className}`}>
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/15 to-transparent" />
    {stars && <Stars />}
    {image ? (
      <img src={image} alt="" className="absolute left-1/2 top-9 h-32 -translate-x-1/2 object-contain transition group-hover:scale-105" />
    ) : (
      <Icon aria-hidden="true" size={128} strokeWidth={1.25} className="absolute left-1/2 top-10 -translate-x-1/2 opacity-40 transition group-hover:scale-105" />
    )}
    <h3 className="relative flex items-center gap-1 text-xl font-bold">{title}<ChevronRight size={18} className="transition group-hover:translate-x-0.5" /></h3>
    <p className="relative mt-1 text-sm opacity-80">{text}</p>
  </Link>
);

const Step = ({ n, icon: Icon, title, text }) => (
  <li>
    <div className="mb-3 flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-bg"><Icon size={18} /></span>
      <span className="font-display text-sm font-bold text-mute">0{n}</span>
    </div>
    <h3 className="text-lg font-bold">{title}</h3>
    <p className="mt-1 text-sm text-mute">{text}</p>
  </li>
);

export default function Home() {
  const { data: stats } = useFetch("/public/stats/");
  const { data, loading } = useFetch("/campaigns/", { ordering: "-rpm", page_size: 3 });
  const statItems = [["earners", stats?.creators], ["live campaigns", stats?.live_campaigns], ["views tracked", stats && compact(stats.total_views)]];
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-14 text-center lg:pt-24">
        <h1 className="font-display text-4xl font-extrabold leading-[1] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
          Where Nepali creators<br />get paid for views.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-mute">
          We pay through eSewa, Khalti or bank.
        </p>
        <p className="mt-10 flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm">
          {statItems.map(([label, value], i) => (
            <span key={label}>
              {i > 0 && <span className="mr-3 text-mute/50" aria-hidden="true">·</span>}
              <span className="font-semibold tabular-nums">{value ?? "—"}</span> <span className="text-mute">{label}</span>
            </span>
          ))}
        </p>
      </section>

      {/* Getting started */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="mb-5 text-2xl font-extrabold tracking-tight">Getting started</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <Tile to="/register" icon={Clapperboard} stars title="Clipping" text="Get paid to create content for top brands" className="text-[#2e1d00]"
            style={{ background: "linear-gradient(180deg, #f8d56b 0%, #e0a526 55%, #c98a12 100%)" }} />
          <Tile to="/launch-campaign" image="/logo.png" title="Launch a campaign" text="Pay only for the reach you get, with spend capped at your budget" className="bg-ink text-bg" />
        </div>
      </section>

      {/* Live campaigns */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-5 flex items-end justify-between">
          <div><h2 className="text-2xl font-extrabold tracking-tight">Live campaigns</h2><p className="text-sm text-mute">Highest paying right now</p></div>
          <Link to="/campaigns" className="btn btn-outline !rounded-full">See all</Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {loading ? Array.from({ length: 3 }).map((_, i) => <CampaignCardSkeleton key={i} />) : data?.results?.map((c) => <CampaignCard key={c.id} c={c} />)}
        </div>
        {!loading && !data?.results?.length && <p className="py-10 text-center text-mute">New campaigns are launching soon.</p>}
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-brand">For creators</p>
            <h2 className="mb-6 text-2xl font-extrabold tracking-tight">Turn short clips into income</h2>
            <ol className="grid gap-6 sm:grid-cols-2">
              <Step n={1} icon={Clapperboard} title="Create clips" text="Cut the best moments from a campaign's source video." />
              <Step n={2} icon={Share2} title="Post" text="Publish on your own channel and submit the link." />
              <Step n={3} icon={Eye} title="Get views" text="We track performance with the platform's own data." />
              <Step n={4} icon={Wallet} title="Earn money" text="Eligible views turn into NPR in your wallet." />
            </ol>
          </div>
          <div>
            <p className="text-sm font-semibold text-brand">For brands</p>
            <h2 className="mb-6 text-2xl font-extrabold tracking-tight">Pay only for the reach you get</h2>
            <ol className="grid gap-6 sm:grid-cols-2">
              <Step n={1} icon={Megaphone} title="Give us your content" text="Share a podcast, stream, song or product video." />
              <Step n={2} icon={Clapperboard} title="Creators clip it" text="Hundreds of creators cut it for their audiences." />
              <Step n={3} icon={Eye} title="Reach more people" text="Track views and spend live on your dashboard." />
              <Step n={4} icon={Handshake} title="Pay on performance" text="Set an RPM and a budget. Spend stops at your cap." />
            </ol>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="rounded-3xl bg-ink p-8 text-bg sm:p-12">
          <BadgeCheck className="mb-4 text-brand" size={32} />
          <h2 className="max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">Real views. Transparent rules. Admin-reviewed payouts.</h2>
          <p className="mt-3 max-w-2xl text-bg/70">Every campaign is reviewed before it goes live, every clip is checked against the brand's rules and an anti-fraud score, and every rupee shows up in a ledger you can audit.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/register" className="btn btn-primary !rounded-full">Create a free account</Link>
            <Link to="/how-it-works" className="btn !rounded-full border border-bg/30 text-bg hover:bg-bg/10">How it works</Link>
          </div>
        </div>
      </section>
    </>
  );
}