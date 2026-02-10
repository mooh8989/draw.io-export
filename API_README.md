# Draw.io Export REST API

A modern REST API service for converting Draw.io diagrams (XML) to PNG, PDF and other formats. This project transforms the original command-line tool into a production-ready web API with web UI.

## Features

✨ **REST API** - Convert diagrams via HTTP endpoints  
🎨 **Web UI** - Beautiful web interface included  
🔐 **API Key Authentication** - Secure access with configurable API keys  
📦 **Multiple Formats** - PNG and PDF output  
🎯 **Base64 Support** - Get data URLs for direct HTML embedding  
🚀 **Fast & Reliable** - Powered by Puppeteer and Chrome  
📱 **CORS Enabled** - Works from any frontend origin  

## Installation

```bash
npm install
```

## Configuration

Edit `.env` file to configure:

```env
API_KEY=11223344zzz
PORT=3000
NODE_ENV=development
```

## Usage

### Start the Server

```bash
npm start
```

Server will run on `http://localhost:3000`

### Web Interface

Visit `http://localhost:3000` in your browser to access the interactive web UI.

### API Endpoints

#### 1. Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "message": "Draw.io Export API is running"
}
```

#### 2. Export as Binary Blob

Returns the diagram as a binary file (PNG/PDF).

```bash
POST /api/export
X-API-Key: 11223344zzz
Content-Type: application/json

{
  "xml": "<mxfile><diagram>...</diagram></mxfile>",
  "format": "png",
  "scale": 1,
  "border": 0
}
```

**Response:** Binary PNG/PDF file with appropriate headers

**Example with cURL:**
```bash
curl -X POST http://localhost:3000/api/export \
  -H "X-API-Key: 11223344zzz" \
  -H "Content-Type: application/json" \
  -d '{"xml":"<mxfile>...</mxfile>","format":"png"}' \
  -o diagram.png
```

**Example with Node.js:**
```javascript
const response = await fetch('http://localhost:3000/api/export', {
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

const blob = await response.blob();
const url = URL.createObjectURL(blob);
// Display or download the blob
```

#### 3. Export as Base64 JSON

Returns the diagram as base64-encoded JSON (useful for embedding in HTML).

```bash
POST /api/export/base64
X-API-Key: 11223344zzz
Content-Type: application/json

{
  "xml": "<mxfile><diagram>...</diagram></mxfile>",
  "format": "png",
  "scale": 1,
  "border": 0
}
```

**Response:**
```json
{
  "success": true,
  "format": "png",
  "mimeType": "image/png",
  "data": "iVBORw0KGgoAAAANSUhEUgAA...",
  "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "size": 12345
}
```

**Example with React:**
```jsx
function ExportDiagram() {
  const [imageUrl, setImageUrl] = useState(null);

  const handleExport = async (xmlContent) => {
    const response = await fetch('http://localhost:3000/api/export/base64', {
      method: 'POST',
      headers: {
        'X-API-Key': '11223344zzz',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ xml: xmlContent, format: 'png' })
    });

    const data = await response.json();
    setImageUrl(data.dataUrl);
  };

  return (
    <>
      <button onClick={() => handleExport(xmlContent)}>Export</button>
      {imageUrl && <img src={imageUrl} alt="Diagram" />}
    </>
  );
}
```

#### 4. API Documentation

```bash
GET /api/docs
```

Returns comprehensive API documentation in JSON format.

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `xml` | string | Yes | - | Draw.io XML diagram content |
| `format` | string | No | `png` | Output format: `png` or `pdf` |
| `scale` | number | No | `1` | Scale factor (0.5 - 5) |
| `border` | number | No | `0` | Border width in pixels |

### Authentication

Provide API key via one of these methods:

1. **Header** (recommended):
```bash
X-API-Key: 11223344zzz
```

2. **Query Parameter**:
```bash
/api/export?apiKey=11223344zzz
```

## Docker

### Build

```bash
docker build -t drawio-export .
```

### Run

```bash
docker run -p 3000:3000 \
  -e API_KEY=11223344zzz \
  -e PORT=3000 \
  drawio-export
```

Or with docker-compose:

```yaml
version: '3.8'
services:
  drawio-export:
    build: .
    ports:
      - "3000:3000"
    environment:
      API_KEY: 11223344zzz
      PORT: 3000
      NODE_ENV: production
```

Run with:
```bash
docker-compose up
```

## Project Structure

```
├── api.js                 # Main REST API server
├── export-core.js         # Core export logic (accepts XML string)
├── export.js              # Original CLI export (legacy)
├── index.js               # CLI entry point (legacy)
├── public/
│   └── index.html         # Web UI interface
├── bin/
│   └── drawio.js          # CLI executable
├── .env                   # Configuration
├── package.json           # Dependencies
├── Dockerfile             # Docker configuration
└── README.md              # This file
```

## API Key Security

**Important:** The default API key is for demonstration purposes only.

For production:

1. Change the API key in `.env`:
```env
API_KEY=your-super-secret-key-here
```

2. Use environment variables:
```bash
docker run -p 3000:3000 -e API_KEY=your-key drawio-export
```

3. Implement additional security:
   - Use HTTPS in production
   - Rate limiting
   - CORS restrictions
   - Request validation

## Error Handling

All errors return appropriate HTTP status codes and JSON responses:

```json
{
  "error": "Missing XML",
  "message": "XML content is required in request body"
}
```

Common error codes:
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (missing API key)
- `403` - Forbidden (invalid API key)
- `500` - Server Error (export processing failed)

## Performance Tips

1. **Cache exports** - Store frequently exported diagrams
2. **Batch processing** - Implement request queuing for high volume
3. **Scale deployment** - Use load balancing for multiple instances
4. **Optimize diagrams** - Remove unnecessary elements before export

## Troubleshooting

### "Chrome not found" error

Set `CHROMIUM_PATH` environment variable:
```bash
export CHROMIUM_PATH=/usr/bin/chromium-browser
npm start
```

Or in Docker:
```dockerfile
ENV CHROMIUM_PATH=/usr/bin/chromium-browser
```

### Timeout errors

Increase timeout or reduce diagram complexity:
```bash
# In Docker
-e TIMEOUT=30000
```

### Memory issues

Increase available memory:
```bash
docker run -m 2gb drawio-export
```

## Examples

### JavaScript/Fetch

```javascript
async function exportDiagram(xmlContent) {
  const response = await fetch('http://localhost:3000/api/export/base64', {
    method: 'POST',
    headers: {
      'X-API-Key': '11223344zzz',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      xml: xmlContent,
      format: 'png',
      scale: 1.5,
      border: 10
    })
  });

  const result = await response.json();
  return result.dataUrl; // Use in <img src="...">
}
```

### Python

```python
import requests
import json

def export_diagram(xml_content):
    response = requests.post(
        'http://localhost:3000/api/export',
        headers={
            'X-API-Key': '11223344zzz',
            'Content-Type': 'application/json'
        },
        json={
            'xml': xml_content,
            'format': 'png'
        }
    )
    
    with open('diagram.png', 'wb') as f:
        f.write(response.content)
```

### cURL

```bash
# Export as PNG
curl -X POST http://localhost:3000/api/export \
  -H "X-API-Key: 11223344zzz" \
  -H "Content-Type: application/json" \
  -d '{
    "xml": "<mxfile>...</mxfile>",
    "format": "png",
    "scale": 1
  }' \
  -o diagram.png

# Export as PDF
curl -X POST http://localhost:3000/api/export \
  -H "X-API-Key: 11223344zzz" \
  -H "Content-Type: application/json" \
  -d '{
    "xml": "<mxfile>...</mxfile>",
    "format": "pdf"
  }' \
  -o diagram.pdf

# Get API documentation
curl http://localhost:3000/api/docs | jq
```

## License

MIT

## Original Project

Based on [draw.io-export](https://github.com/b1f6c1c4/draw.io-export) by b1f6c1c4

## Support

For issues and questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review [API documentation endpoint](#4-api-documentation)
3. Check server logs: `npm start`
