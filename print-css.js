const fs = require('fs');
const css = fs.readFileSync('src/app/page.module.css', 'utf8');
const lines = css.split('\n');
let i = lines.findIndex(l => l.includes('@media (max-width: 1024px)'));
console.log(lines.slice(i, i+50).join('\n'));
