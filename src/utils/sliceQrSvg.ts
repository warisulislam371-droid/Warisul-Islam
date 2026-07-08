import qrcode from 'qrcode-generator';

export const SLICE_UPI_ID = '9149758743@slc';
export const SLICE_HOLDER_NAME = 'Warisul Islam';

export function getSliceUpiQrDataUrl(customUpiId = SLICE_UPI_ID, customHolderName = SLICE_HOLDER_NAME): string {
  // Construct standard UPI payment URI
  const upiUrl = `upi://pay?pa=${encodeURIComponent(customUpiId)}&pn=${encodeURIComponent(customHolderName)}&cu=INR`;

  // Generate real QR code matrix
  const qr = qrcode(0, 'M');
  qr.addData(upiUrl);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const startX = 70;
  const startY = 100;
  const qrBoxSize = 240;
  const cellSize = qrBoxSize / moduleCount;

  let rects = '';
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (qr.isDark(r, c)) {
        const x = Number((startX + c * cellSize).toFixed(2));
        const y = Number((startY + r * cellSize).toFixed(2));
        const w = Number((cellSize + 0.35).toFixed(2)); // slight overlap to prevent hairline gaps
        rects += `<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="#000000" />`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 460" width="100%" height="100%" style="background:#ffffff; font-family:system-ui, -apple-system, sans-serif;">
  <rect width="380" height="460" rx="20" fill="#ffffff" stroke="#f1f5f9" stroke-width="2"/>
  
  <text x="190" y="58" font-size="44" font-weight="900" fill="#6F00D3" text-anchor="middle" letter-spacing="-1.5">slice</text>
  
  <rect x="55" y="85" width="270" height="270" rx="12" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
  <g shape-rendering="crispEdges">${rects}</g>
  
  <text x="190" y="390" font-size="16" fill="#475569" text-anchor="middle">Account holder: ${customHolderName}</text>
  <text x="190" y="420" font-size="18" font-weight="700" fill="#0f172a" text-anchor="middle">UPI ID: ${customUpiId}</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

