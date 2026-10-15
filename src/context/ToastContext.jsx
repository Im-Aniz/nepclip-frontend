import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const Ctx = createContext(null);
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const dismiss = (id) => setItems((l) => l.filter((t) => t.id !== id));
  const push = useCallback((message, type = "info") => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l, { id, message, type }]);
    setTimeout(() => dismiss(id), type === "error" ? 6500 : 3800);
  }, []);
  const api = { success: (m) => push(m, "success"), error: (m) => push(m, "error"), info: (m) => push(m, "info") };
  const icon = { success: <CheckCircle2 size={18} className="text-flag-green" />, error: <AlertCircle size={18} className="text-brand" />, info: <Info size={18} className="text-flag-blue" /> };
  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="fixed inset-x-3 bottom-3 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="rise card flex w-full max-w-sm items-start gap-3 px-4 py-3 text-sm sm:w-auto">
            {icon[t.type]}<span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-mute hover:text-ink"><X size={16} /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
