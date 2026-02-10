/* eslint-disable no-console */

const express = require('express');
const cors = require('cors');
const path = require('path');
const exportDiagram = require('./export-core');

require('dotenv').config();

const app = express();
const API_KEY = process.env.API_KEY || '11223344zzz';

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.text({ limit: '50mb', type: 'text/plain' }));
app.use(cors());

// Serve static files (HTML frontend)
app.use(express.static(path.join(__dirname, 'public')));

// API Key authentication middleware
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API key required',
      message: 'Please provide X-API-Key header or ?apiKey=YOUR_KEY query parameter'
    });
  }
  
  if (apiKey !== API_KEY) {
    return res.status(403).json({ 
      error: 'Invalid API key',
      message: 'The provided API key is incorrect'
    });
  }
  
  next();
};

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    version: '1.0.0',
    message: 'Draw.io Export API is running'
  });
});

// Main export endpoint
app.post('/api/export', validateApiKey, async (req, res) => {
  try {
    const { xml, format = 'png', scale = 1, border = 0 } = req.body;
    
    if (!xml) {
      return res.status(400).json({ 
        error: 'Missing XML',
        message: 'XML content is required in request body'
      });
    }
    
    if (typeof xml !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid XML type',
        message: 'XML must be a string'
      });
    }

    console.log(`[${new Date().toISOString()}] Exporting diagram to ${format}...`);
    
    const buffer = await exportDiagram(xml, format, { scale, border });
    
    const mimeType = format === 'pdf' ? 'application/pdf' : 'image/png';
    const extension = format === 'pdf' ? 'pdf' : 'png';
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="diagram.${extension}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
    
    console.log(`[${new Date().toISOString()}] Successfully exported diagram (${buffer.length} bytes)`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Export error:`, error);
    res.status(500).json({ 
      error: 'Export failed',
      message: error.message
    });
  }
});

// Export with base64 response (for embedded display)
app.post('/api/export/base64', validateApiKey, async (req, res) => {
  try {
    const { xml, format = 'png', scale = 1, border = 0 } = req.body;
    
    if (!xml) {
      return res.status(400).json({ 
        error: 'Missing XML',
        message: 'XML content is required in request body'
      });
    }

    console.log(`[${new Date().toISOString()}] Exporting diagram to ${format} (base64)...`);
    
    const buffer = await exportDiagram(xml, format, { scale, border });
    const base64 = buffer.toString('base64');
    const mimeType = format === 'pdf' ? 'application/pdf' : 'image/png';
    
    res.json({
      success: true,
      format: format,
      mimeType: mimeType,
      data: base64,
      dataUrl: `data:${mimeType};base64,${base64}`,
      size: buffer.length
    });
    
    console.log(`[${new Date().toISOString()}] Successfully exported diagram to base64 (${buffer.length} bytes)`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Export error:`, error);
    res.status(500).json({ 
      error: 'Export failed',
      message: error.message
    });
  }
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    version: '1.0.0',
    title: 'Draw.io Export API',
    description: 'REST API for converting Draw.io XML diagrams to PNG or PDF',
    authentication: {
      method: 'API Key',
      location: 'X-API-Key header or apiKey query parameter',
      example: 'X-API-Key: 11223344zzz'
    },
    endpoints: [
      {
        path: '/health',
        method: 'GET',
        description: 'Health check (no authentication required)',
        response: { status: 'ok', version: '1.0.0' }
      },
      {
        path: '/api/export',
        method: 'POST',
        description: 'Export diagram and return binary blob',
        authentication: 'required',
        requestBody: {
          xml: 'string (required) - Draw.io XML content',
          format: 'string (optional, default: "png") - Output format: "png" or "pdf"',
          scale: 'number (optional, default: 1) - Scale factor',
          border: 'number (optional, default: 0) - Border width'
        },
        responseHeaders: {
          'Content-Type': 'image/png or application/pdf',
          'Content-Disposition': 'attachment; filename="diagram.png"'
        }
      },
      {
        path: '/api/export/base64',
        method: 'POST',
        description: 'Export diagram and return as base64-encoded JSON',
        authentication: 'required',
        requestBody: {
          xml: 'string (required) - Draw.io XML content',
          format: 'string (optional, default: "png") - Output format: "png" or "pdf"',
          scale: 'number (optional, default: 1) - Scale factor',
          border: 'number (optional, default: 0) - Border width'
        },
        responseBody: {
          success: 'boolean',
          format: 'string',
          mimeType: 'string',
          data: 'string (base64)',
          dataUrl: 'string (data URL for HTML img tag)',
          size: 'number (bytes)'
        }
      }
    ],
    examples: {
      curl_binary: 'curl -X POST http://localhost:3000/api/export -H "X-API-Key: 11223344zzz" -H "Content-Type: application/json" -d \'{"xml":"<mxfile>...</mxfile>", "format":"png"}\' -o diagram.png',
      curl_base64: 'curl -X POST http://localhost:3000/api/export/base64 -H "X-API-Key: 11223344zzz" -H "Content-Type: application/json" -d \'{"xml":"<mxfile>...</mxfile>", "format":"png"}\'',
      nodejs: 'fetch("/api/export", { method: "POST", headers: { "X-API-Key": "11223344zzz", "Content-Type": "application/json" }, body: JSON.stringify({ xml, format: "png" }) }).then(r => r.blob()).then(blob => { /* display blob */ })'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: `Endpoint ${req.method} ${req.path} does not exist`,
    availableEndpoints: ['/health', '/api/docs', '/api/export', '/api/export/base64']
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║         Draw.io Export REST API Server             ║
╚════════════════════════════════════════════════════╝
  
  Server running on: http://localhost:${PORT}
  API Key: ${API_KEY}
  
  Available endpoints:
  ✓ GET  /health                 - Health check
  ✓ POST /api/export             - Export as binary blob
  ✓ POST /api/export/base64      - Export as base64 JSON
  ✓ GET  /api/docs               - API documentation
  ✓ GET  /                        - Web UI

  Documentation: http://localhost:${PORT}/api/docs
  
`);
});

process.on('unhandledRejection', (e) => {
  console.error('Unhandled rejection:', e);
});

process.on('uncaughtException', (e) => {
  console.error('Uncaught exception:', e);
});
