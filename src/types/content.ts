export type MediaType = "image" | "video";

export interface MediaItem {
  id: string;
  title: string;
  alt: string;
  source: string;
  type: MediaType;
  originalUrl: string;
  localOriginal: string;
  localOptimized: string;
  createdAt: string;
}

export interface ServiceItem {
  slug: string;
  title: string;
  short: string;
  description: string;
  materials: string[];
  mediaIds?: string[];
}

export interface SeoConfig {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
}

export interface BrandCoordinates {
  lat?: number;
  lng?: number;
}

export interface BrandConfig {
  name?: string;
  legalName?: string;
  category?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  region?: string;
  country?: string;
  coordinates?: BrandCoordinates;
  phoneDisplay?: string;
  phoneValue?: string;
  email?: string;
  workHours?: string;
  workHoursIso?: string;
  instagram?: string;
  orderLink?: string;
  map2gis?: string;
  mapYandex?: string;
}

export interface HeroConfig {
  badge?: string;
  title?: string;
  subtitle?: string;
  primaryCta?: {
    text?: string;
    url?: string;
  };
  secondaryCta?: {
    text?: string;
    url?: string;
  };
}

export interface AboutConfig {
  title?: string;
  text?: string;
  facts?: string[];
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface MetricsConfig {
  instagramFollowers?: number;
  instagramPosts?: number;
  instagramHighlights?: number;
  twoGisRating?: number;
  twoGisReviews?: number;
}

export interface SectionBlock {
  title?: string;
  description?: string;
  enabled?: boolean;
  visibleFrom?: string;
  visibleTo?: string;
}

export interface ProcessSection extends SectionBlock {
  steps?: string[];
}

export interface ContactsSection {
  title?: string;
  enabled?: boolean;
  visibleFrom?: string;
  visibleTo?: string;
}

export interface SiteSections {
  order?: string[];
  services?: SectionBlock;
  process?: ProcessSection;
  materials?: SectionBlock;
  about?: SectionBlock;
  gallery?: SectionBlock;
  contacts?: ContactsSection;
}

export interface SiteData {
  seo?: SeoConfig;
  brand?: BrandConfig;
  hero?: HeroConfig;
  about?: AboutConfig;
  services?: ServiceItem[];
  advantages?: string[];
  faq?: FaqItem[];
  metrics?: MetricsConfig;
  sourceLinks?: string[];
  sections?: SiteSections;
}
