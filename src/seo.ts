import { useEffect } from 'react';

const appName = 'Titan';
const defaultDescription =
  'Titan is an installable, offline-first productivity app that unifies Tasks, Notes, and Finance.';
const defaultKeywords =
  'Titan, productivity app, tasks, notes, finance, offline-first, pwa, personal organization';
const defaultImage = '/Opengraph.png';

interface SeoConfig {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  keywords?: string;
}

function upsertMeta(selector: string, attr: 'name' | 'property', value: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, value);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

function upsertCanonical(url: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }

  element.setAttribute('href', url);
}

function resolveAbsoluteUrl(value: string, baseUrl: string) {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return `${baseUrl.replace(/\/$/, '')}/${value.replace(/^\//, '')}`;
  }
}

export function useSeo({ title, description, path, image, keywords }: SeoConfig) {
  useEffect(() => {
    const pageTitle = `${title} - ${appName}`;
    const resolvedDescription = description ?? defaultDescription;
    const resolvedImage = image ?? defaultImage;
    const resolvedKeywords = keywords ?? defaultKeywords;
    const publicBase = import.meta.env.VITE_PUBLIC_URL;
    const baseUrl =
      typeof publicBase === 'string' && /^https?:\/\//i.test(publicBase)
        ? publicBase
        : resolveAbsoluteUrl(String(publicBase ?? ''), window.location.origin);
    const resolvedPath = path ?? window.location.pathname;
    const resolvedUrl = resolveAbsoluteUrl(resolvedPath, baseUrl);
    const resolvedImageUrl = resolveAbsoluteUrl(resolvedImage, baseUrl);

    document.title = pageTitle;

    upsertMeta('meta[name="title"]', 'name', 'title', pageTitle);
    upsertMeta('meta[name="description"]', 'name', 'description', resolvedDescription);
    upsertMeta('meta[name="keywords"]', 'name', 'keywords', resolvedKeywords);
    upsertMeta('meta[name="author"]', 'name', 'author', appName);

    upsertMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', pageTitle);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', resolvedDescription);
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', resolvedImageUrl);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', resolvedUrl);
    upsertMeta('meta[property="og:site_name"]', 'property', 'og:site_name', appName);

    upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', pageTitle);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', resolvedDescription);
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', resolvedImageUrl);

    upsertCanonical(resolvedUrl);
  }, [description, image, keywords, path, title]);
}
