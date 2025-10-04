const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createIcons() {
  const svgPath = path.join(__dirname, '..', 'assets', 'icon.svg');
  const assetsDir = path.join(__dirname, '..', 'assets');

  // Create PNG icon (512x512 for Linux)
  await sharp(svgPath)
    .resize(512, 512)
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));

  // Create ICO icon (256x256 for Windows)
  await sharp(svgPath)
    .resize(256, 256)
    .png()
    .toFile(path.join(assetsDir, 'icon-256.png'));

  // Create ICNS would require additional tools, for now we'll use the PNG

  console.log('Icons created successfully!');
}

createIcons().catch(console.error);
