// Node.js script to generate placeholder.png
// Run with: node generate-placeholder.js

const fs = require('fs');

// 16x16 transparent PNG (minimal)
const base64PNG = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAFklEQVR42mN4//8/AyUYhmGwYgYGBgAQ+gP9/3fN3QAAAABJRU5ErkJggg==';

const buffer = Buffer.from(base64PNG, 'base64');
fs.writeFileSync('placeholder.png', buffer);
console.log('placeholder.png created');
