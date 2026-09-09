const sharp = require('sharp');

async function resizeIcons() {
  try {
    await sharp('public/student-rise.png')
      .resize(192, 192)
      .toFile('public/icon-192.png');
    console.log('Created icon-192.png');
    
    await sharp('public/student-rise.png')
      .resize(512, 512)
      .toFile('public/icon-512.png');
    console.log('Created icon-512.png');
    
  } catch (err) {
    console.error('Error resizing icons:', err);
  }
}

resizeIcons();
