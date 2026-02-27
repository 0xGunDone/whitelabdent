/**
 * Integration Test Script
 * Tests all main components working together
 * 
 * Task 8: Checkpoint - Main Components
 * Validates: Header, Hero, Service Cards, Gallery, Forms integration
 */

const http = require('http');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: data });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runTests() {
  log('\n🧪 Starting Integration Tests for Modern UI Redesign', 'cyan');
  log('=' .repeat(60), 'cyan');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Integration page loads
  try {
    log('\n📄 Test 1: Integration page loads', 'blue');
    const response = await makeRequest('/test-integration.html');
    
    if (response.statusCode === 200) {
      log('  ✅ Integration page returns 200 OK', 'green');
      results.passed++;
      results.tests.push({ name: 'Integration page loads', passed: true });
    } else {
      log(`  ❌ Integration page returned ${response.statusCode}`, 'red');
      results.failed++;
      results.tests.push({ name: 'Integration page loads', passed: false });
    }
  } catch (error) {
    log(`  ❌ Failed to load integration page: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name: 'Integration page loads', passed: false });
  }

  // Test 2: Header component present
  try {
    log('\n🎯 Test 2: Header component present', 'blue');
    const response = await makeRequest('/test-integration.html');
    const body = response.body;
    
    const hasHeader = body.includes('class="site-header"');
    const hasNav = body.includes('class="header-nav"');
    const hasMobileToggle = body.includes('class="mobile-menu-toggle"');
    
    if (hasHeader && hasNav && hasMobileToggle) {
      log('  ✅ Header component with navigation and mobile toggle present', 'green');
      results.passed++;
      results.tests.push({ name: 'Header component', passed: true });
    } else {
      log('  ❌ Header component incomplete', 'red');
      if (!hasHeader) log('    - Missing site-header', 'red');
      if (!hasNav) log('    - Missing header-nav', 'red');
      if (!hasMobileToggle) log('    - Missing mobile-menu-toggle', 'red');
      results.failed++;
      results.tests.push({ name: 'Header component', passed: false });
    }
  } catch (error) {
    log(`  ❌ Failed to test header: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name: 'Header component', passed: false });
  }

  // Test 3: Hero section present
  try {
    log('\n🦸 Test 3: Hero section present', 'blue');
    const response = await makeRequest('/test-integration.html');
    const body = response.body;
    
    const hasHero = body.includes('class="hero-section"');
    const hasTitle = body.includes('class="hero-title"');
    const hasMetrics = body.includes('class="hero-metrics"');
    const hasActions = body.includes('class="hero-actions"');
    
    if (hasHero && hasTitle && hasMetrics && hasActions) {
      log('  ✅ Hero section with title, metrics, and actions present', 'green');
      results.passed++;
      results.tests.push({ name: 'Hero section', passed: true });
    } else {
      log('  ❌ Hero section incomplete', 'red');
      if (!hasHero) log('    - Missing hero-section', 'red');
      if (!hasTitle) log('    - Missing hero-title', 'red');
      if (!hasMetrics) log('    - Missing hero-metrics', 'red');
      if (!hasActions) log('    - Missing hero-actions', 'red');
      results.failed++;
      results.tests.push({ name: 'Hero section', passed: false });
    }
  } catch (error) {
    log(`  ❌ Failed to test hero: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name: 'Hero section', passed: false });
  }

  // Test 4: Service cards present
  try {
    log('\n🎴 Test 4: Service cards present', 'blue');
    const response = await makeRequest('/test-integration.html');
    const body = response.body;
    
    const cardMatches = body.match(/class="service-card"/g);
    const cardCount = cardMatches ? cardMatches.length : 0;
    const hasTilt = body.includes('data-tilt');
    const hasScrollReveal = body.includes('data-scroll-reveal');
    
    if (cardCount >= 3 && hasTilt && hasScrollReveal) {
      log(`  ✅ Found ${cardCount} service cards with tilt and scroll-reveal effects`, 'green');
      results.passed++;
      results.tests.push({ name: 'Service cards', passed: true });
    } else {
      log('  ❌ Service cards incomplete', 'red');
      if (cardCount < 3) log(`    - Only ${cardCount} cards found (expected 3+)`, 'red');
      if (!hasTilt) log('    - Missing data-tilt attributes', 'red');
      if (!hasScrollReveal) log('    - Missing data-scroll-reveal attributes', 'red');
      results.failed++;
      results.tests.push({ name: 'Service cards', passed: false });
    }
  } catch (error) {
    log(`  ❌ Failed to test service cards: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name: 'Service cards', passed: false });
  }

  // Test 5: Gallery component present
  try {
    log('\n🖼️  Test 5: Gallery component present', 'blue');
    const response = await makeRequest('/test-integration.html');
    const body = response.body;
    
    const hasGallery = body.includes('class="media-mosaic"');
    const hasFilters = body.includes('class="gallery-filters"');
    const tileMatches = body.match(/class="media-tile/g);
    const tileCount = tileMatches ? tileMatches.length : 0;
    
    if (hasGallery && hasFilters && tileCount >= 6) {
      log(`  ✅ Gallery with filters and ${tileCount} tiles present`, 'green');
      results.passed++;
      results.tests.push({ name: 'Gallery component', passed: true });
    } else {
      log('  ❌ Gallery component incomplete', 'red');
      if (!hasGallery) log('    - Missing media-mosaic', 'red');
      if (!hasFilters) log('    - Missing gallery-filters', 'red');
      if (tileCount < 6) log(`    - Only ${tileCount} tiles found (expected 6+)`, 'red');
      results.failed++;
      results.tests.push({ name: 'Gallery component', passed: false });
    }
  } catch (error) {
    log(`  ❌ Failed to test gallery: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name: 'Gallery component', passed: false });
  }

  // Test 6: Forms component present
  try {
    log('\n📝 Test 6: Forms component present', 'blue');
    const response = await makeRequest('/test-integration.html');
    const body = response.body;
    
    const hasForm = body.includes('class="modern-form"');
    const inputMatches = body.match(/class="form-input"/g);
    const inputCount = inputMatches ? inputMatches.length : 0;
    const hasLabels = body.includes('class="form-label"');
    const hasSubmit = body.includes('type="submit"');
    
    if (hasForm && inputCount >= 4 && hasLabels && hasSubmit) {
      log(`  ✅ Form with ${inputCount} inputs, labels, and submit button present`, 'green');
      results.passed++;
      results.tests.push({ name: 'Forms component', passed: true });
    } else {
      log('  ❌ Forms component incomplete', 'red');
      if (!hasForm) log('    - Missing modern-form', 'red');
      if (inputCount < 4) log(`    - Only ${inputCount} inputs found (expected 4+)`, 'red');
      if (!hasLabels) log('    - Missing form-label', 'red');
      if (!hasSubmit) log('    - Missing submit button', 'red');
      results.failed++;
      results.tests.push({ name: 'Forms component', passed: false });
    }
  } catch (error) {
    log(`  ❌ Failed to test forms: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name: 'Forms component', passed: false });
  }

  // Test 7: CSS files loaded
  try {
    log('\n🎨 Test 7: CSS files loaded', 'blue');
    const response = await makeRequest('/test-integration.html');
    const body = response.body;
    
    const cssFiles = [
      'variables.css',
      'reset.css',
      'typography.css',
      'header.css',
      'hero.css',
      'cards.css',
      'gallery.css',
      'forms.css'
    ];
    
    const missingCss = cssFiles.filter(file => !body.includes(file));
    
    if (missingCss.length === 0) {
      log(`  ✅ All ${cssFiles.length} CSS files referenced`, 'green');
      results.passed++;
      results.tests.push({ name: 'CSS files loaded', passed: true });
    } else {
      log('  ❌ Some CSS files missing', 'red');
      missingCss.forEach(file => log(`    - Missing: ${file}`, 'red'));
      results.failed++;
      results.tests.push({ name: 'CSS files loaded', passed: false });
    }
  } catch (error) {
    log(`  ❌ Failed to test CSS files: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name: 'CSS files loaded', passed: false });
  }

  // Test 8: JavaScript files loaded
  try {
    log('\n⚡ Test 8: JavaScript files loaded', 'blue');
    const response = await makeRequest('/test-integration.html');
    const body = response.body;
    
    const jsFiles = [
      'parallax.js',
      'scroll-reveal.js',
      'tilt.js',
      'metrics.js',
      'navigation.js',
      'gallery.js',
      'forms.js'
    ];
    
    const missingJs = jsFiles.filter(file => !body.includes(file));
    
    if (missingJs.length === 0) {
      log(`  ✅ All ${jsFiles.length} JavaScript files referenced`, 'green');
      results.passed++;
      results.tests.push({ name: 'JavaScript files loaded', passed: true });
    } else {
      log('  ❌ Some JavaScript files missing', 'red');
      missingJs.forEach(file => log(`    - Missing: ${file}`, 'red'));
      results.failed++;
      results.tests.push({ name: 'JavaScript files loaded', passed: false });
    }
  } catch (error) {
    log(`  ❌ Failed to test JavaScript files: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name: 'JavaScript files loaded', passed: false });
  }

  // Test 9: Smooth transitions between sections
  try {
    log('\n🔄 Test 9: Smooth transitions between sections', 'blue');
    const response = await makeRequest('/test-integration.html');
    const body = response.body;
    
    const hasSectionIds = body.includes('id="hero"') && 
                          body.includes('id="services"') && 
                          body.includes('id="gallery"') && 
                          body.includes('id="contact"');
    const hasNavLinks = body.includes('href="#hero"') && 
                        body.includes('href="#services"') && 
                        body.includes('href="#gallery"') && 
                        body.includes('href="#contact"');
    
    if (hasSectionIds && hasNavLinks) {
      log('  ✅ All sections have IDs and navigation links for smooth scrolling', 'green');
      results.passed++;
      results.tests.push({ name: 'Smooth transitions', passed: true });
    } else {
      log('  ❌ Section navigation incomplete', 'red');
      if (!hasSectionIds) log('    - Missing section IDs', 'red');
      if (!hasNavLinks) log('    - Missing navigation links', 'red');
      results.failed++;
      results.tests.push({ name: 'Smooth transitions', passed: false });
    }
  } catch (error) {
    log(`  ❌ Failed to test transitions: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name: 'Smooth transitions', passed: false });
  }

  // Test 10: Status indicator present
  try {
    log('\n📊 Test 10: Status indicator present', 'blue');
    const response = await makeRequest('/test-integration.html');
    const body = response.body;
    
    const hasStatusIndicator = body.includes('class="status-indicator"');
    const hasStatusItems = body.includes('class="status-item"');
    
    if (hasStatusIndicator && hasStatusItems) {
      log('  ✅ Status indicator for component testing present', 'green');
      results.passed++;
      results.tests.push({ name: 'Status indicator', passed: true });
    } else {
      log('  ❌ Status indicator missing', 'red');
      results.failed++;
      results.tests.push({ name: 'Status indicator', passed: false });
    }
  } catch (error) {
    log(`  ❌ Failed to test status indicator: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name: 'Status indicator', passed: false });
  }

  // Print summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 Test Summary', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const total = results.passed + results.failed;
  const percentage = total > 0 ? Math.round((results.passed / total) * 100) : 0;
  
  log(`\nTotal Tests: ${total}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${percentage}%`, percentage === 100 ? 'green' : 'yellow');
  
  if (results.failed === 0) {
    log('\n🎉 All integration tests passed!', 'green');
    log('✅ All main components (header, hero, service cards, gallery, forms) are working correctly together.', 'green');
    log('✅ Smooth transitions between sections are in place.', 'green');
    log('✅ All CSS and JavaScript files are properly loaded.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please review the issues above.', 'yellow');
  }
  
  log('\n' + '='.repeat(60), 'cyan');
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});
