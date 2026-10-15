import { cloneElement, isValidElement, useEffect, useId, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, Loader2, X } from "lucide-react";
import { cap } from "../utils/format";

export const Spinner = ({ size = 18 }) => <Loader2 size={size} className="animate-spin" aria-label="Loading" />;
export const Skeleton = ({ className = "h-4 w-full" }) => <div className={`skeleton ${className}`} aria-hidden />;

const TONES = {
  green: "bg-green-500/15 text-green-700 dark:text-green-400", red: "bg-red-500/15 text-red-700 dark:text-red-400",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-400", blue: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  gray: "bg-sunk text-mute", brand: "bg-brand-soft text-brand",
};
const STATUS_TONE = {
  approved: "green", published: "green", active: "green", completed: "green", connected: "green", resolved: "green", paid: "green", converted: "green", normal: "green", credited: "green",
  pending: "amber", under_review: "amber", submitted: "amber", admin_review: "amber", processing: "amber", new: "amber", open: "amber", review: "amber", negotiating: "amber", contacted: "blue", investigating: "blue",
  rejected: "red", banned: "red", suspended: "red", fraud_review: "red", high_risk: "red",
  draft: "gray", paused: "gray", ended: "gray",
};
export function Badge({ children, tone, status }) {
  const t = tone || STATUS_TONE[status] || "gray";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${TONES[t]}`}>{children ?? cap(status)}</span>;
}

export function Logo({ size = 28, text = true }) {
  return (
    <span className="inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
      <img src="/logo.png" alt="" width={size} height={size} />
      {text && <span>Nep<span className="text-brand">Clip</span></span>}
    </span>
  );
}

export function Modal({ open, onClose, title, children, wide, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`rise card flex max-h-[92vh] w-full flex-col rounded-b-none sm:rounded-b-2xl ${wide ? "sm:max-w-2xl" : "sm:max-w-md"}`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-mute hover:bg-sunk"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/** Associates the label with its control (htmlFor/id) and wires error/hint text via aria-describedby. */
export function Field({ label, error, hint, children, className = "" }) {
  const uid = useId();
  const id = (isValidElement(children) && children.props.id) || uid;
  const noteId = `${id}-note`;
  const control = isValidElement(children)
    ? cloneElement(children, { id, "aria-invalid": error ? true : undefined, "aria-describedby": error || hint ? noteId : undefined })
    : children;
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="label">{label}</label>}
      {control}
      {error ? <p id={noteId} className="mt-1 text-xs text-brand" role="alert">{error}</p> : hint ? <p id={noteId} className="mt-1 text-xs text-mute">{hint}</p> : null}
    </div>
  );
}
export const Input = ({ label, error, hint, className, ...p }) => <Field label={label} error={error} hint={hint} className={className}><input className="input" {...p} /></Field>;
export const Textarea = ({ label, error, hint, className, ...p }) => <Field label={label} error={error} hint={hint} className={className}><textarea rows={3} className="input" {...p} /></Field>;
export const Select = ({ label, error, hint, className, options, placeholder, ...p }) => (
  <Field label={label} error={error} hint={hint} className={className}>
    <select className="input" {...p}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (typeof o === "string" ? <option key={o} value={o}>{cap(o)}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  </Field>
);
export const Check = ({ label, ...p }) => <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[rgb(var(--brand))]" {...p} />{label}</label>;

export const EmptyState = ({ title = "Nothing here yet", text, action, icon: Icon = Inbox }) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-sunk text-mute"><Icon size={22} /></div>
    <p className="font-display text-lg font-bold">{title}</p>
    {text && <p className="mt-1 max-w-sm text-sm text-mute">{text}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
export const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center px-6 py-12 text-center">
    <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand"><AlertTriangle size={22} /></div>
    <p className="font-semibold">{message || "Something went wrong"}</p>
    {onRetry && <button onClick={onRetry} className="btn btn-outline mt-4">Try again</button>}
  </div>
);

export function StatCard({ label, value, sub, icon: Icon, loading, accent }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-mute">{label}</p>
        {Icon && <span className={`grid h-8 w-8 place-items-center rounded-lg ${accent ? "bg-brand text-brand-ink" : "bg-sunk text-mute"}`}><Icon size={16} /></span>}
      </div>
      {loading ? <Skeleton className="mt-3 h-8 w-24" /> : <p className="mt-2 font-display text-2xl font-extrabold tabular-nums sm:text-3xl">{value}</p>}
      {sub && !loading && <p className="mt-1 text-xs text-mute">{sub}</p>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>{subtitle && <p className="mt-1 text-sm text-mute">{subtitle}</p>}</div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Pagination({ page, count, pageSize = 20, onPage }) {
  const pages = Math.max(1, Math.ceil(count / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
      <span className="text-mute">Page {page} of {pages} · {count} total</span>
      <div className="flex gap-1">
        <button className="btn btn-outline !px-2.5" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
        <button className="btn btn-outline !px-2.5" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}

/** columns: [{ key, label, render?(row), className? }]. Scrolls sideways on small screens. */
export function DataTable({ columns, rows, loading, error, onRetry, empty, page, count, pageSize, onPage }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-sunk/60 text-xs uppercase tracking-wide text-mute">
            <tr>{columns.map((c) => <th key={c.key} className={`px-4 py-3 font-semibold ${c.className || ""}`}>{c.label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && Array.from({ length: 5 }).map((_, i) => <tr key={i}>{columns.map((c) => <td key={c.key} className="px-4 py-3.5"><Skeleton className="h-4 w-full max-w-[140px]" /></td>)}</tr>)}
            {!loading && !error && rows?.map((r, i) => (
              <tr key={r.id ?? i} className="hover:bg-sunk/40">
                {columns.map((c) => <td key={c.key} className={`px-4 py-3 align-middle ${c.className || ""}`}>{c.render ? c.render(r) : r[c.key] ?? "—"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <ErrorState message={error} onRetry={onRetry} />}
      {!loading && !error && rows?.length === 0 && (empty || <EmptyState />)}
      {onPage && !loading && <Pagination page={page} count={count} pageSize={pageSize} onPage={onPage} />}
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-sunk p-1" role="tablist">
      {tabs.map((t) => {
        const v = typeof t === "string" ? t : t.value, l = typeof t === "string" ? cap(t) : t.label;
        return <button key={v} role="tab" aria-selected={value === v} onClick={() => onChange(v)}
          className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition ${value === v ? "bg-surface shadow-sm" : "text-mute hover:text-ink"}`}>{l}</button>;
      })}
    </div>
  );
}

/** Confirm / reason prompt in one component. */
export function ActionModal({ open, onClose, title, text, onConfirm, needReason, confirmLabel = "Confirm", danger }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setReason(""); }, [open]);
  const go = async () => { setBusy(true); try { await onConfirm(reason); } finally { setBusy(false); } };
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<><button className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} disabled={busy || (needReason && !reason.trim())} onClick={go}>{busy && <Spinner size={14} />}{confirmLabel}</button></>}>
      {text && <p className="mb-3 text-sm text-mute">{text}</p>}
      {needReason && <Textarea label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Shared with the user" />}
    </Modal>
  );
}

export const Avatar = ({ name = "?", size = 36 }) => (
  <span style={{ width: size, height: size }} className="grid shrink-0 place-items-center rounded-full bg-brand-soft font-display text-sm font-bold text-brand">{name.trim().charAt(0).toUpperCase()}</span>
);
