import { useState, useRef, useEffect } from "react";
import { Search, SlidersHorizontal, ArrowUpDown, Instagram, Youtube, Check } from "lucide-react";
import CampaignCard, { CampaignCardSkeleton } from "../../components/CampaignCard";
import { EmptyState, ErrorState, Pagination } from "../../components/ui";
import useFetch from "../../hooks/useFetch";
import { useSettings } from "../../context/SettingsContext";
import { PLATFORM_LABEL } from "../../utils/format";

export const SORTS = [
  { value: "-published_at", label: "Newest" },
  { value: "-rpm", label: "Highest paying" },
  { value: "end_date", label: "Ending soon" },
];

// Tabs shown in the middle of the bar. `value` is sent to the API as `category` (matched case-insensitively against each campaign's Category).
const TYPE_TABS = [
  { value: "", label: "All" },
  { value: "logo", label: "Logo" },
  { value: "music", label: "Music" },
  { value: "clipping", label: "Clipping" },
  { value: "ugc", label: "UGC" },
];

const TikTokIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

const XIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.215 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const PLATFORM_ICON = {
  instagram: Instagram,
  tiktok: TikTokIcon,
  youtube: Youtube,
  x: XIcon,
  twitter: XIcon,
};

/** Marketplace grid + filters. `embedded` lets the creator dashboard reuse it (drops the page heading). */
export default function Campaigns({ linkPrefix = "/campaign", embedded = false }) {
  const settings = useSettings();
  const [f, setF] = useState({ search: "", platform: "", category: "", ordering: "-published_at" });
  const [page, setPage] = useState(1);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  const params = Object.fromEntries(Object.entries({ ...f, page }).filter(([, v]) => v !== ""));
  const { data, loading, error, reload } = useFetch("/campaigns/", params);

  const update = (k, v) => { setF((s) => ({ ...s, [k]: v })); setPage(1); };

  // close the sort menu on outside click / Escape
  useEffect(() => {
    if (!sortOpen) return;
    const onDown = (e) => { if (!sortRef.current?.contains(e.target)) setSortOpen(false); };
    const onKey = (e) => e.key === "Escape" && setSortOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [sortOpen]);

  return (
    <div className={embedded ? "" : "mx-auto max-w-6xl px-4 py-10"}>
      {!embedded && (
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold">Campaigns</h1>
          <p className="mt-2 text-mute">Don't forget to read the requirements while joining a campaign.</p>
        </div>
      )}

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl bg-black/[0.04] p-2 dark:bg-white/[0.06]">
        {/* Platform pill group */}
        <div className="flex items-center gap-1 rounded-xl border border-black/10 p-1 dark:border-white/10" role="group" aria-label="Platform">
          <button
            type="button"
            onClick={() => update("platform", "")}
            aria-pressed={f.platform === ""}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${f.platform === "" ? "bg-white shadow-sm dark:bg-white/10" : "text-mute hover:text-current"}`}
          >
            All platforms
          </button>
          {settings.supported_platforms.map((p) => {
            const Icon = PLATFORM_ICON[p];
            const active = f.platform === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => update("platform", p)}
                aria-pressed={active}
                aria-label={PLATFORM_LABEL[p] || p}
                title={PLATFORM_LABEL[p] || p}
                className={`grid h-9 w-10 place-items-center rounded-lg transition ${active ? "bg-white shadow-sm dark:bg-white/10" : "text-mute hover:text-current"}`}
              >
                {Icon ? <Icon size={18} /> : <span className="text-xs">{(PLATFORM_LABEL[p] || p).slice(0, 2)}</span>}
              </button>
            );
          })}
        </div>

        {/* Type tabs */}
        <nav className="flex items-center gap-6" aria-label="Campaign type">
          {TYPE_TABS.map((t) => {
            const active = f.category === t.value;
            return (
              <button
                key={t.value || "all"}
                type="button"
                onClick={() => update("category", t.value)}
                aria-current={active ? "page" : undefined}
                className={`border-b-2 py-2 text-sm font-medium transition ${active ? "border-current" : "border-transparent text-mute hover:text-current"}`}
              >
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Search + sort, pushed to the right */}
        <div className="ml-auto flex w-full items-center gap-3 sm:w-auto">
          <div className="relative flex-1 sm:w-72 sm:flex-none">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              className="input !rounded-xl !pl-10"
              placeholder="Search for a campaign..."
              value={f.search}
              onChange={(e) => update("search", e.target.value)}
              aria-label="Search campaigns"
            />
          </div>

          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => setSortOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={sortOpen}
              aria-label="Sort campaigns"
              className="grid h-11 w-11 place-items-center rounded-full border border-black/15 bg-white/60 transition hover:bg-white dark:border-white/15 dark:bg-white/5"
            >
              <ArrowUpDown size={18} />
            </button>
            {sortOpen && (
              <ul role="menu" className="card absolute right-0 z-20 mt-2 w-48 overflow-hidden p-1 shadow-lg">
                {SORTS.map((s) => (
                  <li key={s.value} role="none">
                    <button
                      role="menuitemradio"
                      aria-checked={f.ordering === s.value}
                      type="button"
                      onClick={() => { update("ordering", s.value); setSortOpen(false); }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      {s.label}
                      {f.ordering === s.value && <Check size={14} />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <CampaignCardSkeleton key={i} />)
              : data?.results?.map((c) => <CampaignCard key={c.id} c={c} to={`${linkPrefix}/${c.id}`} />)}
          </div>
          {!loading && !data?.results?.length && (
            <div className="card">
              <EmptyState icon={SlidersHorizontal} title="No campaigns match" text="Try clearing a filter or searching for something else." />
            </div>
          )}
          {data && <div className="mt-4"><Pagination page={page} count={data.count} pageSize={20} onPage={setPage} /></div>}
        </>
      )}
    </div>
  );
}