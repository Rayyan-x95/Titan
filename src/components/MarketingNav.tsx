import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function MarketingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Announcement Bar */}
      <div className="bg-primary/10 border-b border-primary/20 py-2 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary sm:text-xs">
          Titan v1.0.0 is now live — Experience the future of Life OS
        </p>
      </div>

      <div className="border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-10">
          <Link to="/home" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <img src="/icons/falcon.png" alt="Titan logo" className="h-8 w-8 rounded-lg" />
            <span className="text-lg font-bold tracking-tight">Titan</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link
              to="/what-is-titan"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              What is Titan?
            </Link>
            <Link
              to="/personal-life-os"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Life OS
            </Link>
            <Link
              to="/features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              to="/blog"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Blog
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/welcome"
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Sign In
            </Link>
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary/90 hover:shadow-lg"
            >
              Launch
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
