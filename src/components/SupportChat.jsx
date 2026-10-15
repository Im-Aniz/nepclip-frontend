import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ImagePlus, Send, X } from "lucide-react";
import { get, post } from "../services/api";
import { useToast } from "../context/ToastContext";
import { Spinner } from "./ui";
import { errMsg } from "../utils/format";

export const CHAT_IMAGE_MB = 5;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const POLL_MS = 5000;

const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
const dayLabel = (iso) => {
  if (sameDay(iso, Date.now())) return "Today";
  if (sameDay(iso, Date.now() - 864e5)) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};
const timeLabel = (iso) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const merge = (list, incoming) => {
  const seen = new Set(list.map((m) => m.id));
  const fresh = incoming.filter((m) => !seen.has(m.id));
  return fresh.length ? [...list, ...fresh].sort((a, b) => a.id - b.id) : list;
};

/**
 * One conversation. `url` is the endpoint that lists (GET) and sends (POST) messages:
 *   creator / brand:  /support/chat/
 *   admin:            /admin/support/threads/:id/   (pass staff)
 * New messages arrive by polling, so no websocket server is needed.
 */
export default function SupportChat({ url, staff = false, onStatus, emptyTitle = "Chat with NepClip support", emptyText = "Ask about payouts, campaigns or your account. You can attach a screenshot too.", className = "h-[68vh] min-h-[420px]" }) {
  const toast = useToast();
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState("open");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [sending, setSending] = useState(false);
  const scroller = useRef(null);
  const stick = useRef(true);          // keep the view pinned to the newest message while the reader is at the bottom
  const keepOffset = useRef(null);     // scrollHeight before older messages were prepended
  const fileInput = useRef(null);
  const lastId = useRef(0);
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;

  const apply = useCallback((d) => {
    setStatus(d.status);
    onStatusRef.current?.(d.status, d.thread);
  }, []);

  // initial load (and reload when switching conversations)
  useEffect(() => {
    let live = true;
    setMsgs([]); setLoading(true); setError(null); setHasMore(false); lastId.current = 0; stick.current = true;
    get(url).then((d) => {
      if (!live) return;
      setMsgs(d.messages); setHasMore(d.has_more); apply(d);
    }).catch((e) => live && setError(errMsg(e, "Couldn't load the chat."))).finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [url, apply]);

  useEffect(() => { lastId.current = msgs.length ? msgs[msgs.length - 1].id : 0; }, [msgs]);

  // poll for new messages while the tab is visible
  useEffect(() => {
    if (loading || error) return undefined;
    let busy = false;
    const tick = async () => {
      if (busy || document.hidden) return;
      busy = true;
      try {
        const d = await get(url, { after: lastId.current });
        if (d.messages?.length) setMsgs((cur) => merge(cur, d.messages));
        apply(d);
      } catch { /* a missed poll is fine; the next one retries */ } finally { busy = false; }
    };
    const t = setInterval(tick, POLL_MS);
    return () => clearInterval(t);
  }, [url, loading, error, apply]);

  const toBottom = () => { const el = scroller.current; if (el) el.scrollTop = el.scrollHeight; };
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (keepOffset.current != null) { el.scrollTop = el.scrollHeight - keepOffset.current; keepOffset.current = null; }
    else if (stick.current) toBottom();
  }, [msgs]);
  const onScroll = () => { const el = scroller.current; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; };

  const older = async () => {
    try {
      keepOffset.current = scroller.current.scrollHeight;
      const d = await get(url, { before: msgs[0].id });
      setMsgs((cur) => merge(cur, d.messages)); setHasMore(d.has_more);
    } catch (e) { keepOffset.current = null; toast.error(errMsg(e)); }
  };

  // photo picking
  useEffect(() => {
    if (!file) { setPreview(""); return undefined; }
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  const pick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!IMAGE_TYPES.includes(f.type)) { toast.error("Please choose a JPG, PNG, WebP or GIF photo."); return; }
    if (f.size > CHAT_IMAGE_MB * 1024 * 1024) { toast.error(`Photos must be under ${CHAT_IMAGE_MB} MB.`); return; }
    setFile(f);
  };

  const send = async (e) => {
    e?.preventDefault();
    const body = text.trim();
    if ((!body && !file) || sending) return;
    setSending(true);
    try {
      const fd = new FormData();
      if (body) fd.append("body", body);
      if (file) fd.append("image", file);
      const m = await post(url, fd);
      stick.current = true;
      setMsgs((cur) => merge(cur, [m]));
      setText(""); setFile(null);
      if (!staff) setStatus("open");
    } catch (x) { toast.error(errMsg(x, "Couldn't send. Please try again.")); } finally { setSending(false); }
  };
  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } };
  const grow = (e) => { e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`; };

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      <div ref={scroller} onScroll={onScroll} role="log" aria-live="polite" aria-label="Conversation" className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-4 py-4">
        {loading && <div className="grid h-full place-items-center"><Spinner size={22} /></div>}
        {error && <p className="grid h-full place-items-center text-center text-sm text-mute">{error}</p>}
        {!loading && !error && hasMore && <div className="pb-2 text-center"><button type="button" onClick={older} className="btn btn-ghost !py-1 text-sm">Load earlier messages</button></div>}
        {!loading && !error && msgs.length === 0 && (
          <div className="grid h-full place-items-center text-center"><div className="max-w-xs"><p className="font-display text-lg font-bold">{staff ? "No messages yet" : emptyTitle}</p><p className="mt-1 text-sm text-mute">{staff ? "Replies you send here reach the user instantly." : emptyText}</p></div></div>
        )}
        {msgs.map((m, i) => {
          const prev = msgs[i - 1];
          const mine = staff ? m.from_staff : !m.from_staff;
          const newDay = !prev || !sameDay(prev.created_at, m.created_at);
          const startsRun = newDay || prev.from_staff !== m.from_staff;
          return (
            <div key={m.id}>
              {newDay && <p className="py-3 text-center text-xs font-semibold text-mute">{dayLabel(m.created_at)}</p>}
              {!mine && startsRun && !staff && <p className="mb-0.5 ml-1 mt-2 text-xs font-semibold text-mute">{m.sender_name}</p>}
              <div className={`flex ${mine ? "justify-end" : "justify-start"} ${startsRun && !newDay ? "mt-2" : ""}`}>
                <div className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "rounded-br-md bg-brand text-brand-ink" : "rounded-bl-md bg-sunk"}`}>
                  {m.image && (
                    <a href={m.image} target="_blank" rel="noreferrer" className={m.body ? "mb-1.5 block" : "block"}>
                      <img src={m.image} alt="Photo sent in chat" loading="lazy" onLoad={() => stick.current && toBottom()} className="max-h-64 rounded-xl object-cover" />
                    </a>
                  )}
                  {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                  <p className={`mt-1 text-right text-[11px] ${mine ? "opacity-75" : "text-mute"}`}>{timeLabel(m.created_at)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!staff && status === "closed" && <p className="border-t border-line bg-sunk px-4 py-2 text-center text-xs text-mute">This conversation was marked as resolved. Send a message to reopen it.</p>}

      <form onSubmit={send} className="border-t border-line bg-surface p-3">
        {preview && (
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-sunk p-2">
            <img src={preview} alt="Photo to send" className="h-14 w-14 rounded-lg object-cover" />
            <p className="min-w-0 flex-1 truncate text-sm">{file?.name}</p>
            <button type="button" onClick={() => setFile(null)} aria-label="Remove photo" className="btn btn-ghost !p-1.5"><X size={16} /></button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={pick} className="hidden" aria-label="Choose a photo" />
          <button type="button" onClick={() => fileInput.current?.click()} className="btn btn-outline !p-2.5" aria-label="Attach a photo" disabled={sending}><ImagePlus size={18} /></button>
          <textarea value={text} onChange={(e) => { setText(e.target.value); grow(e); }} onKeyDown={onKey} rows={1} maxLength={2000} placeholder={staff ? "Write a reply…" : "Write a message…"} aria-label="Message"
            className="input max-h-36 min-h-[42px] flex-1 resize-none !py-2.5" />
          <button className="btn btn-primary !p-2.5" disabled={sending || (!text.trim() && !file)} aria-label="Send message">{sending ? <Spinner size={18} /> : <Send size={18} />}</button>
        </div>
        <p className="mt-1.5 px-1 text-[11px] text-mute">Enter to send, Shift + Enter for a new line. Photos up to {CHAT_IMAGE_MB} MB.</p>
      </form>
    </div>
  );
}
