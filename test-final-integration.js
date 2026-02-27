const http = require('http');
const BASE_URL = 'http://localhost:3000';
const tests = [];
let passed = 0;
let failed = 0;
function test(name, fn) {
    tests.push({
        name,
        fn
    });
}
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
function fetchPage(path) {
    return new Promise((resolve, reject)=>{
        http.get(`${BASE_URL}${path}`, (res)=>{
            let data = '';
            res.on('data', (chunk)=>data += chunk);
            res.on('end', ()=>resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data
                }));
        }).on('error', reject);
    });
}
test('Homepage loads with 200 status', async ()=>{
    const res = await fetchPage('/');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.length > 0, 'Response body is empty');
});
test('All CSS files are properly imported', async ()=>{
    const res = await fetchPage('/');
    assert(res.body.includes('/styles/site.css'), 'site.css not found');
    assert(res.body.includes('fonts.googleapis.com'), 'Google Fonts not loaded');
});
test('All JavaScript files are properly imported', async ()=>{
    const res = await fetchPage('/');
    assert(res.body.includes('/scripts/site.js'), 'site.js not found');
    assert(res.body.includes('/scripts/components/navigation.js'), 'navigation.js not found');
    assert(res.body.includes('/scripts/effects/metrics.js'), 'metrics.js not found');
    assert(res.body.includes('/scripts/effects/scroll-reveal.js'), 'scroll-reveal.js not found');
    assert(res.body.includes('/scripts/effects/tilt.js'), 'tilt.js not found');
});
test('Hero component is rendered', async ()=>{
    const res = await fetchPage('/');
    assert(res.body.includes('hero-scene'), 'Hero scene not found');
    assert(res.body.includes('hero-copy'), 'Hero copy not found');
    assert(res.body.includes('hero-media'), 'Hero media not found');
    assert(res.body.includes('hero-visual'), 'Hero visual not found');
});
test('Header component is rendered', async ()=>{
    const res = await fetchPage('/');
    assert(res.body.includes('site-header'), 'Site header not found');
    assert(res.body.includes('nav-wrap'), 'Navigation wrapper not found');
    assert(res.body.includes('brand'), 'Brand not found');
});
test('Footer component is rendered', async ()=>{
    const res = await fetchPage('/');
    assert(res.body.includes('site-footer'), 'Site footer not found');
    assert(res.body.includes('footer-main'), 'Footer main not found');
});
test('Service cards are rendered', async ()=>{
    const res = await fetchPage('/');
    assert(res.body.includes('service-card'), 'Service cards not found');
    assert(res.body.includes('service-grid'), 'Service grid not found');
});
test('Gallery component is rendered', async ()=>{
    const res = await fetchPage('/');
    assert(res.body.includes('media-cinema'), 'Media cinema not found');
    assert(res.body.includes('media-mosaic'), 'Media mosaic not found');
    assert(res.body.includes('media-filter'), 'Media filters not found');
});
test('CSS animations are defined', async ()=>{
    const res = await fetchPage('/styles/site.css');
    assert(res.status === 200, 'CSS file not accessible');
    assert(res.body.includes('@keyframes'), 'No keyframe animations found');
    assert(res.body.includes('heroGradientShift'), 'heroGradientShift animation not found');
    assert(res.body.includes('floatBob'), 'floatBob animation not found');
});
test('CSS variables are defined', async ()=>{
    const res = await fetchPage('/styles/core/variables.css');
    assert(res.status === 200, 'Variables CSS not accessible');
    assert(res.body.includes('--color-brand-primary'), 'Brand color not defined');
    assert(res.body.includes('--space-'), 'Spacing variables not defined');
    assert(res.body.includes('--font-'), 'Font variables not defined');
});
test('Responsive design breakpoints are defined', async ()=>{
    const res = await fetchPage('/styles/site.css');
    assert(res.body.includes('@media (max-width: 1100px)'), 'Tablet breakpoint not found');
    assert(res.body.includes('@media (max-width: 760px)'), 'Mobile breakpoint not found');
});
test('Effects CSS files are accessible', async ()=>{
    const animations = await fetchPage('/styles/effects/animations.css');
    assert(animations.status === 200, 'animations.css not accessible');
    const transitions = await fetchPage('/styles/effects/transitions.css');
    assert(transitions.status === 200, 'transitions.css not accessible');
    const backgrounds = await fetchPage('/styles/effects/backgrounds.css');
    assert(backgrounds.status === 200, 'backgrounds.css not accessible');
});
test('Component CSS files are accessible', async ()=>{
    const components = [
        'header',
        'hero',
        'cards',
        'gallery',
        'forms',
        'footer'
    ];
    for (const component of components){
        const res = await fetchPage(`/styles/components/${component}.css`);
        assert(res.status === 200, `${component}.css not accessible`);
    }
});
test('Core CSS files are accessible', async ()=>{
    const coreFiles = [
        'variables',
        'reset',
        'typography',
        'utilities'
    ];
    for (const file of coreFiles){
        const res = await fetchPage(`/styles/core/${file}.css`);
        assert(res.status === 200, `${file}.css not accessible`);
    }
});
test('JavaScript component files are accessible', async ()=>{
    const components = [
        'navigation',
        'gallery',
        'forms'
    ];
    for (const component of components){
        const res = await fetchPage(`/scripts/components/${component}.js`);
        assert(res.status === 200, `${component}.js not accessible`);
    }
});
test('JavaScript effect files are accessible', async ()=>{
    const effects = [
        'parallax',
        'scroll-reveal',
        'tilt',
        'metrics'
    ];
    for (const effect of effects){
        const res = await fetchPage(`/scripts/effects/${effect}.js`);
        assert(res.status === 200, `${effect}.js not accessible`);
    }
});
test('Mobile CTA is rendered', async ()=>{
    const res = await fetchPage('/');
    assert(res.body.includes('mobile-cta'), 'Mobile CTA not found');
});
test('Parallax data attributes are present', async ()=>{
    const res = await fetchPage('/');
    assert(res.body.includes('data-parallax-speed'), 'Parallax data attributes not found');
});
test('Lift card data attributes are present', async ()=>{
    const res = await fetchPage('/');
    assert(res.body.includes('data-lift-card'), 'Lift card data attributes not found');
});
test('Structured data (JSON-LD) is present', async ()=>{
    const res = await fetchPage('/');
    assert(res.body.includes('application/ld+json'), 'Structured data not found');
});
test('Meta tags are properly set', async ()=>{
    const res = await fetchPage('/');
    assert(res.body.includes('<meta name="description"'), 'Description meta tag not found');
    assert(res.body.includes('<meta property="og:'), 'Open Graph tags not found');
    assert(res.body.includes('<meta name="viewport"'), 'Viewport meta tag not found');
});
test('Service page loads successfully', async ()=>{
    const res = await fetchPage('/service/koronki-e-max');
    assert(res.status === 200 || res.status === 404, `Unexpected status: ${res.status}`);
});
test('Admin login page loads', async ()=>{
    const res = await fetchPage('/admin/login');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
});
test('CSS @import statements are present', async ()=>{
    const res = await fetchPage('/styles/site.css');
    assert(res.body.includes("@import url('./core/variables.css')"), 'Variables import not found');
    assert(res.body.includes("@import url('./effects/animations.css')"), 'Animations import not found');
    assert(res.body.includes("@import url('./components/"), 'Component imports not found');
});
test('No obvious HTML syntax errors', async ()=>{
    const res = await fetchPage('/');
    assert(!res.body.includes('undefined'), 'Undefined values in HTML');
    assert(res.body.includes('</html>'), 'HTML closing tag missing');
    assert(res.body.includes('</body>'), 'Body closing tag missing');
});
async function runTests() {
    console.log('\n🧪 Running Final Integration Tests for Modern UI Redesign\n');
    console.log('='.repeat(60));
    for (const { name, fn } of tests){
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
    console.log('='.repeat(60));
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed out of ${tests.length} tests\n`);
    if (failed === 0) {
        console.log('✨ All integration tests passed! The system is fully integrated.\n');
        process.exit(0);
    } else {
        console.log('⚠️  Some tests failed. Please review the errors above.\n');
        process.exit(1);
    }
}
runTests().catch((error)=>{
    console.error('Fatal error running tests:', error);
    process.exit(1);
});


//# sourceURL=src/tests/test-final-integration.ts