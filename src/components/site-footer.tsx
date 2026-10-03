import { Link } from "@tanstack/react-router";
import { Globe, IndianRupee } from "lucide-react";

const cols = [
  { title: "Support", links: [["Help Centre", "/help"], ["Get help with a project issue", "/help/contact"], ["Karighar Cover", "/help"], ["Cancellation options", "/help"], ["Report a safety concern", "/help/contact"]] },
  { title: "For professionals", links: [["Become a pro", "/become-a-pro"], ["List your services", "/dashboard"], ["Pro dashboard", "/dashboard"], ["Pro resources", "/help"], ["Community forum", "/"]] },
  { title: "Karighar", links: [["How it works", "/"], ["Browse Karighars", "/professionals"], ["AI room planner", "/renovation-planner"], ["Careers", "/"], ["Newsroom", "/"]] },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-muted">
      <div className="mx-auto max-w-[1760px] px-5 py-12 md:px-10 xl:px-20">
        <div className="grid gap-10 md:grid-cols-3">
          {cols.map((c) => (
            <div key={c.title}>
              <h3 className="font-semibold">{c.title}</h3>
              <ul className="mt-5 space-y-4">
                {c.links.map(([label, to]) => (
                  <li key={label}><Link to={to} className="hover:underline">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 text-sm md:flex-row md:items-center md:justify-between">
          <p>© 2026 Karighar · Privacy · Terms · Company details</p>
          <div className="flex items-center gap-6 font-semibold">
            <span className="flex items-center gap-2"><Globe className="size-4" /> English (IN)</span>
            <span className="flex items-center gap-1"><IndianRupee className="size-4" /> INR</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
