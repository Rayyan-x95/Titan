import { motion } from 'framer-motion';
import { MarketingLayout } from '@/components/MarketingLayout';
import { AnswerBlock } from '@/components/AnswerBlock';
import { useSeo } from '@/hooks/useSeo';
import { MARKETING_COPY } from '@/lib/core/marketingContent';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
  Clock,
  MinusCircle,
  PlusCircle,
  AlertCircle,
  Quote,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ComparisonTable } from '@/components/ComparisonTable';

export function MarketingLanding() {
  const { hero, problem, solution, outcomes, useCases, faqs } = MARKETING_COPY;

  useSeo({
    title: 'Titan - The All-In-One Personal Life Operating System',
    description:
      'Unify tasks, money, and thoughts into one connected, high-performance workspace. Built for clarity, speed, and privacy.',
    path: '/home',
    faqs: faqs,
  });

  return (
    <MarketingLayout>
      {/* 1. HERO SECTION */}
      <section className="relative px-6 py-24 text-center sm:px-10 lg:py-36">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary"
          >
            <ShieldCheck className="h-4 w-4" />
            Verified Offline-First & Private
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 text-5xl font-extrabold tracking-tight sm:text-7xl lg:leading-[1.1]"
          >
            {hero.headline}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-10 text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            {hero.subheadline}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              to="/onboarding"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-white transition-all hover:bg-primary/90 hover:shadow-2xl sm:w-auto"
            >
              {hero.ctaPrimary}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/features"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card/50 px-8 py-4 text-base font-semibold transition-all hover:bg-card sm:w-auto"
            >
              {hero.ctaSecondary}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 2. PROBLEM SECTION */}
      <section className="bg-card/20 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
            <div className="space-y-8">
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">{problem.headline}</h2>
              <p className="text-lg text-muted-foreground">{problem.description}</p>
              <div className="space-y-4">
                {problem.points.map((point) => (
                  <div key={point} className="flex gap-4 items-start">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500 mt-1">
                      <MinusCircle className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{point}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-border/60 bg-background/50 p-8 shadow-2xl">
              <div className="space-y-4 opacity-50 grayscale">
                <div className="flex items-center gap-3 rounded-lg bg-card p-3 border border-border">
                  <div className="h-4 w-4 rounded bg-blue-500" />
                  <div className="h-2 w-24 rounded bg-border" />
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-card p-3 border border-border">
                  <div className="h-4 w-4 rounded bg-emerald-500" />
                  <div className="h-2 w-32 rounded bg-border" />
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-card p-3 border border-border">
                  <div className="h-4 w-4 rounded bg-purple-500" />
                  <div className="h-2 w-20 rounded bg-border" />
                </div>
              </div>
              <div className="mt-8 flex items-center justify-center">
                <AlertCircle className="h-12 w-12 text-red-500/30" />
              </div>
              <p className="mt-6 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                The Cost of Fragmentation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SOLUTION SECTION */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1 rounded-3xl border border-primary/30 bg-primary/5 p-8 shadow-2xl shadow-primary/10">
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg bg-background p-3 border border-primary/20">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold">Everything is Connected</span>
                </div>
                <div className="ml-6 flex items-center gap-3 rounded-lg bg-background p-3 border border-emerald-500/20">
                  <Wallet className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-bold">Auto-Sync with Notes</span>
                </div>
                <div className="ml-12 flex items-center gap-3 rounded-lg bg-background p-3 border border-purple-500/20">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-bold">One Precise Timeline</span>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-8">
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">{solution.headline}</h2>
              <p className="text-lg text-muted-foreground">{solution.description}</p>
              <div className="space-y-4">
                {solution.points.map((point) => (
                  <div key={point} className="flex gap-4 items-start">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-1">
                      <PlusCircle className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. COMPARISON SECTION (GROWTH) */}
      <section className="bg-gradient-to-b from-card/20 to-transparent py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-5xl">
              Why Titan <span className="text-primary">Wins.</span>
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Fragmented apps keep your data in silos. Titan connects your life for absolute clarity
              and structural focus.
            </p>
          </div>
          <ComparisonTable />
        </div>
      </section>

      {/* 5. SOCIAL PROOF (TRUST) */}
      <section className="py-24 sm:py-32 border-y border-border/20">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="space-y-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Quote className="h-6 w-6" />
              </div>
              <p className="text-xl font-medium leading-relaxed italic text-foreground/80">
                "Titan is the first system that actually connects my bank account to my habit
                tracker. It changed how I view my productivity."
              </p>
              <div>
                <p className="font-bold">Sarah K.</p>
                <p className="text-sm text-muted-foreground">Product Designer & Freelancer</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <Quote className="h-6 w-6" />
              </div>
              <p className="text-xl font-medium leading-relaxed italic text-foreground/80">
                "As a student, keeping my notes and expenses in one place is a game changer. The
                offline-first speed is unmatched."
              </p>
              <div>
                <p className="font-bold">Marcus L.</p>
                <p className="text-sm text-muted-foreground">Computer Science Student</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 text-purple-500">
                <Quote className="h-6 w-6" />
              </div>
              <p className="text-xl font-medium leading-relaxed italic text-foreground/80">
                "Professional, private, and precise. I finally have a Life OS that I trust with my
                most sensitive data."
              </p>
              <div>
                <p className="font-bold">David R.</p>
                <p className="text-sm text-muted-foreground">Founder & Tech Lead</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FEATURES (OUTCOME-BASED) */}
      <section className="bg-card/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-5xl">
              Designed for <span className="text-primary">Impact.</span>
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Every tool in Titan is refined to provide maximum clarity with minimum input effort.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {outcomes.map((feat) => {
              const Icon =
                feat.icon === 'Zap'
                  ? Zap
                  : feat.icon === 'Wallet'
                    ? Wallet
                    : feat.icon === 'Sparkles'
                      ? Sparkles
                      : Clock;
              return (
                <Link
                  key={feat.title}
                  to={feat.link || '#'}
                  className="group relative overflow-hidden rounded-3xl border border-border/60 bg-background/40 p-10 transition-all hover:border-primary/40 hover:shadow-2xl hover:bg-background/60"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold">{feat.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feat.desc}</p>
                  <div className="mt-8 flex items-center gap-2 text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Learn More <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. USE CASES */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 text-center">
          <h2 className="mb-16 text-3xl font-bold">Titan is for everyone.</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {useCases.map((uc) => (
              <div key={uc.name} className="rounded-2xl border border-border/40 bg-card/10 p-8">
                <h4 className="mb-4 text-lg font-bold text-primary">{uc.name}</h4>
                <p className="text-sm text-muted-foreground">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. AI SEARCH OPTIMIZATION (ANSWER BLOCKS) */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnswerBlock
              question="What is Titan?"
              answer="Titan is a personal life operating system that unifies tasks, expenses, and notes into one connected platform. It helps users manage their daily productivity and financial health in a single, high-performance workspace."
            />
            <AnswerBlock
              question="Why use a personal life OS?"
              answer="A personal life operating system reduces mental clutter by consolidating fragmented tools. It provides a holistic view of your life, connecting your financial decisions to your daily goals and long-term projects."
            />
          </div>
        </div>
      </section>

      {/* 7. FAQ SECTION (MANDATORY FOR AI SEO) */}
      <section className="bg-card/20 py-24 sm:py-32 border-t border-border/40">
        <div className="mx-auto max-w-3xl px-6 sm:px-10">
          <h2 className="mb-4 text-center text-3xl font-bold">Frequently Asked Questions</h2>
          <p className="mb-12 text-center text-muted-foreground">
            Quick answers for those building their unified life operating system.
          </p>

          <div className="space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-2xl border border-border/60 bg-background/50 p-8"
              >
                <h3 className="mb-4 font-bold text-foreground text-lg">{faq.question}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. ABOUT TITAN (QUOTABLE SECTION) */}
      <section className="py-24 sm:py-32 border-t border-border/20">
        <div className="mx-auto max-w-3xl px-6 sm:px-10 text-center">
          <h2 className="mb-8 text-3xl font-bold">About Titan</h2>
          <div className="rounded-3xl border border-border/40 bg-card/10 p-10">
            <p className="text-lg leading-relaxed text-muted-foreground">
              Titan is a premium personal life operating system designed to help individuals manage
              tasks, expenses, and notes in one unified system. By connecting fragmented data points
              into a cohesive timeline, Titan empowers users to reclaim their focus and achieve
              structural clarity in their daily lives.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm font-bold text-primary">
              <span>Offline-First</span>
              <span>Privacy-Focused</span>
              <span>Unified Workspace</span>
              <span>High Performance</span>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="py-24 sm:py-32 text-center bg-gradient-to-b from-transparent to-primary/5">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-8 text-4xl font-extrabold tracking-tight sm:text-6xl">
            Ready to achieve structural clarity?
          </h2>
          <p className="mb-12 text-lg text-muted-foreground max-w-2xl mx-auto">
            Join the modern professionals who have reclaimed their focus and financial clarity. No
            subscriptions, no cloud tracking—just pure, unified productivity.
          </p>
          <div className="flex flex-col items-center justify-center gap-6">
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-3 rounded-2xl bg-primary px-12 py-6 text-xl font-bold text-white transition-all hover:scale-105 hover:shadow-2xl shadow-primary/40"
            >
              Launch Your Life OS
              <ArrowRight className="h-6 w-6" />
            </Link>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-bold text-muted-foreground uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Free Forever
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 100% Private
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Offline-First
              </span>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
