import fs from 'fs';
const s = fs.readFileSync('server.ts', 'utf8');
const r = [...s.matchAll(/app\.(get|post|put|delete)\(['"](\/api\/[^'"]+)['"]/g)].map(x => x[1].toUpperCase() + ' ' + x[2]);
console.log(r.join('\n'));
