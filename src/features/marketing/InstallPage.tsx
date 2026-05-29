import { MarketingLayout } from '@/components/MarketingLayout';
import { useSeo } from '@/hooks/useSeo';
import { Smartphone, Monitor, Download, ShieldCheck, Zap } from 'lucide-react';

export function InstallPage() {
  useSeo({
    title: 'Install Titan - Get the PWA on Mobile & Desktop',
    description:
      'Learn how to install Titan on your iPhone, Android, or Desktop. Enjoy a native-app experience with the flexibility of a PWA.',
    path: '/install-titan',
    breadcrumbs: [
      { name: 'Home', item: '/' },
      { name: 'Installation', item: '/install-titan' },
    ],
  });

  return (
    <MarketingLayout>
      <section className="px-6 py-24 text-center sm:px-10">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-5xl font-extrabold tracking-tight sm:text-7xl">
            Titan on <span className="text-primary">Every Device.</span>
          </h1>
          <p className="mb-12 text-lg text-muted-foreground sm:text-xl">
            Titan is a Progressive Web App (PWA), meaning you get a lightning-fast, native-like
            experience without the bloat of the App Store.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <div className="rounded-3xl border border-border/60 bg-card/40 p-10">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Smartphone className="h-7 w-7" />
            </div>
            <h2 className="mb-6 text-2xl font-bold">Mobile (iOS & Android)</h2>
            <ol className="space-y-6 text-muted-foreground">
              <li className="flex gap-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  1
                </span>
                <span>
                  Open <strong>titan.ninety5.in</strong> in your mobile browser (Safari or Chrome).
                </span>
              </li>
              <li className="flex gap-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  2
                </span>
                <span>
                  Tap the <strong>Share</strong> button (iOS) or the <strong>Menu</strong> icon
                  (Android).
                </span>
              </li>
              <li className="flex gap-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  3
                </span>
                <span>
                  Select <strong>"Add to Home Screen"</strong>.
                </span>
              </li>
              <li className="flex gap-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  4
                </span>
                <span>Launch Titan from your home screen just like a native app.</span>
              </li>
            </ol>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/40 p-10">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Monitor className="h-7 w-7" />
            </div>
            <h2 className="mb-6 text-2xl font-bold">Desktop (Mac & PC)</h2>
            <ol className="space-y-6 text-muted-foreground">
              <li className="flex gap-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  1
                </span>
                <span>Open Titan in Google Chrome or Microsoft Edge.</span>
              </li>
              <li className="flex gap-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  2
                </span>
                <span>
                  Look for the <strong>Install</strong> icon (computer with an arrow) in the address
                  bar.
                </span>
              </li>
              <li className="flex gap-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  3
                </span>
                <span>
                  Click <strong>Install</strong> and confirm.
                </span>
              </li>
              <li className="flex gap-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  4
                </span>
                <span>Access Titan from your Dock or Taskbar with full system integration.</span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-primary/5 py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-sm font-semibold text-primary">
              <ShieldCheck className="h-4 w-4" />
              Verified Safe & Efficient
            </div>
          </div>
          <h2 className="mb-6 text-3xl font-bold">The Benefits of a PWA</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              {
                title: 'Offline Access',
                desc: 'Fully functional without an internet connection.',
                icon: Zap,
              },
              {
                title: 'Instant Updates',
                desc: 'Always have the latest version without manual updates.',
                icon: Download,
              },
              {
                title: 'Privacy',
                desc: 'Secure local storage for all your personal data.',
                icon: ShieldCheck,
              },
            ].map((b) => (
              <div key={b.title} className="space-y-2">
                <h4 className="font-bold">{b.title}</h4>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
