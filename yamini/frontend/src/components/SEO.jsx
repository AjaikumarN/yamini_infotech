import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Yamini Infotech';
const DEFAULT_TITLE = 'Yamini Infotech | Xerox Machine Sales & Service in Tirunelveli';
const DEFAULT_DESCRIPTION = 'Yamini Infotech provides photocopier sales, printer service, toner supply, AMC maintenance and repair in Tirunelveli, Tenkasi and Nagercoil. 25+ years trusted support.';
const DEFAULT_IMAGE = 'https://yaminicopier.com/assets/main_logo.png';
const SITE_URL = 'https://yaminicopier.com';

/**
 * Reusable SEO component — sets <title>, meta tags, Open Graph, Twitter Cards, and JSON-LD.
 *
 * @param {string}  title        - Page title (appended with " | Yamini Infotech")
 * @param {string}  description  - Meta description (max 160 chars recommended)
 * @param {string}  path         - URL path (e.g. "/products")
 * @param {string}  image        - OG image URL
 * @param {string}  type         - OG type: "website" | "product" | "article"
 * @param {object}  jsonLd       - Structured data (JSON-LD) object
 * @param {string}  keywords     - SEO keywords string
 * @param {boolean} noindex      - Set true to prevent indexing (for admin/internal pages)
 */
export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '',
  image = DEFAULT_IMAGE,
  type = 'website',
  jsonLd,
  keywords,
  noindex = false,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const canonicalUrl = `${SITE_URL}${path}`;

  return (
    <Helmet>
      {/* Basic */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content="Yamini Infotech" />
      <link rel="canonical" href={canonicalUrl} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
      )}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={title || SITE_NAME} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}

/**
 * Build Product structured data for a product detail page.
 */
export function buildProductJsonLd(product) {
  if (!product) return null;

  const imageUrl = product.image_url
    ? (product.image_url.startsWith('http')
        ? product.image_url
        : `https://api.yaminicopier.com${product.image_url.startsWith('/') ? '' : '/'}${product.image_url}`)
    : DEFAULT_IMAGE;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} - available at Yamini Infotech, Tirunelveli`,
    image: imageUrl,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Yamini Infotech',
    },
    ...(product.model && { model: product.model }),
    ...(product.category && { category: product.category }),
    sku: product.product_id || `YI-${product.id}`,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/products/${product.id}`,
      priceCurrency: 'INR',
      price: product.price || 0,
      availability: product.stock_quantity > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Yamini Infotech',
      },
      itemCondition: 'https://schema.org/NewCondition',
    },
    ...(product.specifications && {
      additionalProperty: (() => {
        try {
          const specs = typeof product.specifications === 'string'
            ? JSON.parse(product.specifications)
            : product.specifications;
          return Object.entries(specs).map(([name, value]) => ({
            '@type': 'PropertyValue',
            name,
            value: String(value),
          }));
        } catch {
          return undefined;
        }
      })(),
    }),
  };
}

/**
 * Build LocalBusiness structured data (for home page).
 */
export function buildLocalBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': SITE_URL,
    name: 'Yamini Infotech',
    image: DEFAULT_IMAGE,
    url: SITE_URL,
    telephone: '+91 98421 22952',
    email: 'yaminiinfotechtvl@gmail.com',
    priceRange: '₹₹',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123, South Bypass Road, Palayamkottai',
      addressLocality: 'Tirunelveli',
      addressRegion: 'Tamil Nadu',
      postalCode: '627002',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 8.7139,
      longitude: 77.7567,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:30',
      closes: '19:00',
    },
    areaServed: [
      'Tirunelveli', 'Tenkasi', 'Nagercoil', 'Kanyakumari', 'Thoothukudi',
      'Ambasamudram', 'Sankarankovil', 'Rajapalayam', 'Srivaikundam',
      'Courtallam', 'Palayamkottai',
    ],
    sameAs: ['https://wa.me/919842122952'],
    description: 'Yamini Infotech provides photocopier sales, printer service, toner supply, AMC maintenance and repair in Tirunelveli, Tenkasi and Nagercoil. 25+ years trusted support.',
    foundingDate: '1998',
    knowsAbout: [
      'Xerox Machine Sales',
      'Photocopier Service',
      'Printer Repair',
      'Toner Supply',
      'AMC Maintenance',
      'CCTV Installation',
      'Konica Minolta',
      'Kyocera',
      'Canon',
      'Ricoh',
    ],
  };
}

/**
 * Build BreadcrumbList structured data.
 */
export function buildBreadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

/**
 * Build WebSite structured data with search action (helps Google Sitelinks Search Box).
 */
export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Yamini Infotech',
    alternateName: 'Yamini Copier',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/products?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Build Organization structured data.
 */
export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Yamini Infotech',
    url: SITE_URL,
    logo: DEFAULT_IMAGE,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-98421-22952',
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: ['English', 'Tamil'],
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123, South Bypass Road, Palayamkottai',
      addressLocality: 'Tirunelveli',
      addressRegion: 'Tamil Nadu',
      postalCode: '627002',
      addressCountry: 'IN',
    },
    sameAs: ['https://wa.me/919842122952'],
  };
}

/**
 * Build FAQPage structured data (Google FAQ rich results).
 */
export function buildFAQJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Build AggregateRating structured data (Google star ratings in search).
 */
export function buildAggregateRatingJsonLd({
  ratingValue = 4.8,
  reviewCount = 250,
  bestRating = 5,
} = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Yamini Infotech',
    image: DEFAULT_IMAGE,
    url: SITE_URL,
    telephone: '+91 98421 22952',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Tirunelveli',
      addressRegion: 'Tamil Nadu',
      addressCountry: 'IN',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue,
      bestRating,
      ratingCount: reviewCount,
      reviewCount,
    },
  };
}

/**
 * Build Review structured data for individual reviews.
 */
export function buildReviewJsonLd(reviews) {
  return reviews.map(r => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: r.rating,
      bestRating: 5,
    },
    author: {
      '@type': 'Person',
      name: r.name,
    },
    reviewBody: r.text,
    itemReviewed: {
      '@type': 'LocalBusiness',
      name: 'Yamini Infotech',
    },
  }));
}

/**
 * Build Article structured data (for blog posts).
 */
export function buildArticleJsonLd({ title, description, path, image, datePublished, dateModified, author = 'Yamini Infotech' }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image || DEFAULT_IMAGE,
    url: `${SITE_URL}${path}`,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: author,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Yamini Infotech',
      logo: {
        '@type': 'ImageObject',
        url: DEFAULT_IMAGE,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}${path}`,
    },
  };
}

/**
 * Build Service structured data for location pages.
 */
export function buildServiceJsonLd({ serviceName, serviceType, areaServed, description }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: serviceType || serviceName,
    provider: {
      '@type': 'LocalBusiness',
      name: 'Yamini Infotech',
      url: SITE_URL,
      telephone: '+91 98421 22952',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Tirunelveli',
        addressRegion: 'Tamil Nadu',
        addressCountry: 'IN',
      },
    },
    areaServed: {
      '@type': 'City',
      name: areaServed,
    },
    description,
    name: serviceName,
  };
}

/**
 * Build Offer structured data (for service/product pages).
 */
export function buildOfferJsonLd({ name, description, price, priceCurrency = 'INR', url, availability = 'InStock' }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name,
    description,
    price,
    priceCurrency,
    url: url ? `${SITE_URL}${url}` : SITE_URL,
    availability: `https://schema.org/${availability}`,
    seller: {
      '@type': 'LocalBusiness',
      name: 'Yamini Infotech',
      url: SITE_URL,
      telephone: '+91 98421 22952',
    },
    priceValidUntil: new Date(new Date().getFullYear() + 1, 0, 1).toISOString().split('T')[0],
  };
}

/**
 * Build multiple Offers for a service page (rental plans, AMC plans, etc.)
 */
export function buildOffersJsonLd(offers) {
  return {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: 'Yamini Infotech Services',
    itemListElement: offers.map(o => ({
      '@type': 'Offer',
      name: o.name,
      description: o.description,
      price: o.price,
      priceCurrency: o.priceCurrency || 'INR',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'LocalBusiness',
        name: 'Yamini Infotech',
      },
    })),
  };
}
