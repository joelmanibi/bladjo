import { useEffect } from 'react';

const SITE_NAME = 'Bladjo Hotel';
const DEFAULT_DESCRIPTION = 'Bladjo Hotel vous propose des chambres confortables et des salles de réception élégantes. Réservez votre séjour ou votre événement en ligne.';

const upsertMeta = (selector, attributes) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
};

const upsertLink = (selector, attributes) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('link');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
};

export function usePublicSeo({ title, description = DEFAULT_DESCRIPTION, canonicalPath = '/', schema }) {
  useEffect(() => {
    const canonicalUrl = `https://www.bladjo-hotel.com${canonicalPath}`;
    document.title = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Hôtel, chambres et salles de réception`;

    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: 'index, follow' });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'fr_FR' });
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: document.title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: document.title });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    upsertLink('link[rel="canonical"]', { rel: 'canonical', href: canonicalUrl });

    const scriptId = 'bladjo-structured-data';
    const existing = document.getElementById(scriptId);
    if (existing) existing.remove();

    if (schema) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = scriptId;
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    return () => {
      const current = document.getElementById(scriptId);
      if (current) current.remove();
    };
  }, [title, description, canonicalPath, schema]);
}

export const buildHotelSchema = (extra = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'Hotel',
  name: SITE_NAME,
  url: 'https://www.bladjo-hotel.com/',
  description: DEFAULT_DESCRIPTION,
  priceRange: 'FCFA',
  ...extra,
});

export const getSeoDescription = (fallback, entityDescription) => entityDescription || fallback || DEFAULT_DESCRIPTION;