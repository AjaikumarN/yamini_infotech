import React, { useState } from 'react';
import '../styles/salesman.css';

/**
 * ExportButtons - Export data to PDF, Excel, CSV
 * Generates reports for calls, enquiries, orders
 */
export default function ExportButtons({ data, filename = 'report', type = 'calls' }) {
  const [exporting, setExporting] = useState(false);

  const exportToCSV = () => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    setExporting(true);

    // Convert data to CSV
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
      Object.values(row)
        .map(val => `"${val}"`)
        .join(',')
    );
    const csv = [headers, ...rows].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    setExporting(false);
  };

  const exportToPDF = async () => {
    setExporting(true);
    
    // Simple HTML to PDF approach
    const content = generateHTMLReport(data, type);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();

    setExporting(false);
  };

  const generateHTMLReport = (data, reportType) => {
    const title = reportType.charAt(0).toUpperCase() + reportType.slice(1) + ' Report';
    const date = new Date().toLocaleDateString();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #2563EB; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #2563EB; color: white; }
          .header { margin-bottom: 30px; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>Generated on: ${date}</p>
          <p>Total Records: ${data.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              ${Object.keys(data[0] || {}).map(key => `<th>${key}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${Object.values(row).map(val => `<td>${val}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Yamini Infotech - Salesman Portal</p>
        </div>
      </body>
      </html>
    `;
  };

  const shareReport = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${filename} Report`,
          text: `Report generated with ${data.length} records`,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      alert('Sharing not supported on this device');
    }
  };

  return (
    <div className="export-buttons">
      <button
        className="btn btn-secondary btn-sm"
        onClick={exportToCSV}
        disabled={exporting || !data || data.length === 0}
      >
        📊 Export CSV
      </button>
      <button
        className="btn btn-secondary btn-sm"
        onClick={exportToPDF}
        disabled={exporting || !data || data.length === 0}
      >
        📄 Export PDF
      </button>
      {navigator.share && (
        <button
          className="btn btn-secondary btn-sm"
          onClick={shareReport}
          disabled={exporting || !data || data.length === 0}
        >
          📤 Share
        </button>
      )}
    </div>
  );
}
