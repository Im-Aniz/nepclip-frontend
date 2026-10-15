import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Facebook, Instagram, Menu, Moon, Sun, X, Youtube } from "lucide-react";
import { Logo } from "../components/ui";
import { useAuth, homeFor } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const LINKS = [["/campaigns", "Campaigns"], ["/for-creators", "For creators"], ["/for-brands", "For brands"], ["/how-it-works", "How it works"], ["/pricing", "Pricing"]];

// Footer columns (all of these routes exist). To add legal pages later, add a ["Legal", [...]] column here.
const FOOTER = [
  ["Company", [["About", "/about"], ["How it works", "/how-it-works"], ["Pricing", "/pricing"], ["Contact us", "/contact"]]],
  ["Creators", [["Browse campaigns", "/campaigns"], ["How you earn", "/for-creators"], ["Sign up", "/register"], ["Log in", "/login"]]],
  ["Brands", [["Launch a campaign", "/launch-campaign"], ["How it works for brands", "/for-brands"], ["Talk to our team", "/contact"]]],
];

const TikTokIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

const XIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.215 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// TODO: replace these with your real profile links.
const SOCIALS = [
  ["Facebook", Facebook, "https://www.facebook.com/"],
  ["Instagram", Instagram, "https://www.instagram.com/"],
  ["TikTok", TikTokIcon, "https://www.tiktok.com/"],
  ["YouTube", Youtube, "https://www.youtube.com/"],
  ["X", XIcon, "https://x.com/"],
];

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { dark, toggle } = useTheme();
  const { pathname } = useLocation();
  const link = ({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? "text-brand" : "text-mute hover:text-ink"}`;
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Link to="/" aria-label="NepClip home"><Logo /></Link>
          <nav className="ml-6 hidden items-center md:flex">{LINKS.map(([to, l]) => <NavLink key={to} to={to} className={link}>{l}</NavLink>)}</nav>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggle} className="btn btn-ghost !p-2" aria-label="Toggle dark mode">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
            {user ? <Link to={homeFor(user.role)} className="btn btn-primary hidden sm:inline-flex">Dashboard</Link> : (
              <><Link to="/login" className="btn btn-ghost hidden sm:inline-flex">Log in</Link><Link to="/register" className="btn btn-primary hidden sm:inline-flex">Start clipping</Link></>)}
            <button className="btn btn-ghost !p-2 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
        {open && (
          <div className="rise border-t border-line bg-bg px-4 pb-4 md:hidden" key={pathname}>
            {LINKS.map(([to, l]) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={(a) => `block py-3 text-base ${link(a)}`}>{l}</NavLink>)}
            <div className="mt-2 flex gap-2">
              {user ? <Link to={homeFor(user.role)} onClick={() => setOpen(false)} className="btn btn-primary flex-1">Dashboard</Link> : (
                <><Link to="/login" onClick={() => setOpen(false)} className="btn btn-outline flex-1">Log in</Link><Link to="/register" onClick={() => setOpen(false)} className="btn btn-primary flex-1">Start clipping</Link></>)}
            </div>
          </div>
        )}
      </header>
      <main className="flex-1"><Outlet /></main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-14">
          <div className="grid gap-10 sm:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div className="sm:col-span-3 lg:col-span-1">
              <Link to="/" aria-label="NepClip home"><Logo /></Link>
            </div>
            {FOOTER.map(([title, items]) => (
              <nav key={title} aria-label={title}>
                <h2 className="text-lg font-bold">{title}</h2>
                <ul className="mt-5 space-y-3 text-[15px]">
                  {items.map(([label, to]) => (
                    <li key={label}><Link to={to} className="text-mute transition hover:text-ink">{label}</Link></li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
          <div className="mt-14 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-mute">© {new Date().getFullYear()} NepClip. All rights reserved.</p>
            <ul className="flex items-center gap-5">
              {SOCIALS.map(([name, Icon, href]) => (
                <li key={name}>
                  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={name} className="text-ink transition hover:text-brand"><Icon size={20} /></a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
