import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "./ui";
import { useAuth, homeFor } from "../context/AuthContext";

export function RequireRole({ role, children }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <div className="grid min-h-screen place-items-center"><Spinner size={28} /></div>;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}
export function GuestOnly({ children }) {
  const { user, ready } = useAuth();
  if (ready && user) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}

/** Backend notification links use /app/<page>; send them to the right dashboard for the signed-in role. */
export function AppRedirect() {
  const { user, ready } = useAuth();
  const { pathname } = useLocation();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  const page = pathname.replace(/^\/app\/?/, "");
  const map = { reports: user.role === "brand" ? "support" : "notifications" };
  return <Navigate to={`${homeFor(user.role)}/${map[page] ?? page}`.replace(/\/$/, "")} replace />;
}
