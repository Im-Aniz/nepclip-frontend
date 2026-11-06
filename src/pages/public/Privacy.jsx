import { Link } from "react-router-dom";

const EMAIL = "nepclipsupport@gmail.com";   // contact address shown on this page: change it if you use another one
const UPDATED = "6 November 2026";

// Each section is [title, ...blocks]; a block is a paragraph string or an array (bullet list).
const SECTIONS = [
  ["1. Who we are",
    "NepClip is a Nepal-focused marketplace where brands run clipping campaigns and creators earn rewards for views on their own videos. This policy explains what personal information we collect, how we use it, and the choices you have. By using NepClip you agree to this policy and to our Terms."],
  ["2. Information we collect",
    ["**Account details:** your name, email address, phone number, city, password (stored hashed) and role (creator or brand). If you sign in with Google, we receive your name and email from Google.",
     "**Connected social accounts:** the handle, profile link, follower count and engagement figures of the YouTube, TikTok or Instagram accounts you connect.",
     "**Submission data:** the links to videos you submit and their public performance numbers (views, likes, comments, shares), caption, title and publishing date.",
     "**Payout details:** the eSewa, Khalti or bank account you give us to receive withdrawals, and your wallet and transaction records. Payout account details are stored encrypted.",
     "**Support messages:** messages and any photos or videos you send us, such as screen recordings of your analytics.",
     "**Technical data:** basic device, browser and IP information used to keep the service secure and to detect fraud."]],
  ["3. Data we receive from TikTok, Instagram and YouTube",
    "When you choose to connect an account, you log in on the platform's own page and approve what NepClip can access. We never see your password for those platforms.",
    ["**TikTok (Login Kit and Display API):** your TikTok open ID, display name, follower count and, for videos you submit, their view, like, comment and share counts. We do not post on your behalf, and we cannot read your private messages.",
     "**Instagram (Business and Creator accounts):** your account ID, username, follower count, and the public details and insights (such as views) of posts you submit.",
     "**YouTube:** public channel and video information, read through YouTube API Services. By using NepClip you also agree to the [YouTube Terms of Service](https://www.youtube.com/t/terms), and Google's use of data is described in the [Google Privacy Policy](https://policies.google.com/privacy)."],
    "We use this data only to confirm that an account and video are yours, to check them against campaign rules, to calculate rewards, and to detect fake or manipulated views. Access tokens are stored encrypted and are used only for these purposes."],
  ["4. How we use your information",
    ["To create and run your account and let you join campaigns.",
     "To verify ownership of accounts and videos and measure eligible views.",
     "To calculate rewards, keep wallet records, and process withdrawals.",
     "To prevent fraud, abuse and rule violations.",
     "To answer support requests and send service messages about your account, campaigns and payouts.",
     "To improve and secure NepClip, and to meet our legal obligations."]],
  ["5. Who we share it with",
    "We do not sell your personal information. We share it only as follows:",
    ["**Brands** running a campaign you joined can see your NepClip username, the videos you submitted to it and their performance.",
     "**Service providers** that help us operate NepClip, such as website and server hosting and sign-in providers, who may process data only on our behalf.",
     "**Authorities or other parties** when the law requires it, or to protect the rights and safety of NepClip, our users or others."]],
  ["6. Keeping and deleting your data",
    "We keep your information while your account is active and for as long as needed for payouts, accounting, dispute handling and legal requirements.",
    ["**Disconnect an account:** use **Remove** on the Connected Accounts page. This deletes the access tokens we stored for it. Performance figures already recorded for clips you submitted may be kept for payout and audit records.",
     "**Revoke access at the source:** you can also remove NepClip's access in your TikTok, Instagram or Google account settings at any time.",
     `**Delete your account or data:** email us at ${EMAIL} and we will delete or anonymise your personal information, except records we must keep by law or for unpaid or disputed payouts.`]],
  ["7. Security",
    "We use HTTPS, encrypt payout details and platform access tokens, and limit who can see them. No online service is completely secure, so please protect your password and tell us immediately if you suspect misuse of your account."],
  ["8. Your choices and rights",
    "You can view and update your profile in the app, disconnect social accounts, and ask us to correct or delete your information, or to stop using it for a particular purpose. Contact us using the address below and we will respond within a reasonable time."],
  ["9. Age",
    "NepClip is intended for people aged 16 and over. Creators under 18 must meet the extra requirements in our Terms. If you believe a child has given us personal information without the required consent, contact us and we will remove it."],
  ["10. Changes to this policy",
    "We may update this policy from time to time. The date at the top shows when it last changed, and we will notify you of significant changes in the app or by email."],
  ["11. Contact",
    `Questions or requests about privacy: **${EMAIL}**.`],
];

// minimal inline formatting: **bold** and [text](url)
function Rich({ text }) {
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).filter(Boolean).map((p, i) => {
    if (p.startsWith("**")) return <strong key={i} className="font-semibold text-ink">{p.slice(2, -2)}</strong>;
    const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (m) return <a key={i} href={m[2]} target="_blank" rel="noreferrer" className="text-brand underline">{m[1]}</a>;
    return p;
  });
}

export default function Privacy() {
  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center">
          <p className="label !text-brand">Legal</p>
          <h1 className="text-4xl font-extrabold sm:text-5xl">Privacy Policy</h1>
          <p className="mt-3 text-mute">Last updated: {UPDATED}</p>
        </div>
      </section>
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-12">
        {SECTIONS.map(([title, ...blocks]) => (
          <section key={title}>
            <h2 className="mb-3 text-xl font-extrabold">{title}</h2>
            <div className="space-y-3">
              {blocks.map((b, i) => Array.isArray(b)
                ? <ul key={i} className="ml-5 list-disc space-y-1.5 text-sm leading-relaxed text-mute">{b.map((li) => <li key={li}><Rich text={li} /></li>)}</ul>
                : <p key={i} className="text-sm leading-relaxed text-mute"><Rich text={b} /></p>)}
            </div>
          </section>
        ))}
        <p className="border-t border-line pt-6 text-sm text-mute">Our <Link to="/for-creators#terms" className="text-brand underline">Terms and Conditions</Link> also apply to your use of NepClip.</p>
      </div>
    </>
  );
}
