const Jimp = require('jimp');

async function resizeIcons() {
  try {
    const image = await Jimp.read('public/student-rise.png');
    
    await image.clone().resize(192, 192).writeAsync('public/icon-192.png');
    console.log('Created icon-192.png');
    
    await image.clone().resize(512, 512).writeAsync('public/icon-512.png');
    console.log('Created icon-512.png');
    
  } catch (err) {
    console.error('Error resizing icons:', err);
  }
}

resizeIcons();
