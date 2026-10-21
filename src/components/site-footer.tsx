import { Link } from "@tanstack/react-router";
import { Globe, IndianRupee, Heart } from "lucide-react";

const cols = [
  {
    title: "Support",
    links: [
      ["Help Centre", "/help"],
      ["Contact support", "/help/contact"],
      ["SafePay & Escrow", "/help"],
      ["Cancellation Policy", "/help"],
      ["Report a Safety Concern", "/help/contact"],
    ],
  },
  {
    title: "For Professionals",
    links: [
      ["Become a Karighar", "/become-a-pro"],
      ["Partner Portal", "/partner"],
      ["Pro Dashboard", "/dashboard"],
      ["Pro Growth & Standards", "/help"],
      ["Code on Social Security", "/admin"],
    ],
  },
  {
    title: "Karighar Platform",
    links: [
      ["How It Works", "/about"],
      ["Browse Catalog", "/services"],
      ["Find Karighars", "/professionals"],
      ["Pricing & Fees", "/pricing"],
      ["AI Room Planner", "/renovation-planner"],
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-surface-subtle">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Columns */}
        <div className="grid gap-10 sm:grid-cols-3">
          {cols.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map(([label, to]) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5">
            Made with <Heart className="size-3 fill-primary text-primary" /> in India &nbsp;·&nbsp;
            <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            &nbsp;·&nbsp;
            <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
            &nbsp;·&nbsp;
            © 2026 Karighar Technologies Pvt. Ltd.
          </p>
          <div className="flex items-center gap-6 font-medium">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Globe className="size-3.5" />
              English (IN) · हिन्दी · मराठी
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <IndianRupee className="size-3.5" />
              INR (₹)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
