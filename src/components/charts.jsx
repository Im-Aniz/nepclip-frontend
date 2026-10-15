import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { compact, shortDate } from "../utils/format";

export const COLORS = ["#D6213A", "#1D5FA8", "#2E8B57", "#E8B422", "#7A5AF8", "#0E1A2B"];
const axis = { stroke: "currentColor", fontSize: 11, tickLine: false, axisLine: false };
const tip = { contentStyle: { background: "rgb(var(--surface))", border: "1px solid rgb(var(--line))", borderRadius: 12, fontSize: 12, color: "rgb(var(--ink))" }, cursor: { stroke: "rgb(var(--line))" } };

export function ChartCard({ title, sub, children, height = 240 }) {
  return (
    <div className="card p-4 sm:p-5">
      <p className="font-display font-bold">{title}</p>
      {sub && <p className="text-xs text-mute">{sub}</p>}
      <div className="mt-3 text-mute" style={{ height }}>{children}</div>
    </div>
  );
}

export function TrendChart({ data = [], x = "date", y = "views", color = COLORS[0], format = compact }) {
  if (!data.length) return <div className="grid h-full place-items-center text-sm">No data yet</div>;
  const id = `g${y}${color.slice(1)}`;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ left: -12, right: 4, top: 4 }}>
        <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.35} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
        <CartesianGrid vertical={false} stroke="rgb(var(--line))" />
        <XAxis dataKey={x} tickFormatter={shortDate} {...axis} minTickGap={24} />
        <YAxis tickFormatter={format} {...axis} width={48} />
        <Tooltip {...tip} labelFormatter={shortDate} formatter={(v) => [format(v), y]} />
        <Area type="monotone" dataKey={y} stroke={color} strokeWidth={2.5} fill={`url(#${id})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarsChart({ data = [], x = "name", y = "value", color = COLORS[1], format = compact }) {
  if (!data.length) return <div className="grid h-full place-items-center text-sm">No data yet</div>;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ left: -12, right: 4, top: 4 }}>
        <CartesianGrid vertical={false} stroke="rgb(var(--line))" />
        <XAxis dataKey={x} {...axis} tickFormatter={(v) => (String(v).length > 12 ? String(v).slice(0, 11) + "…" : v)} />
        <YAxis tickFormatter={format} {...axis} width={48} />
        <Tooltip {...tip} cursor={{ fill: "rgb(var(--sunk))" }} formatter={(v) => [format(v), y]} />
        <Bar dataKey={y} fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data = [] }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  if (!total) return <div className="grid h-full place-items-center text-sm">No data yet</div>;
  return (
    <div className="flex h-full items-center gap-4">
      <ResponsiveContainer width="55%" height="100%">
        <PieChart><Pie data={data} dataKey="value" innerRadius="62%" outerRadius="92%" paddingAngle={3} stroke="none">
          {data.map((d, i) => <Cell key={d.name} fill={d.color || COLORS[i % COLORS.length]} />)}</Pie><Tooltip {...tip} /></PieChart>
      </ResponsiveContainer>
      <ul className="space-y-1.5 text-sm text-ink">
        {data.map((d, i) => <li key={d.name} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color || COLORS[i % COLORS.length] }} />{d.name}<b className="ml-auto pl-3 tabular-nums">{d.value}</b></li>)}
      </ul>
    </div>
  );
}
