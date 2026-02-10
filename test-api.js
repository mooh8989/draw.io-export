#!/usr/bin/env node
/**
 * Test Suite for Draw.io Export REST API
 * 
 * Usage:
 *   node test-api.js
 * 
 * This script tests all API endpoints and validates responses
 */

const http = require('http');
const fs = require('fs');

const API_URL = 'http://localhost:3000';
const API_KEY = '11223344zzz';

// Sample XML for testing
const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="draw.io" modified="2024-01-01T00:00:00.000Z" agent="5.0" version="20.8.0">
  <diagram id="test" name="Test">
    <mxGraphModel dx="400" dy="400" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <mxCell id="2" value="Test Diagram" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;" vertex="1" parent="1">
          <mxGeometry x="150" y="150" width="500" height="150" as="geometry"/>
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

// Test results
let passed = 0;
let failed = 0;

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',      // Cyan
    success: '\x1b[32m',   // Green
    error: '\x1b[31m',     // Red
    warning: '\x1b[33m',   // Yellow
    reset: '\x1b[0m'
  };
  
  const color = colors[type] || colors.info;
  console.log(`${color}${message}${colors.reset}`);
}

function test(name, fn) {
  return fn()
    .then(() => {
      log(`✓ ${name}`, 'success');
      passed++;
    })
    .catch((error) => {
      log(`✗ ${name}`, 'error');
      log(`  Error: ${error.message}`, 'error');
      failed++;
    });
}

function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }

    req.end();
  });
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  Draw.io Export API Test Suite         ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Test 1: Health check
  await test('GET /health (no auth required)', async () => {
    const res = await request('GET', '/health');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = JSON.parse(res.body);
    if (!data.status || data.status !== 'ok') throw new Error('Invalid health response');
  });

  // Test 2: API Docs
  await test('GET /api/docs (no auth required)', async () => {
    const res = await request('GET', '/api/docs');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = JSON.parse(res.body);
    if (!data.endpoints) throw new Error('Invalid docs response');
  });

  // Test 3: Missing API key
  await test('POST /api/export without API key (should fail)', async () => {
    const res = await request('POST', '/api/export', {}, { xml: SAMPLE_XML, format: 'png' });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    const data = JSON.parse(res.body);
    if (!data.error) throw new Error('Error response missing error field');
  });

  // Test 4: Invalid API key
  await test('POST /api/export with invalid API key (should fail)', async () => {
    const res = await request('POST', '/api/export', { 'X-API-Key': 'wrong-key' }, { xml: SAMPLE_XML, format: 'png' });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // Test 5: Missing XML
  await test('POST /api/export without XML (should fail)', async () => {
    const res = await request('POST', '/api/export', { 'X-API-Key': API_KEY }, { format: 'png' });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // Test 6: Export PNG (binary)
  await test('POST /api/export with valid PNG request', async () => {
    const res = await request('POST', '/api/export', { 'X-API-Key': API_KEY }, { xml: SAMPLE_XML, format: 'png' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.headers['content-type'].includes('image/png')) throw new Error('Invalid content type');
    if (res.body.length === 0) throw new Error('Empty response body');
  });

  // Test 7: Export PDF (binary)
  await test('POST /api/export with valid PDF request', async () => {
    const res = await request('POST', '/api/export', { 'X-API-Key': API_KEY }, { xml: SAMPLE_XML, format: 'pdf' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.headers['content-type'].includes('application/pdf')) throw new Error('Invalid content type');
    if (res.body.length === 0) throw new Error('Empty response body');
  });

  // Test 8: Export PNG (base64)
  await test('POST /api/export/base64 with PNG format', async () => {
    const res = await request('POST', '/api/export/base64', { 'X-API-Key': API_KEY }, { xml: SAMPLE_XML, format: 'png' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = JSON.parse(res.body);
    if (!data.success) throw new Error('Response success is false');
    if (!data.data) throw new Error('Missing base64 data');
    if (!data.dataUrl) throw new Error('Missing dataUrl');
    if (data.format !== 'png') throw new Error('Invalid format in response');
    if (!data.mimeType) throw new Error('Missing mimeType');
  });

  // Test 9: Export PDF (base64)
  await test('POST /api/export/base64 with PDF format', async () => {
    const res = await request('POST', '/api/export/base64', { 'X-API-Key': API_KEY }, { xml: SAMPLE_XML, format: 'pdf' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = JSON.parse(res.body);
    if (data.format !== 'pdf') throw new Error('Invalid format in response');
  });

  // Test 10: Scale parameter
  await test('POST /api/export/base64 with scale parameter', async () => {
    const res = await request('POST', '/api/export/base64', { 'X-API-Key': API_KEY }, { xml: SAMPLE_XML, format: 'png', scale: 2 });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = JSON.parse(res.body);
    if (!data.data) throw new Error('Export failed');
  });

  // Test 11: Border parameter
  await test('POST /api/export/base64 with border parameter', async () => {
    const res = await request('POST', '/api/export/base64', { 'X-API-Key': API_KEY }, { xml: SAMPLE_XML, format: 'png', border: 20 });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = JSON.parse(res.body);
    if (!data.data) throw new Error('Export failed');
  });

  // Test 12: API key via query parameter
  await test('POST /api/export using query parameter for API key', async () => {
    const res = await request('POST', `/api/export?apiKey=${API_KEY}`, {}, { xml: SAMPLE_XML, format: 'png' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // Test 13: 404 handler
  await test('GET /nonexistent (should return 404)', async () => {
    const res = await request('GET', '/nonexistent', { 'X-API-Key': API_KEY });
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
    const data = JSON.parse(res.body);
    if (!data.error) throw new Error('Error response missing error field');
  });

  // Summary
  console.log('\n╔════════════════════════════════════════╗');
  console.log(`║  Tests Passed: ${passed}/${passed + failed}${' '.repeat(Math.max(0, 22 - (`${passed}/${passed + failed}`).length))}║`);
  console.log('╚════════════════════════════════════════╝\n');

  if (failed > 0) {
    log(`\n${failed} test(s) failed!`, 'error');
    process.exit(1);
  } else {
    log('All tests passed! ✓', 'success');
    process.exit(0);
  }
}

// Run tests
runTests().catch((error) => {
  log(`Fatal error: ${error.message}`, 'error');
  process.exit(1);
});
