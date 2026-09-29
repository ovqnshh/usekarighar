import { Link } from '@tanstack/react-router';
import { Brand } from './karighar-shell';

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-10">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Brand />
            <p className="mt-4 text-sm text-muted-foreground leading-6">Find verified home professionals for any project — big or small. Quality work, transparent pricing.</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">For Customers</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground">How it works</Link></li>
              <li><Link to="/professionals" className="hover:text-foreground">Browse Karighars</Link></li>
              <li><Link to="/renovation-planner" className="hover:text-foreground">AI Renovation Planner</Link></li>
              <li><Link to="/my-projects" className="hover:text-foreground">My Projects</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">For Professionals</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li><Link to="/become-a-pro" className="hover:text-foreground">Become a Karighar</Link></li>
              <li><Link to="/dashboard" className="hover:text-foreground">Pro Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Company</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li><span className="hover:text-foreground cursor-pointer">About Us</span></li>
              <li><span className="hover:text-foreground cursor-pointer">Terms of Service</span></li>
              <li><span className="hover:text-foreground cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-foreground cursor-pointer">Contact Us</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
          <p>© 2026 Karighar. All rights reserved.</p>
          <p>Made with ❤️ in Mumbai</p>
        </div>
      </div>
    </footer>
  );
}
