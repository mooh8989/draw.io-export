/**
 * Example: React Component Integration
 * 
 * Shows how to use the Draw.io Export API in a React application
 */

import React, { useState } from 'react';

const API_KEY = '11223344zzz';
const API_URL = 'http://localhost:3000';

export function DiagramExporter() {
  const [xml, setXml] = useState('');
  const [format, setFormat] = useState('png');
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exportedImage, setExportedImage] = useState(null);
  const [exportedPDF, setExportedPDF] = useState(null);

  const handleExport = async () => {
    if (!xml.trim()) {
      setError('Please enter XML content');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/export/base64`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ xml, format, scale })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message);
      }

      const data = await response.json();

      if (format === 'png') {
        setExportedImage({
          url: data.dataUrl,
          size: data.size,
          base64: data.data
        });
        setExportedPDF(null);
      } else {
        setExportedPDF({
          base64: data.data,
          size: data.size
        });
        setExportedImage(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (format === 'png' && exportedImage) {
      const link = document.createElement('a');
      link.href = exportedImage.url;
      link.download = 'diagram.png';
      link.click();
    } else if (format === 'pdf' && exportedPDF) {
      const link = document.createElement('a');
      const blob = new Blob([Uint8Array.from(atob(exportedPDF.base64), c => c.charCodeAt(0))], { type: 'application/pdf' });
      link.href = URL.createObjectURL(blob);
      link.download = 'diagram.pdf';
      link.click();
    }
  };

  return (
    <div className="diagram-exporter">
      <h2>Draw.io Diagram Exporter</h2>

      <div className="form-group">
        <label>Diagram XML:</label>
        <textarea
          value={xml}
          onChange={(e) => setXml(e.target.value)}
          placeholder="Paste your draw.io XML here..."
          rows={8}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Format:</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="png">PNG</option>
            <option value="pdf">PDF</option>
          </select>
        </div>

        <div className="form-group">
          <label>Scale:</label>
          <input
            type="number"
            min="0.5"
            max="5"
            step="0.5"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
          />
        </div>
      </div>

      <button onClick={handleExport} disabled={loading}>
        {loading ? 'Exporting...' : 'Export Diagram'}
      </button>

      {error && <div className="error">{error}</div>}

      {exportedImage && (
        <div className="result">
          <h3>Preview</h3>
          <img src={exportedImage.url} alt="Exported diagram" />
          <p>Size: {(exportedImage.size / 1024).toFixed(2)} KB</p>
          <button onClick={handleDownload}>Download PNG</button>
        </div>
      )}

      {exportedPDF && (
        <div className="result">
          <h3>PDF Exported</h3>
          <p>Size: {(exportedPDF.size / 1024).toFixed(2)} KB</p>
          <button onClick={handleDownload}>Download PDF</button>
        </div>
      )}
    </div>
  );
}

// CSS Styles
export const styles = `
  .diagram-exporter {
    max-width: 800px;
    margin: 20px auto;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
  }

  .form-group {
    margin-bottom: 15px;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }

  .form-group textarea,
  .form-group input,
  .form-group select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }

  button {
    padding: 10px 20px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  button:hover {
    background: #5568d3;
  }

  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .error {
    color: #d32f2f;
    padding: 10px;
    margin: 10px 0;
    background: #ffebee;
    border-radius: 4px;
  }

  .result {
    margin-top: 20px;
    padding: 15px;
    background: #f5f5f5;
    border-radius: 4px;
  }

  .result img {
    max-width: 100%;
    border: 1px solid #ddd;
    margin: 10px 0;
  }
`;
