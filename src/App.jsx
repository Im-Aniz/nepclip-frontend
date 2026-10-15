import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppRedirect, GuestOnly, RequireRole } from "./components/guards";
import { Spinner } from "./components/ui";
import DashboardLayout from "./layouts/DashboardLayout";
import PublicLayout from "./layouts/PublicLayout";

const P = (f) => lazy(f);
const Home = P(() => import("./pages/public/Home"));
const Campaigns = P(() => import("./pages/public/Campaigns"));
const CampaignDetail = P(() => import("./pages/public/CampaignDetail"));
const { ForCreators, ForBrands, HowItWorks, Pricing, About } = {
  ForCreators: P(() => import("./pages/public/Info").then((m) => ({ default: m.ForCreators }))),
  ForBrands: P(() => import("./pages/public/Info").then((m) => ({ default: m.ForBrands }))),
  HowItWorks: P(() => import("./pages/public/Info").then((m) => ({ default: m.HowItWorks }))),
  Pricing: P(() => import("./pages/public/Info").then((m) => ({ default: m.Pricing }))),
  About: P(() => import("./pages/public/Info").then((m) => ({ default: m.About }))),
};
const LaunchCampaign = P(() => import("./pages/public/LaunchCampaign"));
const Contact = P(() => import("./pages/public/Contact"));
const Login = P(() => import("./pages/auth/Login"));
const Register = P(() => import("./pages/auth/Register"));
const { ForgotPassword, ResetPassword } = {
  ForgotPassword: P(() => import("./pages/auth/Recovery").then((m) => ({ default: m.ForgotPassword }))),
  ResetPassword: P(() => import("./pages/auth/Recovery").then((m) => ({ default: m.ResetPassword }))),
};
const Shared = {
  Notifications: P(() => import("./pages/Shared").then((m) => ({ default: m.Notifications }))),
  Settings: P(() => import("./pages/Shared").then((m) => ({ default: m.Settings }))),
};
const C = (n) => P(() => import("./pages/creator/index").then((m) => ({ default: m[n] })));
const B = (n) => P(() => import("./pages/brand/index").then((m) => ({ default: m[n] })));
const AdminBuilder = P(() => import("./pages/admin/index").then((m) => ({ default: m.CampaignBuilder })));
const A = (n) => P(() => import("./pages/admin/index").then((m) => ({ default: m[n] })));
const creator = Object.fromEntries(["Dashboard", "Browse", "Submissions", "Earnings", "Withdraw", "Leaderboard", "Referrals", "Accounts", "Profile", "Support"].map((n) => [n, C(n)]));
const brand = Object.fromEntries(["Dashboard", "Campaigns", "Builder", "CampaignView", "Support", "Profile"].map((n) => [n, B(n)]));
const admin = Object.fromEntries(["Dashboard", "Users", "Creators", "Brands", "Campaigns", "Requests", "Inquiries", "Submissions", "Withdrawals", "Transactions", "Fraud", "Reports", "SupportInbox", "Referrals", "Notify", "Settings", "Audit"].map((n) => [n, A(n)]));

export default function App() {
  return (
    <Suspense fallback={<div className="grid min-h-[60vh] place-items-center"><Spinner size={28} /></div>}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="campaign/:id" element={<CampaignDetail />} />
          <Route path="for-creators" element={<ForCreators />} />
          <Route path="for-brands" element={<ForBrands />} />
          <Route path="launch-campaign" element={<LaunchCampaign />} />
          <Route path="how-it-works" element={<HowItWorks />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="register" element={<GuestOnly><Register /></GuestOnly>} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="ref/:code" element={<GuestOnly><Register /></GuestOnly>} />
        </Route>

        <Route path="creator" element={<RequireRole role="creator"><DashboardLayout role="creator" /></RequireRole>}>
          <Route index element={<creator.Dashboard />} />
          <Route path="campaigns" element={<creator.Browse />} />
          <Route path="submissions" element={<creator.Submissions />} />
          <Route path="earnings" element={<creator.Earnings />} />
          <Route path="withdraw" element={<creator.Withdraw />} />
          <Route path="leaderboard" element={<creator.Leaderboard />} />
          <Route path="referrals" element={<creator.Referrals />} />
          <Route path="accounts" element={<creator.Accounts />} />
          <Route path="profile" element={<creator.Profile />} />
          <Route path="support" element={<creator.Support />} />
          <Route path="settings" element={<Shared.Settings />} />
          <Route path="notifications" element={<Shared.Notifications />} />
        </Route>

        <Route path="brand" element={<RequireRole role="brand"><DashboardLayout role="brand" /></RequireRole>}>
          <Route index element={<brand.Dashboard />} />
          <Route path="campaigns" element={<brand.Campaigns />} />
          <Route path="campaigns/new" element={<brand.Builder />} />
          <Route path="campaigns/:id/edit" element={<brand.Builder />} />
          <Route path="campaigns/:id" element={<brand.CampaignView />} />
          <Route path="support" element={<brand.Support />} />
          <Route path="profile" element={<brand.Profile />} />
          <Route path="settings" element={<Shared.Settings />} />
          <Route path="notifications" element={<Shared.Notifications />} />
        </Route>

        <Route path="admin" element={<RequireRole role="admin"><DashboardLayout role="admin" /></RequireRole>}>
          <Route index element={<admin.Dashboard />} />
          <Route path="users" element={<admin.Users />} />
          <Route path="creators" element={<admin.Creators />} />
          <Route path="brands" element={<admin.Brands />} />
          <Route path="campaigns" element={<admin.Campaigns />} />
          <Route path="campaigns/new" element={<AdminBuilder />} />
          <Route path="campaigns/:id/edit" element={<AdminBuilder />} />
          <Route path="requests" element={<admin.Requests />} />
          <Route path="inquiries" element={<admin.Inquiries />} />
          <Route path="submissions" element={<admin.Submissions />} />
          <Route path="withdrawals" element={<admin.Withdrawals />} />
          <Route path="transactions" element={<admin.Transactions />} />
          <Route path="fraud" element={<admin.Fraud />} />
          <Route path="reports" element={<admin.Reports />} />
          <Route path="support" element={<admin.SupportInbox />} />
          <Route path="referrals" element={<admin.Referrals />} />
          <Route path="notifications" element={<admin.Notify />} />
          <Route path="settings" element={<admin.Settings />} />
          <Route path="audit" element={<admin.Audit />} />
        </Route>
        <Route path="app/*" element={<AppRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
