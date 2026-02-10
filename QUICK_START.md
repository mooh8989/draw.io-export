# Quick Start Guide - Draw.io Export REST API

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Start the API Server

```bash
npm start
```

You should see:
```
╔════════════════════════════════════════════════════╗
║         Draw.io Export REST API Server             ║
╚════════════════════════════════════════════════════╝
  
  Server running on: http://localhost:3000
  API Key: 11223344zzz
```

### Step 3: Open Web UI

Visit: **http://localhost:3000**

You'll see the beautiful web interface where you can:
- Paste Draw.io XML diagrams
- Select output format (PNG/PDF)
- Adjust scale and border
- Export and download

## 📝 First API Call

### Using cURL

```bash
# First, get a sample XML
curl -s http://localhost:3000 > sample.xml

# Export as PNG
curl -X POST http://localhost:3000/api/export \
  -H "X-API-Key: 11223344zzz" \
  -H "Content-Type: application/json" \
  -d '{
    "xml":"<mxfile><diagram><mxGraphModel><root><mxCell id=\"0\"/><mxCell id=\"1\" parent=\"0\"/><mxCell id=\"2\" value=\"Hello World\" style=\"rounded=1;whiteSpace=wrap;html=1;\" vertex=\"1\" parent=\"1\"><mxGeometry x=\"100\" y=\"100\" width=\"200\" height=\"100\" as=\"geometry\"/></mxCell></root></mxGraphModel></diagram></mxfile>",
    "format":"png"
  }' \
  -o my-diagram.png
```

### Using Node.js

```javascript
const fetch = require('node-fetch');

async function exportDiagram() {
  const response = await fetch('http://localhost:3000/api/export/base64', {
    method: 'POST',
    headers: {
      'X-API-Key': '11223344zzz',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      xml: '<mxfile>...</mxfile>',
      format: 'png'
    })
  });

  const result = await response.json();
  console.log('Image URL:', result.dataUrl);
}

exportDiagram();
```

### Using Python

```python
import requests
import json

response = requests.post(
    'http://localhost:3000/api/export/base64',
    headers={
        'X-API-Key': '11223344zzz',
        'Content-Type': 'application/json'
    },
    json={
        'xml': '<mxfile>...</mxfile>',
        'format': 'png'
    }
)

result = response.json()
print(result['dataUrl'])  # Use in HTML <img> tag
```

## 🌐 API Endpoints Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Web UI |
| `/health` | GET | Health check |
| `/api/export` | POST | Export as binary blob |
| `/api/export/base64` | POST | Export as base64 JSON |
| `/api/docs` | GET | API documentation |

## 🔐 Authentication

All API endpoints (except `/health` and `/`) require the API key:

**Option 1: Header** (recommended)
```bash
curl -H "X-API-Key: 11223344zzz" http://localhost:3000/api/export
```

**Option 2: Query Parameter**
```bash
curl "http://localhost:3000/api/export?apiKey=11223344zzz"
```

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t drawio-export .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -e API_KEY=11223344zzz \
  drawio-export
```

Access at: http://localhost:3000

## 💡 Common Use Cases

### 1. Convert Draw.io File to PNG

1. Export your diagram as XML from Draw.io
2. Copy the XML content
3. Use the web UI or API to convert

### 2. Embed in HTML

```html
<div id="diagram-container"></div>

<script>
  fetch('/api/export/base64', {
    method: 'POST',
    headers: { 'X-API-Key': '11223344zzz' },
    body: JSON.stringify({ xml: xmlContent, format: 'png' })
  })
  .then(r => r.json())
  .then(data => {
    document.querySelector('#diagram-container').innerHTML = 
      `<img src="${data.dataUrl}" />`;
  });
</script>
```

### 3. Generate Reports with Diagrams

```python
from reportlab.pdfgen import canvas
import requests

# Get diagram as PNG
response = requests.post(...)
diagram_png = response.content

# Add to PDF report
pdf = canvas.Canvas("report.pdf")
pdf.drawString(100, 750, "System Architecture")
pdf.drawImage(diagram_png, 100, 500, width=400, height=200)
pdf.save()
```

### 4. Batch Convert Multiple Diagrams

```javascript
const diagrams = [
  { name: 'diagram1', xml: '<mxfile>...</mxfile>' },
  { name: 'diagram2', xml: '<mxfile>...</mxfile>' }
];

for (const diagram of diagrams) {
  const response = await fetch('/api/export', {
    method: 'POST',
    headers: { 'X-API-Key': '11223344zzz' },
    body: JSON.stringify({
      xml: diagram.xml,
      format: 'png'
    })
  });
  
  const blob = await response.blob();
  // Download or process blob
}
```

## 📊 Request/Response Examples

### Request: Export to PNG

```json
POST /api/export/base64
X-API-Key: 11223344zzz

{
  "xml": "<mxfile><diagram>...</diagram></mxfile>",
  "format": "png",
  "scale": 1.5,
  "border": 10
}
```

### Response: Successful Export

```json
{
  "success": true,
  "format": "png",
  "mimeType": "image/png",
  "data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAY...",
  "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE...",
  "size": 1234
}
```

### Response: Error

```json
{
  "error": "Missing XML",
  "message": "XML content is required in request body"
}
```

## 🔧 Environment Variables

Create or edit `.env`:

```env
API_KEY=11223344zzz      # Your API key
PORT=3000               # Server port
NODE_ENV=development    # development or production
```

## ⚙️ API Configuration

### Export Options

- **scale** (1-5): Zoom level for rendering
- **border** (0-100): Pixels around diagram
- **format**: "png" or "pdf"

### Example with All Options

```json
{
  "xml": "<mxfile>...</mxfile>",
  "format": "png",
  "scale": 2,
  "border": 20
}
```

## 🐛 Troubleshooting

### "Chrome not found"
```bash
# Install Chromium
# Ubuntu/Debian:
sudo apt-get install chromium-browser

# Set path in .env:
CHROMIUM_PATH=/usr/bin/chromium-browser
```

### Port Already in Use
```bash
# Change port:
PORT=3001 npm start

# Or find process on port 3000:
lsof -i :3000
kill -9 <PID>
```

### Memory Issues
```bash
# Increase Node.js memory:
NODE_OPTIONS=--max-old-space-size=4096 npm start
```

## 📚 Learn More

- [Full API Documentation](./API_README.md)
- [React Integration Example](./examples-react.jsx)
- [Node.js Examples](./examples-nodejs.js)
- [Sample Diagram](./sample-diagram.xml)

## ✅ Next Steps

1. ✓ Start the server: `npm start`
2. ✓ Visit http://localhost:3000
3. ✓ Export your first diagram
4. ✓ Integrate into your application
5. ✓ Deploy to production

## 🎉 That's It!

You now have a fully functional REST API for exporting Draw.io diagrams. Visit `/api/docs` for comprehensive API documentation.

Happy diagramming! 🚀
