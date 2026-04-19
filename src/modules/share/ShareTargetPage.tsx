import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '@/core/store';
import { useSeo } from '@/seo';

function buildShareNoteContent({
  title,
  text,
  url,
}: {
  title?: string;
  text?: string;
  url?: string;
}) {
  const parts: string[] = [];

  if (title?.trim()) parts.push(title.trim());
  if (text?.trim()) parts.push(text.trim());
  if (url?.trim()) parts.push(url.trim());

  return parts.join('\n\n').trim();
}

export function ShareTargetPage() {
  useSeo({
    title: 'Import shared content',
    description: 'Saving shared content into Titan.',
    path: '/share',
  });

  const navigate = useNavigate();
  const [params] = useSearchParams();
  const addNote = useStore((state) => state.addNote);
  const noteCreatedRef = useRef(false);

  useEffect(() => {
    if (noteCreatedRef.current) {
      return;
    }

    const title = params.get('title') ?? undefined;
    const text = params.get('text') ?? undefined;
    const url = params.get('url') ?? undefined;
    const content = buildShareNoteContent({ title, text, url });

    if (!content) {
      noteCreatedRef.current = true;
      navigate('/notes', { replace: true });
      return;
    }

    noteCreatedRef.current = true;

    void (async () => {
      try {
        await addNote({ content, tags: ['shared'] });
      } catch (error) {
        console.error('Failed to save shared content', error);
      } finally {
        navigate('/notes', { replace: true });
      }
    })();
  }, [addNote, navigate, params]);

  return null;
}

