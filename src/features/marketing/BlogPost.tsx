import { useParams, Navigate, Link } from 'react-router-dom';
import { MarketingLayout } from '@/components/MarketingLayout';
import { useSeo } from '@/hooks/useSeo';
import { BLOG_POSTS } from './BlogPage';
import { ArrowLeft, Clock, User } from 'lucide-react';

export function BlogPost() {
  const { slug } = useParams();
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  useSeo({
    title: post ? `${post.title} - Titan Blog` : 'Titan Blog',
    description: post?.excerpt ?? 'Read Titan product updates, guides, and launch notes.',
    path: post ? `/blog/${post.slug}` : '/blog',
    breadcrumbs: [
      { name: 'Home', item: '/' },
      { name: 'Blog', item: '/blog' },
      ...(post ? [{ name: post.title, item: `/blog/${post.slug}` }] : []),
    ],
  });

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <MarketingLayout>
      <article className="mx-auto max-w-4xl px-6 py-20 sm:px-10">
        <Link
          to="/blog"
          className="mb-12 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        <header className="mb-12">
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
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">{post.title}</h1>
        </header>

        <div className="prose prose-invert prose-primary max-w-none text-lg leading-relaxed text-muted-foreground">
          {post.content.map((block) =>
            block.type === 'heading' ? (
              <h2 key={block.text}>{block.text}</h2>
            ) : (
              <p key={block.text}>{block.text}</p>
            ),
          )}
        </div>

        <div className="mt-20 border-t border-border/40 pt-12">
          <h3 className="mb-6 text-2xl font-bold">More from Titan</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {BLOG_POSTS.filter((p) => p.slug !== post.slug).map((other) => (
              <Link
                key={other.slug}
                to={`/blog/${other.slug}`}
                className="rounded-2xl border border-border/60 bg-card/40 p-6 transition-all hover:border-primary/40"
              >
                <h4 className="mb-2 font-bold group-hover:text-primary">{other.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">{other.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </article>
    </MarketingLayout>
  );
}
