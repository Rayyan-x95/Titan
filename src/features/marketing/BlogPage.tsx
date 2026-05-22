import { MarketingLayout } from '@/components/MarketingLayout';
import { useSeo } from '@/hooks/useSeo';
import { ArrowRight, Clock, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export type BlogContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string };

export const BLOG_POSTS = [
  {
    slug: 'the-future-of-personal-operating-systems',
    title: 'The Future of Personal Operating Systems',
    date: 'May 1, 2026',
    author: 'Titan Team',
    excerpt:
      'How unified digital workspaces are changing the way we manage our daily lives, productivity, and finances.',
    content: [
      {
        type: 'paragraph',
        text: 'In a world of fragmented apps, the concept of a Personal Operating System (Life OS) is becoming increasingly vital. We are no longer satisfied with disconnected tools; we need ecosystems that understand the context of our actions.',
      },
      { type: 'heading', text: 'The Problem of Fragmentation' },
      {
        type: 'paragraph',
        text: 'Most people use at least 5 different apps to manage their day: a calendar, a to-do list, a budget tracker, a note-taking app, and a communication tool. The constant switching between these interfaces leads to cognitive load and data silos.',
      },
      { type: 'heading', text: 'The Unified Solution' },
      {
        type: 'paragraph',
        text: 'Titan is built on the belief that your data should work for you. When your tasks are aware of your budget, and your notes are linked to your timeline, you gain insights that are impossible to see in isolated systems.',
      },
      {
        type: 'paragraph',
        text: "The future of productivity isn't more features; it's more integration. It's about reducing the friction between thought and action.",
      },
    ] satisfies BlogContentBlock[],
  },
  {
    slug: 'why-offline-first-matters-for-productivity',
    title: 'Why Offline-First Matters for Productivity',
    date: 'April 25, 2026',
    author: 'Titan Team',
    excerpt:
      'Discover why local-first architecture is the key to deep focus and reliable digital workflows.',
    content: [
      {
        type: 'paragraph',
        text: 'The cloud is great until it is not. When you are in the zone and your connection drops, the friction can break your concentration. Offline-first apps like Titan solve this by prioritizing local action.',
      },
      { type: 'heading', text: 'Reliability is Table Stakes' },
      {
        type: 'paragraph',
        text: 'A life operating system must be as reliable as a physical notebook. You should never have to wait for a spinning wheel when you are trying to capture a fleeting idea or log a quick expense.',
      },
      { type: 'heading', text: 'Privacy as a Default' },
      {
        type: 'paragraph',
        text: 'By keeping data local, offline-first apps naturally protect user privacy. In Titan, your financial history and personal thoughts stay on your device, giving you peace of mind in an era of data breaches.',
      },
    ] satisfies BlogContentBlock[],
  },
];

export function BlogPage() {
  useSeo({
    title: 'Titan Blog - Productivity, Finance & Life OS Insights',
    description:
      'Read the latest articles on personal organization, financial management, and the future of productivity from the Titan team.',
    path: '/blog',
    breadcrumbs: [
      { name: 'Home', item: '/' },
      { name: 'Blog', item: '/blog' },
    ],
  });

  return (
    <MarketingLayout>
      <section className="px-6 py-20 text-center sm:px-10">
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
          Latest <span className="text-primary">Insights.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Thoughts on productivity, finance, and building a better Life OS.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20 sm:px-10">
        <div className="grid grid-cols-1 gap-12">
          {BLOG_POSTS.map((post) => (
            <article
              key={post.slug}
              className="group overflow-hidden rounded-3xl border border-border/60 bg-card/40 transition-all hover:border-primary/40"
            >
              <div className="p-8 md:p-12">
                <div className="mb-6 flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {post.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {post.author}
                  </div>
                </div>
                <h2 className="mb-4 text-3xl font-bold transition-colors group-hover:text-primary">
                  <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="mb-8 text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>
                <Link
                  to={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 font-bold text-primary"
                >
                  Read Article <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="bg-primary/5 py-20 text-center border-y border-primary/10">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="mb-6 text-3xl font-bold">Start your Life OS journey today</h2>
          <p className="mb-10 text-muted-foreground">
            Experience the unified productivity and financial clarity shared in our articles.
          </p>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 font-bold text-white transition-all hover:scale-105"
          >
            Launch Titan for Free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
