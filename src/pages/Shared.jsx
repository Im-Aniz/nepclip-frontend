import { useState } from "react";
import { Bell, CheckCheck, Moon, Sun } from "lucide-react";
import { EmptyState, ErrorState, Input, PageHeader, Pagination, Skeleton, Spinner } from "../components/ui";
import useFetch from "../hooks/useFetch";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { post } from "../services/api";
import { date, errMsg, fieldErrors } from "../utils/format";
import { Link } from "react-router-dom";

export function Notifications() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch("/notifications/", { page });
  const toast = useToast();
  const readAll = async () => { try { await post("/notifications/read-all/"); reload(); } catch (e) { toast.error(errMsg(e)); } };
  const readOne = async (n) => { if (!n.is_read) { try { await post(`/notifications/${n.id}/read/`); reload(); } catch { /* non-critical */ } } };
  return (
    <>
      <PageHeader title="Notifications" actions={<button className="btn btn-outline" onClick={readAll}><CheckCheck size={16} />Mark all read</button>} />
      <div className="card overflow-hidden">
        {loading && <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>}
        {error && <ErrorState message={error} onRetry={reload} />}
        {!loading && !error && !data?.results?.length && <EmptyState icon={Bell} title="You're all caught up" text="Campaign, submission and payout updates will show up here." />}
        <ul className="divide-y divide-line">
          {data?.results?.map((n) => (
            <li key={n.id} onClick={() => readOne(n)} className={`flex cursor-pointer gap-3 px-5 py-4 ${n.is_read ? "" : "bg-brand-soft/40"}`}>
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${n.is_read ? "bg-line" : "bg-brand"}`} />
              <div className="min-w-0 flex-1"><p className="font-semibold">{n.title}</p>{n.body && <p className="text-sm text-mute">{n.body}</p>}
                {n.link?.startsWith("/") && <Link to={n.link} className="text-sm font-semibold text-brand">View</Link>}</div>
              <span className="shrink-0 text-xs text-mute">{date(n.created_at)}</span>
            </li>))}
        </ul>
        {data && <Pagination page={page} count={data.count} onPage={setPage} />}
      </div>
    </>
  );
}

export function Settings() {
  const { dark, toggle } = useTheme();
  const toast = useToast();
  const [f, setF] = useState({ old_password: "", new_password: "" });
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const save = async (e) => {
    e.preventDefault(); setBusy(true); setErrs({});
    try { await post("/auth/change-password/", f); toast.success("Password changed."); setF({ old_password: "", new_password: "" }); }
    catch (x) { setErrs(fieldErrors(x)); toast.error(errMsg(x)); } finally { setBusy(false); }
  };
  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-5 md:grid-cols-2">
        <form onSubmit={save} className="card space-y-4 p-5"><h2 className="font-display text-lg font-bold">Change password</h2>
          <Input label="Current password" type="password" autoComplete="current-password" value={f.old_password} onChange={(e) => setF({ ...f, old_password: e.target.value })} error={errs.old_password} />
          <Input label="New password" type="password" autoComplete="new-password" value={f.new_password} onChange={(e) => setF({ ...f, new_password: e.target.value })} error={errs.new_password} hint="At least 8 characters" />
          <button className="btn btn-primary" disabled={busy || !f.old_password || f.new_password.length < 8}>{busy && <Spinner size={14} />}Update password</button></form>
        <div className="card p-5"><h2 className="font-display text-lg font-bold">Appearance</h2><p className="mb-4 text-sm text-mute">Choose how NepClip looks on this device.</p>
          <button className="btn btn-outline" onClick={toggle}>{dark ? <Sun size={16} /> : <Moon size={16} />}Switch to {dark ? "light" : "dark"} mode</button></div>
      </div>
    </>
  );
}
