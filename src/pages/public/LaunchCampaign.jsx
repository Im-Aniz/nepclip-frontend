import { Link } from "react-router-dom";
import { ArrowRight, MessageSquare, Rocket } from "lucide-react";
import InquiryForm from "../../components/InquiryForm";
import { useAuth } from "../../context/AuthContext";

export default function LaunchCampaign() {
  const { user } = useAuth();
  const self = user?.role === "brand" ? "/brand/campaigns/new" : "/register?role=brand";
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-10 text-center"><h1 className="text-4xl font-extrabold sm:text-5xl">Want to promote your content?</h1><p className="mx-auto mt-3 max-w-xl text-lg text-mute">Launch it yourself in minutes, or let our team set it up for you.</p></div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="card flex flex-col p-6"><span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand text-brand-ink"><Rocket /></span>
          <h2 className="text-2xl font-bold">Create a campaign</h2><p className="mt-2 flex-1 text-mute">Make a brand account, set your budget, rate and rules, then submit for review. Our team approves it before it goes live.</p>
          <Link to={self} className="btn btn-primary mt-5 self-start">{user?.role === "brand" ? "Open campaign builder" : "Create a brand account"}<ArrowRight size={16} /></Link></div>
        <a href="#team" className="card flex flex-col p-6 transition hover:border-brand/40"><span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-ink text-bg"><MessageSquare /></span>
          <h2 className="text-2xl font-bold">Talk to our team</h2><p className="mt-2 flex-1 text-mute">Tell us what you want to promote. We'll reach out, agree a plan, and build the campaign with you.</p>
          <span className="btn btn-dark mt-5 self-start">Fill in the form<ArrowRight size={16} /></span></a>
      </div>
      <div id="team" className="mx-auto mt-14 max-w-2xl scroll-mt-24"><h2 className="mb-4 text-2xl font-extrabold">Tell us about your campaign</h2><InquiryForm /></div>
    </div>
  );
}
