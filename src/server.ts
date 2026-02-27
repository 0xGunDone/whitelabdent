import type { MediaItem, ServiceItem, SiteData } from "./types/content";

const compression = require("compression") as typeof import("compression");
const express = require("express") as typeof import("express");
const helmet = require("helmet") as typeof import("helmet");
const multer = require("multer") as typeof import("multer");
const path = require("node:path") as typeof import("node:path");
const fs = require("node:fs/promises") as typeof import("node:fs/promises");
const session = require("express-session") as typeof import("express-session");

interface UploadedFile {
  path: string;
  originalname: string;
  mimetype: string;
}

interface SessionLike {
  isAdmin?: boolean;
  destroy: (callback: () => void) => void;
}

interface RequestLike {
  protocol: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, unknown>;
  body: Record<string, unknown>;
  file?: UploadedFile;
  session?: SessionLike;
  get: (header: string) => string | undefined;
}

interface ResponseLike {
  redirect: (url: string) => void;
  render: (view: string, data: Record<string, unknown>) => void;
  status: (code: number) => ResponseLike;
  type: (value: string) => ResponseLike;
  send: (body: string) => void;
}

type NextLike = (error?: unknown) => void;

type HomeSectionKey = "services" | "process" | "materials" | "about" | "gallery" | "contacts";

interface SectionBlock {
  title: string;
  description: string;
  enabled: boolean;
  visibleFrom: string;
  visibleTo: string;
}

interface ProcessSection extends SectionBlock {
  steps: string[];
}

interface ContactsSection {
  title: string;
  enabled: boolean;
  visibleFrom: string;
  visibleTo: string;
}

interface HomeSectionsConfig {
  order: HomeSectionKey[];
  services: SectionBlock;
  process: ProcessSection;
  materials: SectionBlock;
  about: SectionBlock;
  gallery: SectionBlock;
  contacts: ContactsSection;
}

interface MetaOverrides {
  path?: string;
  image?: string | null;
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonical?: string;
  type?: string;
  noindex?: boolean;
}

interface MetaData {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  canonical: string;
  image: string | null;
  type: string;
  noindex: boolean;
}

interface ViewModel {
  site: SiteData & { sections: HomeSectionsConfig; services: ServiceItem[] };
  media: MediaItem[];
  imageMedia: MediaItem[];
  videoMedia: MediaItem[];
  mediaJobs: unknown[];
  isAdmin: boolean;
}

const { loadMedia, loadSite, saveMedia, saveSite } = require("./lib/content-store") as {
  loadSite: () => Promise<SiteData>;
  saveSite: (data: SiteData) => Promise<void>;
  loadMedia: () => Promise<MediaItem[]>;
  saveMedia: (data: MediaItem[]) => Promise<void>;
};
const {
  enqueueMediaJob,
  listMediaJobs,
  claimPendingMediaJob,
  markMediaJobDone,
  markMediaJobFailed,
  recycleStalledMediaJobs
} = require("./lib/media-job-queue") as {
  enqueueMediaJob: (type: "import_url" | "upload_file", payload: Record<string, unknown>) => number;
  listMediaJobs: (limit?: number) => unknown[];
  claimPendingMediaJob: () => {
    id: number;
    jobType: "import_url" | "upload_file";
    payload: Record<string, unknown>;
    status: string;
  } | null;
  markMediaJobDone: (jobId: number) => void;
  markMediaJobFailed: (jobId: number, message: string) => void;
  recycleStalledMediaJobs: (stalledMinutes?: number) => number;
};
const { ensureDirs, importRemoteMedia, processUploadedFile } = require("./lib/media-tools") as {
  ensureDirs: () => Promise<void>;
  importRemoteMedia: (url: string, title?: string) => Promise<MediaItem>;
  processUploadedFile: (file: UploadedFile, title?: string) => Promise<MediaItem>;
};
const {
  getCachedPage,
  putCachedPage,
  isRevalidating,
  setRevalidating,
  invalidatePageCache
} = require("./lib/page-cache") as {
  getCachedPage: (key: string) => { status: "hit" | "stale"; html: string } | null;
  putCachedPage: (key: string, html: string) => void;
  isRevalidating: (key: string) => boolean;
  setRevalidating: (key: string, value: boolean) => void;
  invalidatePageCache: (prefix?: string) => void;
};

const app = express();
const port = Number(process.env.PORT || 3000);
const uploadsDir = path.join(process.cwd(), "uploads");
const upload = multer({ dest: uploadsDir });

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "white-lab-admin";
const HOME_SECTION_KEYS: HomeSectionKey[] = ["services", "process", "materials", "about", "gallery", "contacts"];

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);
app.use(compression());
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(express.json({ limit: "2mb" }));
app.use(
  session({
    name: "white_lab_session",
    secret: process.env.SESSION_SECRET || "white-lab-dev-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

app.use(express.static(path.join(process.cwd(), "public"), { maxAge: "7d", index: false }));

function getBaseUrl(req: RequestLike): string {
  return process.env.SITE_URL || `${req.protocol}://${req.get("host")}`;
}

function toArrayFromTextarea(value: unknown): string[] {
  if (typeof value !== "string") {
    return [];
  }
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toArrayField(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === undefined || value === null) {
    return [];
  }
  return [value];
}

function parseJsonField<T>(value: unknown, fallback: T, fieldName: string): T {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(value) as T;
    return parsed;
  } catch {
    throw new Error(`Некорректный JSON в поле: ${fieldName}`);
  }
}

function sanitizeHomeSectionOrder(rawOrder: unknown): HomeSectionKey[] {
  const input = Array.isArray(rawOrder) ? rawOrder : [];
  const clean = input.filter((key): key is HomeSectionKey => HOME_SECTION_KEYS.includes(key as HomeSectionKey));
  const unique: HomeSectionKey[] = [];
  for (const key of clean) {
    if (!unique.includes(key)) {
      unique.push(key);
    }
  }
  for (const key of HOME_SECTION_KEYS) {
    if (!unique.includes(key)) {
      unique.push(key);
    }
  }
  return unique;
}

function defaultSectionConfig(): HomeSectionsConfig {
  return {
    order: [...HOME_SECTION_KEYS],
    services: {
      title: "Услуги и производственный контур",
      description: "Компактная архитектура работ: от цифрового моделирования до финального контроля в едином цикле.",
      enabled: true,
      visibleFrom: "",
      visibleTo: ""
    },
    process: {
      title: "Процесс",
      description:
        "Пять логических этапов с прозрачными контрольными точками, чтобы клиника и врач видели статус кейса в реальном времени.",
      steps: ["Бриф и протокол", "3D-моделирование", "Фрезеровка и печать", "Контроль точности", "Передача кейса"],
      enabled: true,
      visibleFrom: "",
      visibleTo: ""
    },
    materials: {
      title: "Материалы",
      description: "Используем только предсказуемые материалы и фиксируем их на каждом проекте до передачи кейса врачу.",
      enabled: true,
      visibleFrom: "",
      visibleTo: ""
    },
    about: {
      title: "О лаборатории",
      description: "Факты, процесс и стандарты White Lab.",
      enabled: true,
      visibleFrom: "",
      visibleTo: ""
    },
    gallery: {
      title: "Медиатека",
      description: "Визуальный архив лаборатории: не каталог карточек, а единая сценография реальных работ.",
      enabled: true,
      visibleFrom: "",
      visibleTo: ""
    },
    contacts: {
      title: "Контакты White Lab",
      enabled: true,
      visibleFrom: "",
      visibleTo: ""
    }
  };
}

function normalizeSectionVisibility<T extends { enabled?: unknown; visibleFrom?: unknown; visibleTo?: unknown }>(
  incoming: T | undefined,
  defaults: { enabled: boolean; visibleFrom: string; visibleTo: string }
): { enabled: boolean; visibleFrom: string; visibleTo: string } {
  return {
    enabled: incoming?.enabled === undefined ? defaults.enabled : Boolean(incoming?.enabled),
    visibleFrom: typeof incoming?.visibleFrom === "string" ? incoming.visibleFrom : defaults.visibleFrom,
    visibleTo: typeof incoming?.visibleTo === "string" ? incoming.visibleTo : defaults.visibleTo
  };
}

function normalizeSections(site: SiteData): HomeSectionsConfig {
  const defaults = defaultSectionConfig();
  const incoming = site?.sections || {};
  const processSteps = Array.isArray(incoming?.process?.steps)
    ? incoming.process.steps.map((step) => String(step || "").trim()).filter(Boolean)
    : [];

  return {
    ...defaults,
    ...(incoming as Partial<HomeSectionsConfig>),
    order: sanitizeHomeSectionOrder(incoming.order || defaults.order),
    services: {
      ...defaults.services,
      ...(incoming.services || {}),
      ...normalizeSectionVisibility(incoming.services, defaults.services)
    },
    process: {
      ...defaults.process,
      ...(incoming.process || {}),
      steps: processSteps.length ? processSteps : defaults.process.steps,
      ...normalizeSectionVisibility(incoming.process, defaults.process)
    },
    materials: {
      ...defaults.materials,
      ...(incoming.materials || {}),
      ...normalizeSectionVisibility(incoming.materials, defaults.materials)
    },
    about: {
      ...defaults.about,
      ...(incoming.about || {}),
      ...normalizeSectionVisibility(incoming.about, defaults.about)
    },
    gallery: {
      ...defaults.gallery,
      ...(incoming.gallery || {}),
      ...normalizeSectionVisibility(incoming.gallery, defaults.gallery)
    },
    contacts: {
      ...defaults.contacts,
      ...(incoming.contacts || {}),
      ...normalizeSectionVisibility(incoming.contacts, defaults.contacts)
    }
  };
}

function normalizeSectionDateInput(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function isSectionVisibleNow(section: { enabled?: boolean; visibleFrom?: string; visibleTo?: string }, now = Date.now()): boolean {
  if (section?.enabled === false) {
    return false;
  }

  const start = Date.parse(section?.visibleFrom || "");
  const end = Date.parse(section?.visibleTo || "");

  if (Number.isFinite(start) && now < start) {
    return false;
  }

  if (Number.isFinite(end) && now > end) {
    return false;
  }

  return true;
}

function resolveSectionOrderFromForm(body: Record<string, unknown>): HomeSectionKey[] {
  const ranked = HOME_SECTION_KEYS.map((key, index) => {
    const raw = Number(body[`section_order_${key}`]);
    const position = Number.isFinite(raw) && raw > 0 ? raw : index + 1;
    return { key, position, fallback: index + 1 };
  });

  ranked.sort((a, b) => {
    if (a.position === b.position) {
      return a.fallback - b.fallback;
    }
    return a.position - b.position;
  });

  return sanitizeHomeSectionOrder(ranked.map((item) => item.key));
}

function resolveSectionVisibilityFromForm(
  body: Record<string, unknown>,
  key: HomeSectionKey,
  fallback: { enabled: boolean; visibleFrom: string; visibleTo: string }
): { enabled: boolean; visibleFrom: string; visibleTo: string } {
  const rawEnabled = body[`section_${key}_enabled`];
  let enabled = fallback.enabled;

  if (Array.isArray(rawEnabled)) {
    enabled = rawEnabled.some((item) => String(item) === "1" || String(item).toLowerCase() === "true");
  } else if (rawEnabled !== undefined) {
    enabled = String(rawEnabled) === "1" || String(rawEnabled).toLowerCase() === "true";
  }

  return {
    enabled,
    visibleFrom: normalizeSectionDateInput(body[`section_${key}_visible_from`]),
    visibleTo: normalizeSectionDateInput(body[`section_${key}_visible_to`])
  };
}

function requireAdmin(req: RequestLike, res: ResponseLike, next: NextLike): void {
  if (req.session?.isAdmin) {
    next();
    return;
  }
  res.redirect("/admin/login");
}

function buildMeta(req: RequestLike, site: SiteData, overrides: MetaOverrides = {}): MetaData {
  const base = getBaseUrl(req);
  const canonicalPath = overrides.path || req.path;
  const rawImage = overrides.image || null;
  const image = rawImage ? (rawImage.startsWith("http") ? rawImage : `${base}${rawImage}`) : null;

  return {
    title: overrides.title || site?.seo?.title || "White Lab",
    description: overrides.description || site?.seo?.description || "White Lab",
    keywords: site?.seo?.keywords || "",
    ogTitle: overrides.ogTitle || site?.seo?.ogTitle || site?.seo?.title || "White Lab",
    ogDescription: overrides.ogDescription || site?.seo?.ogDescription || site?.seo?.description || "White Lab",
    canonical: `${base}${canonicalPath}`,
    image,
    type: overrides.type || "website",
    noindex: Boolean(overrides.noindex)
  };
}

async function buildViewModel(req: RequestLike): Promise<ViewModel> {
  const [site, media] = await Promise.all([loadSite(), loadMedia()]);
  site.sections = normalizeSections(site);
  site.services = (site.services || []).map((item) => ({
    ...item,
    materials: Array.isArray(item?.materials) ? item.materials : [],
    mediaIds: Array.isArray(item?.mediaIds) ? item.mediaIds : []
  }));
  const imageMedia = media.filter((item) => item.type === "image");
  const videoMedia = media.filter((item) => item.type === "video");

  return {
    site,
    media,
    imageMedia,
    videoMedia,
    mediaJobs: [],
    isAdmin: Boolean(req.session?.isAdmin)
  };
}

function serviceMeta(site: SiteData, service: ServiceItem): MetaOverrides {
  return {
    title: `${service.title} | ${site?.brand?.name || "White Lab"}`,
    description: service.short || service.description || site?.seo?.description || "",
    ogTitle: `${service.title} — ${site?.brand?.name || "White Lab"}`,
    ogDescription: service.short || service.description || ""
  };
}

function buildStructuredData(site: SiteData, firstImageUrl: string | null): Array<Record<string, unknown>> {
  const medicalBusiness = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: site?.brand?.legalName || site?.brand?.name,
    image: firstImageUrl || undefined,
    url: site?.sourceLinks?.[0] || undefined,
    telephone: site?.brand?.phoneDisplay,
    address: {
      "@type": "PostalAddress",
      streetAddress: site?.brand?.address,
      addressLocality: site?.brand?.city,
      postalCode: site?.brand?.postalCode,
      addressRegion: site?.brand?.region,
      addressCountry: site?.brand?.country || "Россия"
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: site?.brand?.coordinates?.lat,
      longitude: site?.brand?.coordinates?.lng
    },
    openingHours: site?.brand?.workHoursIso,
    sameAs: [site?.brand?.instagram, site?.brand?.map2gis, site?.brand?.mapYandex].filter(Boolean)
  };

  const faqEntities = (site?.faq || [])
    .filter((item) => item?.q && item?.a)
    .map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a
      }
    }));

  const faqPage = faqEntities.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqEntities
      }
    : null;

  const serviceItems = (site?.services || [])
    .filter((item) => item?.title && item?.slug)
    .map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      url: item.slug.startsWith("http") ? item.slug : `/services/${item.slug}`
    }));

  const serviceList = serviceItems.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: serviceItems
      }
    : null;

  return [medicalBusiness, faqPage, serviceList].filter(Boolean) as Array<Record<string, unknown>>;
}

function withAbsoluteServiceUrls(baseUrl: string, structuredData: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return structuredData.map((entity) => {
    if (entity?.["@type"] !== "ItemList") {
      return entity;
    }

    return {
      ...entity,
      itemListElement: ((entity.itemListElement as Array<Record<string, unknown>>) || []).map((item) => ({
        ...item,
        url:
          typeof item.url === "string" && item.url.startsWith("http")
            ? item.url
            : `${baseUrl}${String(item.url || "")}`
      }))
    };
  });
}

function uniqueBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }
  return result;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function buildSectionVisibilityMap(sections: HomeSectionsConfig): Record<HomeSectionKey, boolean> {
  return {
    services: isSectionVisibleNow(sections.services),
    process: isSectionVisibleNow(sections.process),
    materials: isSectionVisibleNow(sections.materials),
    about: isSectionVisibleNow(sections.about),
    gallery: isSectionVisibleNow(sections.gallery),
    contacts: isSectionVisibleNow(sections.contacts)
  };
}

async function renderTemplate(view: string, data: Record<string, unknown>): Promise<string> {
  return new Promise((resolve, reject) => {
    app.render(view, data, (error: unknown, html: string) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(html);
    });
  });
}

async function renderWithPublicCache(
  req: RequestLike,
  res: ResponseLike,
  cacheKey: string,
  renderer: () => Promise<{ view: string; data: Record<string, unknown>; statusCode?: number }>
): Promise<void> {
  const allowCache = !req.session?.isAdmin;

  if (allowCache) {
    const cached = getCachedPage(cacheKey);
    if (cached?.status === "hit") {
      res.type("text/html").send(cached.html);
      return;
    }

    if (cached?.status === "stale") {
      res.type("text/html").send(cached.html);

      if (!isRevalidating(cacheKey)) {
        setRevalidating(cacheKey, true);
        renderer()
          .then(async ({ view, data, statusCode }) => {
            if ((statusCode || 200) === 200) {
              const html = await renderTemplate(view, data);
              putCachedPage(cacheKey, html);
            }
          })
          .catch(() => {})
          .finally(() => {
            setRevalidating(cacheKey, false);
          });
      }

      return;
    }
  }

  const rendered = await renderer();
  const statusCode = rendered.statusCode || 200;
  const html = await renderTemplate(rendered.view, rendered.data);
  if (allowCache && statusCode === 200) {
    putCachedPage(cacheKey, html);
  }

  if (statusCode !== 200) {
    res.status(statusCode);
  }
  res.type("text/html").send(html);
}

app.get("/", async (req, res, next) => {
  try {
    await renderWithPublicCache(req, res, "page:/", async () => {
      const vm = await buildViewModel(req);
      const heroVisual = vm.videoMedia[0] || vm.imageMedia[0] || null;
      const heroPoster =
        heroVisual?.type === "video"
          ? vm.imageMedia.find((item) => item.localOptimized !== heroVisual.localOptimized) || vm.imageMedia[0] || null
          : null;
      const uniqueImages = uniqueBy(vm.imageMedia, (item) => item.localOptimized || item.id);
      const uniqueVideos = uniqueBy(vm.videoMedia, (item) => item.localOptimized || item.id);
      const gallery = uniqueImages
        .filter(
          (item) => item.localOptimized !== heroVisual?.localOptimized && item.localOptimized !== heroPoster?.localOptimized
        )
        .slice(0, 10);
      const reels = uniqueVideos
        .filter((item) => item.localOptimized !== heroVisual?.localOptimized)
        .slice(0, 3);
      const metaImage =
        heroVisual?.type === "image"
          ? heroVisual.localOptimized
          : heroPoster?.localOptimized || vm.imageMedia[0]?.localOptimized || null;

      const meta = buildMeta(req, vm.site, {
        image: metaImage
      });
      const sectionVisibility = buildSectionVisibilityMap(vm.site.sections);
      const visibleSectionOrder = vm.site.sections.order.filter((key) => sectionVisibility[key]);

      return {
        view: "home",
        data: {
          ...vm,
          page: "home",
          heroVisual,
          heroPoster,
          gallery,
          reels,
          sectionVisibility,
          visibleSectionOrder,
          structuredData: withAbsoluteServiceUrls(getBaseUrl(req), buildStructuredData(vm.site, meta.image || null)),
          meta
        }
      };
    });
  } catch (error) {
    next(error);
  }
});

app.get("/services/:slug", async (req, res, next) => {
  try {
    const cacheKey = `page:service:${req.params.slug}`;
    await renderWithPublicCache(req, res, cacheKey, async () => {
      const vm = await buildViewModel(req);
      const services = vm.site?.services || [];
      const service = services.find((item) => item.slug === req.params.slug);

      if (!service) {
        return {
          view: "service",
          statusCode: 404,
          data: {
            ...vm,
            page: "service",
            service: null,
            related: services.slice(0, 3),
            meta: buildMeta(req, vm.site, {
              title: "Услуга не найдена",
              description: vm.site?.seo?.description,
              noindex: true
            })
          }
        };
      }

      const meta = buildMeta(req, vm.site, {
        ...serviceMeta(vm.site, service)
      });
      const serviceMedia = (service?.mediaIds || [])
        .map((id) => vm.media.find((item) => item.id === id))
        .filter(Boolean);

      return {
        view: "service",
        data: {
          ...vm,
          page: "service",
          service,
          serviceMedia,
          related: services.filter((item) => item.slug !== service.slug).slice(0, 3),
          meta
        }
      };
    });
  } catch (error) {
    next(error);
  }
});

app.get("/admin/login", async (req, res) => {
  if (req.session?.isAdmin) {
    res.redirect("/admin");
    return;
  }

  res.render("admin/login", {
    page: "admin-login",
    error: null,
    meta: {
      title: "Вход в панель управления | White Lab",
      description: "Панель управления сайта White Lab",
      noindex: true,
      canonical: `${getBaseUrl(req)}/admin/login`
    }
  });
});

app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.redirect("/admin");
    return;
  }

  res.status(401).render("admin/login", {
    page: "admin-login",
    error: "Неверный логин или пароль",
    meta: {
      title: "Вход в панель управления | White Lab",
      description: "Панель управления сайта White Lab",
      noindex: true,
      canonical: `${getBaseUrl(req)}/admin/login`
    }
  });
});

app.post("/admin/logout", requireAdmin, (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});

app.get("/admin", requireAdmin, async (req, res, next) => {
  try {
    const vm = await buildViewModel(req);
    const mediaJobs = listMediaJobs(40);

    res.render("admin/dashboard", {
      ...vm,
      mediaJobs,
      page: "admin",
      success: req.query.success || "",
      error: req.query.error || "",
      serializedServices: JSON.stringify(vm.site?.services || [], null, 2),
      serializedFaq: JSON.stringify(vm.site?.faq || [], null, 2),
      factsText: (vm.site?.about?.facts || []).join("\n"),
      advantagesText: (vm.site?.advantages || []).join("\n"),
      sourceLinksText: (vm.site?.sourceLinks || []).join("\n"),
      sectionProcessStepsText: (vm.site?.sections?.process?.steps || []).join("\n"),
      meta: {
        title: "Панель управления | White Lab",
        description: "Управление контентом White Lab",
        noindex: true,
        canonical: `${getBaseUrl(req)}/admin`
      }
    });
  } catch (error) {
    next(error);
  }
});

app.post("/admin/content", requireAdmin, async (req, res) => {
  try {
    const current = await loadSite();
    const currentSections = normalizeSections(current);
    const processStepsInput = toArrayFromTextarea(req.body.section_process_steps);

    const next = {
      ...current,
      seo: {
        ...current.seo,
        title: req.body.seo_title,
        description: req.body.seo_description,
        keywords: req.body.seo_keywords,
        ogTitle: req.body.seo_og_title,
        ogDescription: req.body.seo_og_description
      },
      brand: {
        ...current.brand,
        name: req.body.brand_name,
        legalName: req.body.brand_legal_name,
        category: req.body.brand_category,
        city: req.body.brand_city,
        address: req.body.brand_address,
        postalCode: req.body.brand_postal_code,
        region: req.body.brand_region,
        country: req.body.brand_country,
        phoneDisplay: req.body.brand_phone_display,
        phoneValue: req.body.brand_phone_value,
        email: req.body.brand_email,
        workHours: req.body.brand_work_hours,
        workHoursIso: req.body.brand_work_hours_iso,
        instagram: req.body.brand_instagram,
        orderLink: req.body.brand_order_link,
        map2gis: req.body.brand_map_2gis,
        mapYandex: req.body.brand_map_yandex,
        coordinates: {
          lat: Number(req.body.brand_lat || current?.brand?.coordinates?.lat || 0),
          lng: Number(req.body.brand_lng || current?.brand?.coordinates?.lng || 0)
        }
      },
      hero: {
        ...current.hero,
        badge: req.body.hero_badge,
        title: req.body.hero_title,
        subtitle: req.body.hero_subtitle,
        primaryCta: {
          text: req.body.hero_primary_text,
          url: req.body.hero_primary_url
        },
        secondaryCta: {
          text: req.body.hero_secondary_text,
          url: req.body.hero_secondary_url
        }
      },
      about: {
        ...current.about,
        title: req.body.about_title,
        text: req.body.about_text,
        facts: toArrayFromTextarea(req.body.about_facts)
      },
      advantages: toArrayFromTextarea(req.body.advantages),
      services: parseJsonField(req.body.services_json, current.services || [], "Услуги"),
      faq: parseJsonField(req.body.faq_json, current.faq || [], "ЧаВо"),
      sourceLinks: toArrayFromTextarea(req.body.source_links),
      sections: {
        ...currentSections,
        order: resolveSectionOrderFromForm(req.body),
        services: {
          ...currentSections.services,
          title: req.body.section_services_title || currentSections.services.title,
          description: req.body.section_services_description || currentSections.services.description,
          ...resolveSectionVisibilityFromForm(req.body, "services", currentSections.services)
        },
        process: {
          ...currentSections.process,
          title: req.body.section_process_title || currentSections.process.title,
          description: req.body.section_process_description || currentSections.process.description,
          steps: processStepsInput.length > 0 ? processStepsInput : currentSections.process.steps,
          ...resolveSectionVisibilityFromForm(req.body, "process", currentSections.process)
        },
        materials: {
          ...currentSections.materials,
          title: req.body.section_materials_title || currentSections.materials.title,
          description: req.body.section_materials_description || currentSections.materials.description,
          ...resolveSectionVisibilityFromForm(req.body, "materials", currentSections.materials)
        },
        about: {
          ...currentSections.about,
          title: req.body.section_about_title || currentSections.about.title,
          description: req.body.section_about_description || currentSections.about.description,
          ...resolveSectionVisibilityFromForm(req.body, "about", currentSections.about)
        },
        gallery: {
          ...currentSections.gallery,
          title: req.body.section_gallery_title || currentSections.gallery.title,
          description: req.body.section_gallery_description || currentSections.gallery.description,
          ...resolveSectionVisibilityFromForm(req.body, "gallery", currentSections.gallery)
        },
        contacts: {
          ...currentSections.contacts,
          title: req.body.section_contacts_title || currentSections.contacts.title,
          ...resolveSectionVisibilityFromForm(req.body, "contacts", currentSections.contacts)
        }
      },
      metrics: {
        ...current.metrics,
        instagramFollowers: Number(req.body.metric_instagram_followers || 0),
        instagramPosts: Number(req.body.metric_instagram_posts || 0),
        instagramHighlights: Number(req.body.metric_instagram_highlights || 0),
        twoGisRating: Number(req.body.metric_2gis_rating || 0),
        twoGisReviews: Number(req.body.metric_2gis_reviews || 0)
      }
    };

    await saveSite(next);
    invalidatePageCache("page:");
    res.redirect("/admin?success=Контент обновлён");
  } catch (error) {
    const message = encodeURIComponent(getErrorMessage(error, "Ошибка сохранения"));
    res.redirect(`/admin?error=${message}`);
  }
});

app.post("/admin/media/import", requireAdmin, async (req, res) => {
  try {
    const { import_url: importUrl, import_title: importTitle } = req.body;
    if (!importUrl) {
      throw new Error("Укажите URL для импорта");
    }

    const jobId = enqueueMediaJob("import_url", {
      url: String(importUrl),
      title: String(importTitle || "")
    });

    res.redirect(`/admin?success=${encodeURIComponent(`Импорт поставлен в очередь (задача #${jobId})`)}`);
  } catch (error) {
    const message = encodeURIComponent(getErrorMessage(error, "Ошибка импорта"));
    res.redirect(`/admin?error=${message}`);
  }
});

app.post("/admin/media/upload", requireAdmin, upload.single("media_file"), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error("Файл не выбран");
    }

    const jobId = enqueueMediaJob("upload_file", {
      path: req.file.path,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      title: String(req.body.upload_title || "")
    });

    res.redirect(`/admin?success=${encodeURIComponent(`Файл поставлен в очередь обработки (#${jobId})`)}`);
  } catch (error) {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    const message = encodeURIComponent(getErrorMessage(error, "Ошибка загрузки"));
    res.redirect(`/admin?error=${message}`);
  }
});

app.post("/admin/services", requireAdmin, async (req, res) => {
  try {
    const current = await loadSite();
    const existingBySlug = new Map((current.services || []).map((item) => [item.slug, item]));

    const slugs = toArrayField(req.body.service_slug).map((value) => String(value || "").trim());
    const titles = toArrayField(req.body.service_title).map((value) => String(value || "").trim());
    const shorts = toArrayField(req.body.service_short).map((value) => String(value || "").trim());
    const descriptions = toArrayField(req.body.service_description).map((value) => String(value || "").trim());
    const materialsRaw = toArrayField(req.body.service_materials);
    const mediaIdsRaw = toArrayField(req.body.service_media_ids);
    const maxLength = Math.max(slugs.length, titles.length, shorts.length, descriptions.length, materialsRaw.length, mediaIdsRaw.length);
    const nextServices = [];

    for (let index = 0; index < maxLength; index += 1) {
      const slug = slugs[index] || "";
      const title = titles[index] || "";

      if (!slug && !title) {
        continue;
      }

      if (!slug || !title) {
        throw new Error(`Строка услуги #${index + 1}: обязательны slug и title.`);
      }

      const previous = existingBySlug.get(slug) || {};
      nextServices.push({
        ...previous,
        slug,
        title,
        short: shorts[index] || "",
        description: descriptions[index] || "",
        materials: toArrayFromTextarea(materialsRaw[index]),
        mediaIds: toArrayFromTextarea(mediaIdsRaw[index])
      });
    }

    if (!nextServices.length) {
      throw new Error("Нужно указать хотя бы одну услугу.");
    }

    await saveSite({
      ...current,
      services: nextServices
    });
    invalidatePageCache("page:");

    res.redirect("/admin?success=Страницы услуг обновлены");
  } catch (error) {
    const message = encodeURIComponent(getErrorMessage(error, "Ошибка сохранения услуг"));
    res.redirect(`/admin?error=${message}`);
  }
});

app.post("/admin/media/update-meta", requireAdmin, async (req, res) => {
  try {
    const mediaId = String(req.body.media_id || "").trim();
    if (!mediaId) {
      throw new Error("Не выбран идентификатор медиа");
    }

    const media = await loadMedia();
    const index = media.findIndex((item) => item.id === mediaId);
    if (index < 0) {
      throw new Error("Медиа не найдено");
    }

    media[index] = {
      ...media[index],
      title: String(req.body.media_title || "").trim(),
      alt: String(req.body.media_alt || "").trim()
    };

    await saveMedia(media);
    invalidatePageCache("page:");
    res.redirect("/admin?success=Метаданные медиа обновлены");
  } catch (error) {
    const message = encodeURIComponent(getErrorMessage(error, "Ошибка обновления медиа"));
    res.redirect(`/admin?error=${message}`);
  }
});

app.post("/admin/media/delete", requireAdmin, async (req, res) => {
  try {
    const { media_id: mediaId } = req.body;
    if (!mediaId) {
      throw new Error("Не выбран идентификатор медиа");
    }

    const media = await loadMedia();
    const item = media.find((entry) => entry.id === mediaId);
    const next = media.filter((entry) => entry.id !== mediaId);

    if (item) {
      const filePaths = [item.localOriginal, item.localOptimized]
        .filter(Boolean)
        .map((localPath) => path.join(process.cwd(), "public", localPath.replace("/media/", "media/")));

      await Promise.all(
        filePaths.map(async (filePath) => {
          await fs.unlink(filePath).catch(() => {});
        })
      );
    }

    await saveMedia(next);
    invalidatePageCache("page:");
    res.redirect("/admin?success=Медиа удалено");
  } catch (error) {
    const message = encodeURIComponent(getErrorMessage(error, "Ошибка удаления"));
    res.redirect(`/admin?error=${message}`);
  }
});

app.get("/robots.txt", (req, res) => {
  const base = getBaseUrl(req);
  res.type("text/plain");
  res.send(`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
});

app.get("/sitemap.xml", async (req, res) => {
  const site = await loadSite();
  const base = getBaseUrl(req);
  const pages = ["/"];

  for (const service of site.services || []) {
    pages.push(`/services/${service.slug}`);
  }

  const urlItems = pages
    .map((item) => `<url><loc>${base}${item}</loc><changefreq>weekly</changefreq><priority>${item === "/" ? "1.0" : "0.8"}</priority></url>`)
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlItems}</urlset>`;
  res.type("application/xml").send(xml);
});

app.use((error, req, res, next) => {
  console.error(error);

  if (req.path.startsWith("/admin")) {
    res.status(500).send("Ошибка в панели управления");
    return;
  }

  res.status(500).send("Внутренняя ошибка сервера");
});

let mediaWorkerBusy = false;

async function processOneMediaJob(): Promise<void> {
  if (mediaWorkerBusy) {
    return;
  }
  mediaWorkerBusy = true;
  let currentJob:
    | {
        id: number;
        jobType: "import_url" | "upload_file";
        payload: Record<string, unknown>;
        status: string;
      }
    | null = null;

  try {
    recycleStalledMediaJobs(30);
    currentJob = claimPendingMediaJob();
    if (!currentJob) {
      return;
    }

    if (currentJob.jobType === "import_url") {
      const importUrl = String(currentJob.payload?.url || "").trim();
      const importTitle = String(currentJob.payload?.title || "").trim();
      if (!importUrl) {
        throw new Error("Пустой URL для импорта");
      }

      const mediaItem = await importRemoteMedia(importUrl, importTitle);
      const media = await loadMedia();
      media.unshift(mediaItem);
      await saveMedia(media);
      invalidatePageCache("page:");
      markMediaJobDone(currentJob.id);
      return;
    }

    if (currentJob.jobType === "upload_file") {
      const uploadPayload = {
        path: String(currentJob.payload?.path || ""),
        originalname: String(currentJob.payload?.originalname || ""),
        mimetype: String(currentJob.payload?.mimetype || "")
      };
      const uploadTitle = String(currentJob.payload?.title || "").trim();

      if (!uploadPayload.path || !uploadPayload.originalname || !uploadPayload.mimetype) {
        throw new Error("Некорректные данные загрузки");
      }

      try {
        const mediaItem = await processUploadedFile(uploadPayload, uploadTitle);
        const media = await loadMedia();
        media.unshift(mediaItem);
        await saveMedia(media);
        invalidatePageCache("page:");
        markMediaJobDone(currentJob.id);
      } finally {
        await fs.unlink(uploadPayload.path).catch(() => {});
      }
      return;
    }

    throw new Error("Неизвестный тип медиа-задачи");
  } catch (error) {
    const message = getErrorMessage(error, "Ошибка обработки медиа-задачи");
    if (currentJob) {
      markMediaJobFailed(currentJob.id, message);
      if (currentJob.jobType === "upload_file") {
        const uploadPath = String(currentJob.payload?.path || "");
        if (uploadPath) {
          await fs.unlink(uploadPath).catch(() => {});
        }
      }
    }
  } finally {
    mediaWorkerBusy = false;
  }
}

function startMediaWorker(): void {
  setInterval(() => {
    processOneMediaJob().catch((error) => {
      console.error("Media worker error", error);
      mediaWorkerBusy = false;
    });
  }, 1200).unref();
}

(async () => {
  await ensureDirs();
  await fs.mkdir(uploadsDir, { recursive: true });
  startMediaWorker();

  app.listen(port, () => {
    console.log(`White Lab running on http://localhost:${port}`);
    if (ADMIN_USERNAME === "admin" && ADMIN_PASSWORD === "white-lab-admin") {
      console.log("Using default admin credentials. Set ADMIN_USERNAME and ADMIN_PASSWORD for production.");
    }
  });
})();
