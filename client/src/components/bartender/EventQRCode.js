import React, { useState, useRef } from 'react';
import QRCode from 'qrcode';

const EventQRCode = ({ event, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    generateQRCode();
  }, [event]);

  const generateQRCode = async () => {
    try {
      const eventUrl = `${window.location.origin}?code=${event.code}`;
      const dataUrl = await QRCode.toDataURL(eventUrl, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: 'H'
      });
      setQrDataUrl(dataUrl);
      setLoading(false);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // Create printable page with QR code
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Event QR Code - ${event.name}</title>
          <style>
            /* Print styles */
            body { 
              font-family: sans-serif; 
              text-align: center; 
              padding: 40px; 
            }
            h1 { font-size: 32px; margin-bottom: 20px; }
            img { max-width: 400px; }
            .code { 
              font-size: 28px; 
              font-weight: bold; 
              margin-top: 20px; 
              letter-spacing: 3px; 
            }
          </style>
        </head>
        <body>
          <h1>🍸 ${event.name}</h1>
          <p>${event.location} | ${new Date(event.date).toLocaleDateString()}</p>
          <img src="${qrDataUrl}" alt="Event QR Code" />
          <div class="code">CODE: ${event.code}</div>
          <p style="margin-top: 30px;">Scan to order drinks or enter code manually</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `event-qr-${event.code}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div className="modal">
      {/* QR Code Display */}
      <img src={qrDataUrl} alt="QR Code" />
      <button onClick={handlePrint}>🖨️ Print</button>
      <button onClick={handleDownload}>💾 Download</button>
    </div>
  );
};

export default EventQRCode;