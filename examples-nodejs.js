/**
 * Example: Basic Node.js/Express Integration
 * 
 * Shows how to use the Draw.io Export API from a Node.js application
 */

const fetch = require('node-fetch');
const fs = require('fs');

const API_KEY = '11223344zzz';
const API_URL = 'http://localhost:3000';

// Read sample XML file
const xmlContent = fs.readFileSync('./sample-diagram.xml', 'utf-8');

/**
 * Example 1: Export as PNG binary file
 */
async function exportAsPNG() {
  console.log('📊 Exporting as PNG...');
  
  const response = await fetch(`${API_URL}/api/export`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      xml: xmlContent,
      format: 'png',
      scale: 1.5
    })
  });

  const buffer = await response.buffer();
  fs.writeFileSync('output.png', buffer);
  console.log('✅ PNG saved to output.png');
}

/**
 * Example 2: Export as Base64 for HTML embedding
 */
async function exportAsBase64() {
  console.log('📊 Exporting as Base64...');
  
  const response = await fetch(`${API_URL}/api/export/base64`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      xml: xmlContent,
      format: 'png'
    })
  });

  const data = await response.json();
  
  // Create HTML file with embedded image
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Exported Diagram</title>
    </head>
    <body>
      <h1>Diagram</h1>
      <img src="${data.dataUrl}" alt="Diagram" style="max-width: 100%; border: 1px solid #ccc;">
      <p>Size: ${(data.size / 1024).toFixed(2)} KB</p>
    </body>
    </html>
  `;
  
  fs.writeFileSync('output.html', html);
  console.log('✅ HTML file saved to output.html');
}

/**
 * Example 3: Export as PDF
 */
async function exportAsPDF() {
  console.log('📊 Exporting as PDF...');
  
  const response = await fetch(`${API_URL}/api/export`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      xml: xmlContent,
      format: 'pdf'
    })
  });

  const buffer = await response.buffer();
  fs.writeFileSync('output.pdf', buffer);
  console.log('✅ PDF saved to output.pdf');
}

/**
 * Example 4: Error handling
 */
async function exportWithErrorHandling() {
  try {
    console.log('📊 Exporting with error handling...');
    
    const response = await fetch(`${API_URL}/api/export/base64`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        xml: xmlContent,
        format: 'png'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API error: ${error.message}`);
    }

    const data = await response.json();
    console.log(`✅ Export successful (${(data.size / 1024).toFixed(2)} KB)`);
    return data;

  } catch (error) {
    console.error('❌ Export failed:', error.message);
    return null;
  }
}

/**
 * Example 5: Batch export multiple diagrams
 */
async function batchExport() {
  console.log('📊 Batch exporting multiple diagrams...');
  
  const diagrams = [
    { name: 'diagram1', xml: xmlContent, format: 'png' },
    { name: 'diagram2', xml: xmlContent, format: 'pdf' },
  ];

  for (const diagram of diagrams) {
    try {
      const response = await fetch(`${API_URL}/api/export`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          xml: diagram.xml,
          format: diagram.format
        })
      });

      const buffer = await response.buffer();
      const filename = `${diagram.name}.${diagram.format}`;
      fs.writeFileSync(filename, buffer);
      console.log(`✅ ${filename} saved`);
    } catch (error) {
      console.error(`❌ Failed to export ${diagram.name}:`, error.message);
    }
  }
}

// Run examples
(async () => {
  try {
    await exportAsPNG();
    await exportAsBase64();
    await exportAsPDF();
    await batchExport();
  } catch (error) {
    console.error('Error:', error);
  }
})();
