import { MarketingLayout } from '@/components/MarketingLayout';
import { useSeo } from '@/hooks/useSeo';
import { FileText, Scale, AlertTriangle, Copyright, LifeBuoy, Zap } from 'lucide-react';

export function TermsPage() {
  useSeo({
    title: 'Terms of Service - Titan',
    description:
      'Read the terms and conditions for using Titan, the professional life operating system.',
    path: '/terms',
  });

  const sections = [
    {
      title: '1. Acceptance of Terms',
      icon: Scale,
      content:
        'By accessing or using Titan, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use the application.',
    },
    {
      title: '2. Use License',
      icon: Zap,
      content:
        'Titan is provided as a local-first application for your personal use. You are granted a non-exclusive license to use the app. Since Titan is open-source, you may also modify and redistribute it under the terms of its MIT license found in the GitHub repository.',
    },
    {
      title: '3. Data Responsibility',
      icon: AlertTriangle,
      content:
        'You acknowledge that Titan stores all data locally on your device. Titan does not provide cloud backups. You are solely responsible for backing up your data using the "Export" feature. We are not liable for any data loss resulting from device failure, browser clearing, or app deletion.',
    },
    {
      title: '4. Disclaimer',
      icon: LifeBuoy,
      content:
        'Titan is provided "as is" and "as available." We make no warranties, expressed or implied, regarding the application\'s accuracy, reliability, or suitability for any particular purpose.',
    },
    {
      title: '5. Limitations',
      icon: FileText,
      content:
        'In no event shall Titan or its contributors be liable for any damages (including, without limitation, damages for loss of data or profit) arising out of the use or inability to use Titan.',
    },
    {
      title: '6. Governing Law',
      icon: Copyright,
      content:
        'These terms are governed by the laws of the jurisdiction in which the software is being used, without regard to its conflict of law provisions.',
    },
  ];

  return (
    <MarketingLayout>
      <div className="mx-auto max-w-4xl px-6 py-20 sm:px-10">
        <header className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-6xl">Terms of Service</h1>
          <p className="text-lg text-muted-foreground">
            Effective Date: May 22, 2026 • Version 1.0.0
          </p>
        </header>

        <div className="space-y-12">
          <div className="prose prose-invert max-w-none mb-16">
            <p className="text-xl leading-relaxed text-foreground/80">
              Welcome to <strong>Titan</strong>. We've tried to keep our terms as simple as the app
              itself. Because Titan is a local-first tool, most of the responsibility for data
              management and security sits with you, the user.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {sections.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border border-border/40 bg-card/20 p-6 transition-all hover:border-primary/30"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-bold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.content}</p>
              </div>
            ))}
          </div>

          <section className="mt-16 space-y-8 rounded-3xl border border-border/40 bg-card/20 p-8 sm:p-12">
            <h2 className="text-2xl font-bold">Additional Disclosures</h2>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-bold text-primary">Production Software</h4>
                <p className="text-sm text-muted-foreground">
                  Titan is officially in its stable Production Release (v1.0.0). We strive for
                  absolute stability and data safety. However, because it is local-first, users
                  should perform regular manual backups using the built-in export features.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-primary">Open Source</h4>
                <p className="text-sm text-muted-foreground">
                  Titan is open-source software. These terms apply to the official hosted instance
                  at titanapp.qzz.io. If you are self-hosting your own version of Titan, you are
                  responsible for your own terms.
                </p>
              </div>
            </div>
          </section>

          <footer className="pt-12 text-center text-sm text-muted-foreground">
            <p>
              By continuing to use Titan, you acknowledge that you have read and understood these
              terms.
            </p>
          </footer>
        </div>
      </div>
    </MarketingLayout>
  );
}
