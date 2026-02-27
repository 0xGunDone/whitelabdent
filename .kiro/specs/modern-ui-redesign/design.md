# Документ дизайна: Современный редизайн UI/UX

## Обзор

Этот документ описывает архитектуру и дизайн полного редизайна пользовательского интерфейса веб-сайта White Lab. Редизайн фокусируется на создании современного, визуально впечатляющего опыта с использованием передовых CSS-эффектов, анимаций и интерактивных элементов, сохраняя при этом высокую производительность и доступность.

### Цели дизайна

1. Создать современный, профессиональный визуальный язык
2. Внедрить плавные, производительные анимации и эффекты
3. Обеспечить отличный пользовательский опыт на всех устройствах
4. Сохранить высокую производительность и доступность
5. Упростить поддержку и расширение кодовой базы

### Технологический стек

- **Backend**: Express.js (Node.js)
- **Templating**: EJS
- **Styling**: Vanilla CSS с CSS-переменными
- **JavaScript**: Vanilla JS (без фреймворков)
- **Animations**: CSS Animations, CSS Transitions, Web Animations API
- **Performance**: Intersection Observer API, RequestAnimationFrame

## Архитектура

### Структура проекта

```
white-lab/
├── public/
│   ├── styles/
│   │   ├── core/
│   │   │   ├── variables.css      # CSS-переменные
│   │   │   ├── reset.css          # CSS Reset
│   │   │   ├── typography.css     # Типографика
│   │   │   └── utilities.css      # Утилитарные классы
│   │   ├── components/
│   │   │   ├── header.css         # Стили header
│   │   │   ├── hero.css           # Стили hero-секции
│   │   │   ├── cards.css          # Стили карточек
│   │   │   ├── gallery.css        # Стили галереи
│   │   │   ├── forms.css          # Стили форм
│   │   │   └── footer.css         # Стили footer
│   │   ├── effects/
│   │   │   ├── animations.css     # Keyframe-анимации
│   │   │   ├── transitions.css    # Переходы
│   │   │   └── backgrounds.css    # Анимированные фоны
│   │   └── site.css               # Главный файл стилей
│   ├── scripts/
│   │   ├── core/
│   │   │   ├── utils.js           # Утилиты
│   │   │   └── constants.js       # Константы
│   │   ├── effects/
│   │   │   ├── parallax.js        # Parallax-эффекты
│   │   │   ├── scroll-reveal.js   # Анимации при прокрутке
│   │   │   ├── tilt.js            # 3D tilt-эффекты
│   │   │   └── cursor.js          # Кастомный курсор
│   │   ├── components/
│   │   │   ├── navigation.js      # Навигация
│   │   │   ├── gallery.js         # Галерея
│   │   │   └── forms.js           # Формы
│   │   └── site.js                # Главный файл скриптов
│   └── media/                     # Медиафайлы
├── views/
│   ├── partials/
│   │   ├── head.ejs               # <head> секция
│   │   ├── header.ejs             # Header
│   │   ├── footer.ejs             # Footer
│   │   └── scripts.ejs            # Скрипты
│   ├── components/
│   │   ├── hero.ejs               # Hero-компонент
│   │   ├── service-card.ejs       # Карточка услуги
│   │   └── media-tile.ejs         # Медиа-плитка
│   ├── home.ejs                   # Главная страница
│   ├── service.ejs                # Страница услуги
│   └── admin/                     # Админ-панель
└── server.js                      # Express-сервер

```

### Архитектурные принципы

1. **Модульность**: Разделение стилей и скриптов на логические модули
2. **Прогрессивное улучшение**: Базовая функциональность работает без JavaScript
3. **Производительность**: Оптимизация анимаций и эффектов
4. **Доступность**: Поддержка клавиатурной навигации и screen readers
5. **Масштабируемость**: Легкое добавление новых компонентов

## Компоненты и интерфейсы

### 1. Система дизайн-токенов (CSS-переменные)

```css
:root {
  /* Цвета */
  --color-bg-primary: #05070b;
  --color-bg-secondary: #0a0f16;
  --color-surface: #0f1621;
  --color-surface-elevated: #121c29;
  
  --color-text-primary: #edf3f8;
  --color-text-secondary: #9fb1c4;
  --color-text-muted: #6b7d91;
  
  --color-brand-primary: #37d0be;
  --color-brand-secondary: #74e5ff;
  --color-accent: #ff6e6e;
  
  /* Градиенты */
  --gradient-brand: linear-gradient(98deg, var(--color-brand-primary), var(--color-brand-secondary));
  --gradient-surface: linear-gradient(165deg, rgba(10, 15, 22, 0.97), rgba(5, 8, 13, 0.98));
  
  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  
  /* Typography */
  --font-primary: "Manrope", sans-serif;
  --font-heading: "Space Grotesk", sans-serif;
  
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 2rem;
  --font-size-4xl: 3rem;
  
  /* Border radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.3);
  --shadow-xl: 0 24px 64px rgba(0, 0, 0, 0.4);
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 350ms ease;
  
  /* Z-index */
  --z-base: 1;
  --z-elevated: 10;
  --z-sticky: 20;
  --z-modal: 30;
  --z-tooltip: 40;
}
```

### 2. Header Component

**Интерфейс:**
```typescript
interface HeaderProps {
  isSticky: boolean;
  isScrolled: boolean;
  brandName: string;
  navigation: NavigationItem[];
  ctaButton: CTAButton;
}

interface NavigationItem {
  label: string;
  href: string;
  isActive: boolean;
}

interface CTAButton {
  text: string;
  href: string;
  variant: 'primary' | 'secondary';
}
```

**Функциональность:**
- Sticky positioning с backdrop-filter blur
- Изменение стиля при прокрутке
- Анимированное мобильное меню
- Hover-эффекты на навигационных элементах

**CSS-структура:**
```css
.site-header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  backdrop-filter: blur(14px);
  background: rgba(5, 8, 12, 0.83);
  border-bottom: 1px solid rgba(255, 255, 255, 0.09);
  transition: all var(--transition-base);
}

.site-header.is-scrolled {
  background: rgba(5, 8, 12, 0.95);
  box-shadow: var(--shadow-md);
}
```

### 3. Hero Section Component

**Интерфейс:**
```typescript
interface HeroProps {
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  primaryCTA: CTAButton;
  secondaryCTA: CTAButton;
  media: MediaItem;
  metrics: Metric[];
  floatingCards: FloatingCard[];
}

interface MediaItem {
  type: 'image' | 'video';
  src: string;
  poster?: string;
  alt: string;
}

interface Metric {
  label: string;
  value: string | number;
}

interface FloatingCard {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  content: {
    title: string;
    subtitle: string;
    description: string;
  };
}
```

**Эффекты:**
- Parallax на фоновых элементах
- 3D tilt на медиа-контейнере
- Анимированные градиенты
- Floating cards с bob-анимацией
- Интерактивное свечение при движении курсора
- Radar ring анимация
- Scanline эффект на видео/изображении

### 4. Service Card Component

**Интерфейс:**
```typescript
interface ServiceCardProps {
  title: string;
  description: string;
  slug: string;
  materials?: string[];
  icon?: string;
}
```

**Эффекты:**
- 3D tilt при hover
- Градиентный фон с анимацией
- Плавное появление при прокрутке
- Hover-эффект с подъемом и тенью

**CSS-структура:**
```css
.service-card {
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: var(--radius-md);
  background: var(--gradient-surface);
  padding: var(--space-lg);
  transition: all var(--transition-base);
  transform-style: preserve-3d;
}

.service-card:hover {
  transform: translateY(-4px) rotateX(var(--tilt-x)) rotateY(var(--tilt-y));
  border-color: rgba(55, 208, 190, 0.5);
  box-shadow: var(--shadow-lg);
}
```

### 5. Media Gallery Component

**Интерфейс:**
```typescript
interface GalleryProps {
  items: MediaItem[];
  layout: 'masonry' | 'grid';
  filters: string[];
}

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  src: string;
  thumbnail: string;
  alt: string;
  source: string;
  category: string;
}
```

**Функциональность:**
- Masonry layout с CSS Grid
- Фильтрация с плавной анимацией
- Lazy loading изображений
- Lightbox с плавным открытием
- Hover-эффекты с увеличением

**Layout:**
```css
.media-mosaic {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-rows: 4.9rem;
  grid-auto-flow: dense;
  gap: var(--space-sm);
}

.media-tile-hero {
  grid-column: span 5;
  grid-row: span 4;
}

.media-tile-wide {
  grid-column: span 4;
  grid-row: span 3;
}

.media-tile-tall {
  grid-column: span 3;
  grid-row: span 4;
}
```

### 6. Form Components

**Интерфейс:**
```typescript
interface FormFieldProps {
  type: 'text' | 'email' | 'tel' | 'textarea';
  label: string;
  name: string;
  value: string;
  error?: string;
  required: boolean;
}

interface FormProps {
  fields: FormFieldProps[];
  submitButton: CTAButton;
  onSubmit: (data: FormData) => Promise<void>;
}
```

**Эффекты:**
- Floating labels
- Анимация фокуса
- Валидация в реальном времени
- Анимированные иконки состояния
- Ripple-эффект на кнопках

## Модели данных

### Site Configuration

```typescript
interface SiteConfig {
  seo: SEOConfig;
  brand: BrandConfig;
  hero: HeroConfig;
  about: AboutConfig;
  services: Service[];
  faq: FAQItem[];
  metrics: Metrics;
  sourceLinks: string[];
  advantages: string[];
}

interface SEOConfig {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
}

interface BrandConfig {
  name: string;
  legalName: string;
  category: string;
  city: string;
  address: string;
  postalCode: string;
  region: string;
  country: string;
  phoneDisplay: string;
  phoneValue: string;
  email: string;
  workHours: string;
  workHoursIso: string;
  instagram: string;
  orderLink: string;
  map2gis: string;
  mapYandex: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface Service {
  title: string;
  slug: string;
  short: string;
  description: string;
  materials: string[];
}

interface Metrics {
  instagramFollowers: number;
  instagramPosts: number;
  instagramHighlights: number;
  twoGisRating: number;
  twoGisReviews: number;
}
```

### Media Library

```typescript
interface MediaItem {
  id: string;
  type: 'image' | 'video';
  localOriginal: string;
  localOptimized: string;
  alt: string;
  title: string;
  source: string;
  uploadedAt: string;
}

interface MediaLibrary {
  items: MediaItem[];
  totalSize: number;
  lastUpdated: string;
}
```

## Correctness Properties

*Свойство — это характеристика или поведение, которое должно выполняться во всех допустимых выполнениях системы — по сути, формальное утверждение о том, что должна делать система. Свойства служат мостом между человекочитаемыми спецификациями и машинно-проверяемыми гарантиями корректности.*

### Acceptance Criteria Testability Analysis

Для UI/UX редизайна большинство требований касаются визуальных эффектов и анимаций, которые сложно тестировать автоматически через property-based тесты. Однако мы можем протестировать:

1. **Производительность** (Требование 9): Метрики загрузки и производительности анимаций
2. **Адаптивность** (Требование 8): Корректность layout на разных размерах экрана
3. **Доступность** (Требование 16): Контрастность, семантика, keyboard navigation
4. **Совместимость** (Требование 17): Поддержка CSS-свойств в разных браузерах
5. **Функциональность** (Требования 4, 6, 11): Навигация, галерея, формы

Визуальные эффекты (parallax, hover, анимации) будут тестироваться через:
- Ручное тестирование
- Visual regression тесты (screenshot comparison)
- E2E тесты для проверки наличия CSS-классов и атрибутов

### Testable Properties

**Property 1: Performance Budget Compliance**
*For any* page load, First Contentful Paint should occur within 1.5 seconds and Largest Contentful Paint within 2.5 seconds
**Validates: Requirements 9.1, 9.2**

**Property 2: Animation Performance**
*For any* CSS animation, it should use only transform and opacity properties to ensure 60fps performance
**Validates: Requirements 9.3, 9.5**

**Property 3: Responsive Layout Integrity**
*For any* viewport width (mobile: <768px, tablet: <1024px, desktop: ≥1024px), all interactive elements should remain accessible and properly sized
**Validates: Requirements 8.1, 8.2, 8.3, 8.5**

**Property 4: Color Contrast Accessibility**
*For any* text element, the contrast ratio between text and background should be at least 4.5:1
**Validates: Requirements 16.1**

**Property 5: Keyboard Navigation**
*For any* interactive element (buttons, links, form fields), it should be reachable and operable via keyboard alone
**Validates: Requirements 16.2**

**Property 6: Semantic HTML Structure**
*For any* page, all interactive elements should use appropriate semantic HTML tags (button, a, input, etc.)
**Validates: Requirements 16.3**

**Property 7: Image Accessibility**
*For any* image element, it should have a non-empty alt attribute or be marked as decorative
**Validates: Requirements 16.4**

**Property 8: Reduced Motion Support**
*For any* animation, when prefers-reduced-motion is enabled, animations should be disabled or significantly reduced
**Validates: Requirements 10.5, 16.5**

**Property 9: Form Validation Feedback**
*For any* form field with validation, invalid input should trigger visual feedback within 300ms
**Validates: Requirements 11.3**

**Property 10: Gallery Filter Consistency**
*For any* gallery filter selection, only items matching the selected category should be displayed
**Validates: Requirements 6.3**

**Property 11: Lazy Loading Behavior**
*For any* image in the gallery, it should only load when within 200px of the viewport
**Validates: Requirements 6.5**

**Property 12: CSS Variable Consistency**
*For any* component, all color, spacing, and typography values should reference CSS variables from the design system
**Validates: Requirements 1.1, 1.2, 1.3**

**Property 13: Mobile Touch Target Size**
*For any* interactive element on mobile (<768px), the touch target should be at least 44x44px
**Validates: Requirements 8.5**

**Property 14: Header State Transition**
*For any* scroll position > 50px, the header should have the 'is-scrolled' class applied
**Validates: Requirements 4.2**

**Property 15: Browser Fallback Support**
*For any* modern CSS property (backdrop-filter, grid, etc.), a fallback should be provided for unsupported browsers
**Validates: Requirements 17.5, 17.6**

## Error Handling

### CSS Fallbacks

```css
/* Backdrop filter fallback */
.site-header {
  background: rgba(5, 8, 12, 0.95); /* Fallback */
  backdrop-filter: blur(14px);
}

@supports not (backdrop-filter: blur(14px)) {
  .site-header {
    background: rgba(5, 8, 12, 0.98);
  }
}

/* Grid fallback */
.media-mosaic {
  display: flex; /* Fallback */
  flex-wrap: wrap;
}

@supports (display: grid) {
  .media-mosaic {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
  }
}
```

### JavaScript Error Handling

```javascript
// Intersection Observer fallback
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(callback, options);
} else {
  elements.forEach(el => el.classList.add('is-visible'));
}

// Animation frame fallback
const requestFrame = window.requestAnimationFrame || 
                     window.webkitRequestAnimationFrame ||
                     function(callback) { setTimeout(callback, 16); };
```

### Performance Degradation

```javascript
// Reduce animations on low-end devices
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isLowEndDevice = navigator.hardwareConcurrency < 4;

if (prefersReducedMotion || isLowEndDevice) {
  document.documentElement.classList.add('reduce-motion');
}
```

```css
.reduce-motion * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}
```

### Image Loading Errors

```javascript
// Handle image load failures
document.querySelectorAll('img').forEach(img => {
  img.addEventListener('error', function() {
    this.src = '/media/placeholder.jpg';
    this.alt = 'Изображение недоступно';
  });
});
```

### Form Validation Errors

```javascript
// Comprehensive form validation
function validateForm(formData) {
  const errors = {};
  
  if (!formData.name || formData.name.trim().length < 2) {
    errors.name = 'Имя должно содержать минимум 2 символа';
  }
  
  if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Введите корректный email';
  }
  
  if (!formData.phone || !/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
    errors.phone = 'Введите корректный номер телефона';
  }
  
  return errors;
}
```

## Testing Strategy

### Dual Testing Approach

Мы используем комбинацию unit-тестов и property-based тестов для обеспечения качества:

- **Unit тесты**: Проверяют конкретные примеры, edge cases и условия ошибок
- **Property тесты**: Проверяют универсальные свойства на множестве входных данных
- Оба подхода дополняют друг друга для полного покрытия

### Testing Tools

**Property-Based Testing:**
- **Library**: fast-check (JavaScript)
- **Configuration**: Минимум 100 итераций на тест
- **Tag Format**: `// Feature: modern-ui-redesign, Property {N}: {description}`

**Unit Testing:**
- **Framework**: Jest
- **DOM Testing**: jsdom
- **Coverage Target**: 80%+ для JavaScript модулей

**Visual Regression:**
- **Tool**: Percy или Chromatic
- **Scope**: Ключевые компоненты и страницы
- **Breakpoints**: Mobile (375px), Tablet (768px), Desktop (1440px)

**E2E Testing:**
- **Framework**: Playwright
- **Scope**: Критические пользовательские сценарии
- **Browsers**: Chrome, Firefox, Safari

**Performance Testing:**
- **Tool**: Lighthouse CI
- **Metrics**: FCP < 1.5s, LCP < 2.5s, CLS < 0.1
- **Frequency**: На каждый PR

**Accessibility Testing:**
- **Tool**: axe-core
- **Scope**: Все страницы
- **Standards**: WCAG 2.1 Level AA

### Test Organization

```
tests/
├── unit/
│   ├── utils.test.js
│   ├── navigation.test.js
│   ├── gallery.test.js
│   └── forms.test.js
├── properties/
│   ├── performance.prop.test.js
│   ├── accessibility.prop.test.js
│   ├── responsive.prop.test.js
│   └── validation.prop.test.js
├── e2e/
│   ├── homepage.spec.js
│   ├── service-page.spec.js
│   └── admin.spec.js
└── visual/
    ├── components.visual.js
    └── pages.visual.js
```

### Test Execution Strategy

1. **Development**: Unit тесты запускаются при каждом сохранении файла
2. **Pre-commit**: Unit тесты + linting
3. **Pull Request**: Unit тесты, Property-based тесты, Accessibility тесты, Performance тесты
4. **Pre-deployment**: Все тесты, Visual regression тесты, E2E тесты на staging
5. **Post-deployment**: Smoke тесты на production

### Manual Testing Checklist

Некоторые аспекты UI/UX требуют ручного тестирования:

- [ ] Плавность анимаций на разных устройствах
- [ ] Качество визуальных эффектов (parallax, tilt, glassmorphism)
- [ ] Эстетическая привлекательность дизайна
- [ ] Интуитивность навигации
- [ ] Читаемость текста при разном освещении
- [ ] Комфортность использования на touch-устройствах
- [ ] Корректность отображения в разных браузерах
- [ ] Производительность на low-end устройствах

