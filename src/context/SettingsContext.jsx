import { createContext, useContext, useEffect, useState } from "react";
import { get } from "../services/api";
import { setCurrencySymbol } from "../utils/format";

const DEFAULTS = { currency_symbol: "Rs.", platform_commission_percent: 15, min_withdrawal: 500, referral_percent: 10, default_rpm: 100,
  supported_platforms: ["youtube"], withdrawal_methods: ["esewa", "khalti", "bank"], min_campaign_budget: 10000 };
const Ctx = createContext(DEFAULTS);
export const useSettings = () => useContext(Ctx);

export function SettingsProvider({ children }) {
  const [s, setS] = useState(DEFAULTS);
  useEffect(() => {
    get("/public/settings/").then((d) => { setS({ ...DEFAULTS, ...d }); setCurrencySymbol(d.currency_symbol); }).catch(() => {});
  }, []);
  return <Ctx.Provider value={s}>{children}</Ctx.Provider>;
}
