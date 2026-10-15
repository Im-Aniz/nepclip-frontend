import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bell, LogOut, Menu, Moon, Sun, X } from "lucide-react";
import * as I from "lucide-react";
import { Avatar, Logo } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import useFetch from "../hooks/useFetch";

export const NAV = {
  creator: [
    ["/creator", "Dashboard", I.LayoutDashboard, true], ["/creator/campaigns", "Campaigns", I.Megaphone], ["/creator/submissions", "My Submissions", I.Film],
    ["/creator/earnings", "Earnings", I.Wallet], ["/creator/withdraw", "Withdraw", I.Banknote], ["/creator/leaderboard", "Leaderboard", I.Trophy],
    ["/creator/referrals", "Referrals", I.Users], ["/creator/accounts", "Connected Accounts", I.Link2], ["/creator/profile", "Profile", I.UserRound],
    ["/creator/support", "Support Chat", I.MessageCircle], ["/creator/settings", "Settings", I.Settings], ["/creator/notifications", "Notifications", I.Bell],
  ],
  brand: [
    ["/brand", "Dashboard", I.LayoutDashboard, true], ["/brand/campaigns", "My Campaigns", I.Megaphone], ["/brand/campaigns/new", "New Campaign", I.PlusCircle],
    ["/brand/support", "Contact Platform", I.MessageSquare], ["/brand/profile", "Business Profile", I.Building2], ["/brand/settings", "Settings", I.Settings], ["/brand/notifications", "Notifications", I.Bell],
  ],
  admin: [
    ["/admin", "Dashboard", I.LayoutDashboard, true], ["/admin/users", "Users", I.Users], ["/admin/creators", "Creators", I.UserRound], ["/admin/brands", "Brands", I.Building2],
    ["/admin/campaigns", "Campaigns", I.Megaphone], ["/admin/requests", "Campaign Requests", I.Inbox], ["/admin/inquiries", "Brand Inquiries", I.Handshake],
    ["/admin/submissions", "Submissions", I.Film], ["/admin/withdrawals", "Withdrawals", I.Banknote], ["/admin/transactions", "Transactions", I.Receipt],
    ["/admin/fraud", "Fraud Detection", I.ShieldAlert], ["/admin/reports", "Reports", I.Flag], ["/admin/support", "Support Chat", I.MessagesSquare], ["/admin/referrals", "Referrals", I.Gift],
    ["/admin/notifications", "Notifications", I.Bell], ["/admin/settings", "Platform Settings", I.SlidersHorizontal], ["/admin/audit", "Audit Logs", I.ScrollText],
  ],
};

export default function DashboardLayout({ role }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { data } = useFetch(role === "admin" ? null : "/notifications/", { page_size: 50 });
  const unread = data?.results?.filter((n) => !n.is_read).length || 0;
  const { data: chats } = useFetch(role === "admin" ? "/admin/support/unread/" : null, { at: pathname });   // refreshed on every page change
  const unreadChats = chats?.unread_threads || 0;
  useEffect(() => setOpen(false), [pathname]);

  const items = NAV[role];
  const Side = (
    <nav className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5"><Link to="/"><Logo /></Link><button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X size={20} /></button></div>
      {role === "admin" && <p className="mx-5 mb-2 rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand">Admin console</p>}
      <ul className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {items.map(([to, label, Icon, end]) => (
          <li key={to}>
            <NavLink to={to} end={!!end || to.endsWith("/campaigns")} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? "bg-brand text-brand-ink" : "text-mute hover:bg-sunk hover:text-ink"}`}>
              <Icon size={18} />{label}
              {label === "Notifications" && unread > 0 && <span className="ml-auto rounded-full bg-brand px-1.5 text-xs text-brand-ink">{unread}</span>}
              {label === "Support Chat" && unreadChats > 0 && <span className="ml-auto rounded-full bg-brand px-1.5 text-xs text-brand-ink" aria-label={`${unreadChats} unread chats`}>{unreadChats}</span>}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 px-2 py-2"><Avatar name={user?.display_name || user?.username} /><div className="min-w-0"><p className="truncate text-sm font-bold">{user?.display_name || user?.username}</p><p className="truncate text-xs text-mute">{user?.email}</p></div></div>
        <button onClick={async () => { await logout(); nav("/"); }} className="btn btn-ghost mt-1 w-full justify-start"><LogOut size={16} />Log out</button>
      </div>
    </nav>
  );
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-line bg-surface lg:block">{Side}</aside>
      {open && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} /><aside className="rise absolute inset-y-0 left-0 w-72 bg-surface shadow-xl">{Side}</aside></div>}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur sm:px-6">
          <button className="btn btn-ghost !p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={toggle} className="btn btn-ghost !p-2" aria-label="Toggle dark mode">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
            {role !== "admin" && <Link to={`/${role}/notifications`} className="btn btn-ghost relative !p-2" aria-label="Notifications"><Bell size={18} />{unread > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-bg" />}</Link>}
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8"><Outlet /></main>
      </div>
    </div>
  );
}
