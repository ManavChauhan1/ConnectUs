const QrCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const generateQR = async (userId, qrToken) => {
  const qrData = JSON.stringify({ userId, token: qrToken });
  const outputPath = path.join(__dirname, `qr-codes/${userId}.png`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  await QrCode.toFile(outputPath, qrData, {
    color: { dark: '#000', light: '#fff' }
  });

  console.log(`QR Saved for ${userId}`);
};

module.exports = generateQR;
