const bwipjs = require('bwip-js');
const path = require('path');
const fs = require('fs');

const generateBarcode = async (userId, barcodeToken) => {
  const barcodeData = JSON.stringify({ userId, token: barcodeToken });
  const outputPath = path.join(__dirname, `bar-codes/${userId}.png`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const png = await bwipjs.toBuffer({
    bcid: 'code128',
    text: barcodeData,
    scale: 5,
    height: 15,
    includetext: false,
    backgroundcolor: 'FFFFFF',
    paddingwidth: 10
  });

  fs.writeFileSync(outputPath, png);
  console.log(`Barcode Saved for ${userId}`);
};

module.exports = generateBarcode;
