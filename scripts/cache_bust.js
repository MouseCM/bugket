const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const filePath = path.join(publicDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/href="\/styles\.css(\?v=\d+)?"/g, 'href="/styles.css?v=2"');
  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Cache busted for all HTML files.');
