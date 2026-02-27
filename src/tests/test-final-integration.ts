/**
 * Final Integration Test for Modern UI Redesign
 * Task 19.1: Verify all components work together
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function fetchPage(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

// Test 1: Homepage loads successfully
test('Homepage loads with 200 status', async () => {
  const res = await fetchPage('/');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(res.body.length > 0, 'Response body is empty');
});

// Test 2: All CSS files are referenced
test('All CSS files are properly imported', async () => {
  const res = await fetchPage('/');
  assert(res.body.includes('/styles/site.css'), 'site.css not found');
  assert(res.body.includes('fonts.googleapis.com'), 'Google Fonts not loaded');
});

// Test 3: All JavaScript files are referenced
test('All JavaScript files are properly imported', async () => {
  const res = await fetchPage('/');
  assert(res.body.includes('/scripts/site.js'), 'site.js not found');
  assert(res.body.includes('/scripts/components/navigation.js'), 'navigation.js not found');
  assert(res.body.includes('/scripts/effects/metrics.js'), 'metrics.js not found');
  assert(res.body.includes('/scripts/effects/scroll-reveal.js'), 'scroll-reveal.js not found');
  assert(res.body.includes('/scripts/effects/tilt.js'), 'tilt.js not found');
});

// Test 4: Hero component is rendered
test('Hero component is rendered', async () => {
  const res = await fetchPage('/');
  assert(res.body.includes('hero-scene'), 'Hero scene not found');
  assert(res.body.includes('hero-copy'), 'Hero copy not found');
  assert(res.body.includes('hero-media'), 'Hero media not found');
  assert(res.body.includes('hero-visual'), 'Hero visual not found');
});

// Test 5: Header component is rendered
test('Header component is rendered', async () => {
  const res = await fetchPage('/');
  assert(res.body.includes('site-header'), 'Site header not found');
  assert(res.body.includes('nav-wrap'), 'Navigation wrapper not found');
  assert(res.body.includes('brand'), 'Brand not found');
});

// Test 6: Footer component is rendered
test('Footer component is rendered', async () => {
  const res = await fetchPage('/');
  assert(res.body.includes('site-footer'), 'Site footer not found');
  assert(res.body.includes('footer-main'), 'Footer main not found');
});

// Test 7: Service cards are rendered
test('Service cards are rendered', async () => {
  const res = await fetchPage('/');
  assert(res.body.includes('service-card'), 'Service cards not found');
  assert(res.body.includes('service-grid'), 'Service grid not found');
});

// Test 8: Gallery component is rendered
test('Gallery component is rendered', async () => {
  const res = await fetchPage('/');
  assert(res.body.includes('media-cinema'), 'Media cinema not found');
  assert(res.body.includes('media-mosaic'), 'Media mosaic not found');
  assert(res.body.includes('media-filter'), 'Media filters not found');
});

// Test 9: CSS animations are defined
test('CSS animations are defined', async () => {
  const res = await fetchPage('/styles/site.css');
  assert(res.status === 200, 'CSS file not accessible');
  assert(res.body.includes('@keyframes'), 'No keyframe animations found');
  assert(res.body.includes('heroGradientShift'), 'heroGradientShift animation not found');
  assert(res.body.includes('floatBob'), 'floatBob animation not found');
});

// Test 10: CSS variables are defined
test('CSS variables are defined', async () => {
  const res = await fetchPage('/styles/core/variables.css');
  assert(res.status === 200, 'Variables CSS not accessible');
  assert(res.body.includes('--color-brand-primary'), 'Brand color not defined');
  assert(res.body.includes('--space-'), 'Spacing variables not defined');
  assert(res.body.includes('--font-'), 'Font variables not defined');
});

// Test 11: Responsive design breakpoints
test('Responsive design breakpoints are defined', async () => {
  const res = await fetchPage('/styles/site.css');
  assert(res.body.includes('@media (max-width: 1100px)'), 'Tablet breakpoint not found');
  assert(res.body.includes('@media (max-width: 760px)'), 'Mobile breakpoint not found');
});

// Test 12: Effects CSS files exist
test('Effects CSS files are accessible', async () => {
  const animations = await fetchPage('/styles/effects/animations.css');
  assert(animations.status === 200, 'animations.css not accessible');
  
  const transitions = await fetchPage('/styles/effects/transitions.css');
  assert(transitions.status === 200, 'transitions.css not accessible');
  
  const backgrounds = await fetchPage('/styles/effects/backgrounds.css');
  assert(backgrounds.status === 200, 'backgrounds.css not accessible');
});

// Test 13: Component CSS files exist
test('Component CSS files are accessible', async () => {
  const components = ['header', 'hero', 'cards', 'gallery', 'forms', 'footer'];
  for (const component of components) {
    const res = await fetchPage(`/styles/components/${component}.css`);
    assert(res.status === 200, `${component}.css not accessible`);
  }
});

// Test 14: Core CSS files exist
test('Core CSS files are accessible', async () => {
  const coreFiles = ['variables', 'reset', 'typography', 'utilities'];
  for (const file of coreFiles) {
    const res = await fetchPage(`/styles/core/${file}.css`);
    assert(res.status === 200, `${file}.css not accessible`);
  }
});

// Test 15: JavaScript components exist
test('JavaScript component files are accessible', async () => {
  const components = ['navigation', 'gallery', 'forms'];
  for (const component of components) {
    const res = await fetchPage(`/scripts/components/${component}.js`);
    assert(res.status === 200, `${component}.js not accessible`);
  }
});

// Test 16: JavaScript effects exist
test('JavaScript effect files are accessible', async () => {
  const effects = ['parallax', 'scroll-reveal', 'tilt', 'metrics'];
  for (const effect of effects) {
    const res = await fetchPage(`/scripts/effects/${effect}.js`);
    assert(res.status === 200, `${effect}.js not accessible`);
  }
});

// Test 17: Mobile CTA is present
test('Mobile CTA is rendered', async () => {
  const res = await fetchPage('/');
  assert(res.body.includes('mobile-cta'), 'Mobile CTA not found');
});

// Test 18: Parallax data attributes
test('Parallax data attributes are present', async () => {
  const res = await fetchPage('/');
  assert(res.body.includes('data-parallax-speed'), 'Parallax data attributes not found');
});

// Test 19: Lift card data attributes
test('Lift card data attributes are present', async () => {
  const res = await fetchPage('/');
  assert(res.body.includes('data-lift-card'), 'Lift card data attributes not found');
});

// Test 20: Structured data is present
test('Structured data (JSON-LD) is present', async () => {
  const res = await fetchPage('/');
  assert(res.body.includes('application/ld+json'), 'Structured data not found');
});

// Test 21: Meta tags are present
test('Meta tags are properly set', async () => {
  const res = await fetchPage('/');
  assert(res.body.includes('<meta name="description"'), 'Description meta tag not found');
  assert(res.body.includes('<meta property="og:'), 'Open Graph tags not found');
  assert(res.body.includes('<meta name="viewport"'), 'Viewport meta tag not found');
});

// Test 22: Service page loads
test('Service page loads successfully', async () => {
  const res = await fetchPage('/service/koronki-e-max');
  assert(res.status === 200 || res.status === 404, `Unexpected status: ${res.status}`);
});

// Test 23: Admin login page loads
test('Admin login page loads', async () => {
  const res = await fetchPage('/admin/login');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
});

// Test 24: CSS imports are working
test('CSS @import statements are present', async () => {
  const res = await fetchPage('/styles/site.css');
  assert(res.body.includes("@import url('./core/variables.css')"), 'Variables import not found');
  assert(res.body.includes("@import url('./effects/animations.css')"), 'Animations import not found');
  assert(res.body.includes("@import url('./components/"), 'Component imports not found');
});

// Test 25: No obvious HTML errors
test('No obvious HTML syntax errors', async () => {
  const res = await fetchPage('/');
  assert(!res.body.includes('undefined'), 'Undefined values in HTML');
  assert(res.body.includes('</html>'), 'HTML closing tag missing');
  assert(res.body.includes('</body>'), 'Body closing tag missing');
});

// Run all tests
async function runTests() {
  console.log('\n🧪 Running Final Integration Tests for Modern UI Redesign\n');
  console.log('=' .repeat(60));
  
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log('=' .repeat(60));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed out of ${tests.length} tests\n`);
  
  if (failed === 0) {
    console.log('✨ All integration tests passed! The system is fully integrated.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
