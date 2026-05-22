import { MarketingLayout } from '@/components/MarketingLayout';
import { useSeo } from '@/hooks/useSeo';
import { Shield, Lock, EyeOff, Database, ServerOff, UserCheck } from 'lucide-react';

export function PrivacyPage() {
  useSeo({
    title: 'Privacy Policy - Titan',
    description:
      'Learn how Titan protects your privacy. Our offline-first architecture means your data never leaves your device.',
    path: '/privacy',
    faqs: [
      {
        question: 'Is my data encrypted?',
        answer:
          "Your data is stored in your browser's IndexedDB. While it is not encrypted at rest by Titan itself, modern operating systems and browsers provide their own layers of encryption. We recommend using a device PIN or password for overall security.",
      },
      {
        question: 'Does Titan use Google Analytics?',
        answer:
          "No. We do not use any third-party analytics. We don't know how many people are using the app or which features are popular. We rely on direct user feedback for improvements.",
      },
      {
        question: 'What happens if I change my phone?',
        answer:
          'Since data is local, it won\'t automatically move to a new device. You must use the "Export JSON" feature in Settings on your old device and "Import JSON" on your new device to move your data.',
      },
    ],
  });

  const sections = [
    {
      title: 'Our Privacy Philosophy',
      icon: Shield,
      content:
        'Titan is built on the principle of "Privacy by Default." We believe that your personal data—your tasks, your notes, and your finances—should belong to you and only you. Our architecture is designed to ensure that we never have access to your sensitive information.',
    },
    {
      title: 'Zero Data Collection',
      icon: EyeOff,
      content:
        'Titan does not collect, store, or transmit your personal data to our servers. We do not use tracking cookies, we do not have user accounts on our backend, and we do not monitor your usage patterns. What you do in Titan is completely private.',
    },
    {
      title: 'Local Storage Only',
      icon: Database,
      content:
        "All the information you enter into Titan—including tasks, notes, expenses, and split-group details—is stored locally on your device using IndexedDB. This data remains on your browser's storage and is never uploaded to any cloud service by Titan.",
    },
    {
      title: 'No Third-Party Sharing',
      icon: ServerOff,
      content:
        "Because we don't collect your data, we have nothing to sell or share with third parties. There are no advertising trackers or third-party analytics integrated into the Titan application.",
    },
    {
      title: 'User Control',
      icon: UserCheck,
      content:
        'You have absolute control over your data. You can export your entire database as a JSON file at any time from the Settings menu, and you can permanently delete all local data with a single click. Once you clear your data, it is gone forever.',
    },
    {
      title: 'Security',
      icon: Lock,
      content:
        "While your data is stored on your device, we recommend using Titan's built-in App PIN and Biometric lock features to prevent unauthorized access if someone else handles your device. However, you are responsible for the physical security of your device.",
    },
  ];

  return (
    <MarketingLayout>
      <div className="mx-auto max-w-4xl px-6 py-20 sm:px-10">
        <header className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-6xl">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground">Last Updated: May 4, 2026 • Version 1.0</p>
        </header>

        <div className="space-y-16">
          <section className="rounded-3xl border border-primary/20 bg-primary/5 p-8 sm:p-12">
            <h2 className="mb-6 text-2xl font-bold text-primary">The Titan Promise</h2>
            <p className="text-lg leading-relaxed text-foreground/80">
              Titan is an offline-first Progressive Web App. This means the application code runs in
              your browser, but the <strong>database lives on your hardware</strong>. We have no
              "Admin" panel to see your data, no "Forgot Password" to reset your access, and no way
              to recover your data if you lose your device. This is the ultimate form of privacy.
            </p>
          </section>

          <div className="grid gap-12 sm:grid-cols-2">
            {sections.map((s) => (
              <div key={s.title} className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card border border-border/60 text-primary shadow-sm">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.content}</p>
              </div>
            ))}
          </div>

          <section className="pt-8 border-t border-border/40">
            <h2 className="mb-6 text-2xl font-bold">Frequently Asked Questions</h2>
            <div className="space-y-8">
              <div>
                <h4 className="mb-2 font-bold italic">"Is my data encrypted?"</h4>
                <p className="text-sm text-muted-foreground">
                  Your data is stored in your browser's IndexedDB. While it is not encrypted at rest
                  by Titan itself, modern operating systems and browsers provide their own layers of
                  encryption. We recommend using a device PIN or password for overall security.
                </p>
              </div>
              <div>
                <h4 className="mb-2 font-bold italic">"Does Titan use Google Analytics?"</h4>
                <p className="text-sm text-muted-foreground">
                  No. We do not use any third-party analytics. We don't know how many people are
                  using the app or which features are popular. We rely on direct user feedback for
                  improvements.
                </p>
              </div>
              <div>
                <h4 className="mb-2 font-bold italic">"What happens if I change my phone?"</h4>
                <p className="text-sm text-muted-foreground">
                  Since data is local, it won't automatically move to a new device. You must use the
                  "Export JSON" feature in Settings on your old device and "Import JSON" on your new
                  device to move your data.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-card/40 p-8 text-center sm:p-12 border border-border/60">
            <h2 className="mb-4 text-2xl font-bold">Questions?</h2>
            <p className="mb-8 text-muted-foreground">
              If you have any questions about this Privacy Policy or how Titan handles your data,
              reach out on GitHub.
            </p>
            <a
              href="https://github.com/Rayyan-x95/Titan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-foreground px-8 py-3 font-bold text-background transition-transform hover:scale-105 active:scale-95"
            >
              Contact on GitHub
            </a>
          </section>
        </div>
      </div>
    </MarketingLayout>
  );
}
