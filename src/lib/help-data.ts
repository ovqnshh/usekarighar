export type HelpArticle = {
  id: string;
  title: string;
  category: 'customers' | 'karighars' | 'trust' | 'payments';
  excerpt: string;
  content: string[]; // Array of markdown-like strings or paragraphs
  icon: string; // lucide icon name
};

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'how-safepay-works',
    title: 'How Karighar SafePay Escrow Works',
    category: 'payments',
    excerpt: 'Learn how your money is protected until the job is done.',
    icon: 'ShieldCheck',
    content: [
      '**What is SafePay?**',
      'Karighar SafePay is our secure escrow system. When you hire a professional, you do not pay them directly upfront. Instead, you deposit the funds into Karighar SafePay.',
      '**The Milestone System**',
      'Jobs are broken down into milestones (e.g., 20% for Arrival & Materials, 80% upon Completion).',
      'When a Karighar completes a milestone, you click "Release Funds" in your project dashboard, and the money is instantly transferred to their bank account.',
      '**What if there is a dispute?**',
      'If the work is incomplete or unsatisfactory, do not release the funds. Click the "Dispute" button in your chat, and our Trust & Safety team will step in to mediate.'
    ]
  },
  {
    id: 'bidding-war',
    title: 'How the Live Bidding Board works',
    category: 'customers',
    excerpt: 'Get the best price without messaging 10 different people.',
    icon: 'Zap',
    content: [
      '**Posting a Job**',
      'Instead of browsing, you can use our AI to diagnose your problem and click "Post to Local Board".',
      '**Receiving Bids**',
      'Your anonymous request is sent to all verified Karighars within a 5km radius.',
      'They will submit live bids (Price and ETA). You will receive notifications as bids roll in.',
      '**Choosing a Winner**',
      'Review the profiles, ratings, and bid prices. Click "Accept" on the one you like, and your contact info will be securely shared with them to begin the chat.'
    ]
  },
  {
    id: 'getting-more-jobs',
    title: 'How to get more jobs as a Karighar',
    category: 'karighars',
    excerpt: 'Tips to optimize your profile and win more bids.',
    icon: 'Briefcase',
    content: [
      '**1. Build a stunning portfolio**',
      'Customers want to see your past work. Upload high-quality before-and-after photos of your best projects.',
      '**2. Respond quickly on the Live Radar**',
      'Keep your Pro Dashboard open. When a job appears on the Local Board, be the first to bid. Speed wins 70% of jobs.',
      '**3. Use the AI Auto-Quote**',
      'Don\'t just send a number. Use our AI button in the chat to generate a professional, itemized quote. Customers trust professionals who break down Labour and Material costs.'
    ]
  }
];

export const HELP_CATEGORIES = [
  { id: 'customers', title: 'For Customers', desc: 'Booking, Bidding, and Guides' },
  { id: 'karighars', title: 'For Professionals', desc: 'Growing your business on Karighar' },
  { id: 'trust', title: 'Trust & Safety', desc: 'Verifications, Reviews, and Guidelines' },
  { id: 'payments', title: 'Payments & SafePay', desc: 'Escrow, Refunds, and Taxes' }
];
