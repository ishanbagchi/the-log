import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '../public');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="64" height="64">
  <text y="0.9em" font-size="88" font-family="system-ui,-apple-system,sans-serif" dominant-baseline="auto" fill="#9a6e32">◈</text>
</svg>`;

const png = await sharp(Buffer.from(svgContent)).resize(32, 32).png().toBuffer();
writeFileSync(join(PUBLIC, 'favicon.png'), png);

const buf = Buffer.alloc(22 + png.length);
buf.writeUInt16LE(0, 0);
buf.writeUInt16LE(1, 2);
buf.writeUInt16LE(1, 4);
buf.writeUInt8(32, 6);
buf.writeUInt8(32, 7);
buf.writeUInt8(0, 8);
buf.writeUInt8(0, 9);
buf.writeUInt16LE(1, 10);
buf.writeUInt16LE(32, 12);
buf.writeUInt32LE(png.length, 14);
buf.writeUInt32LE(22, 18);
png.copy(buf, 22);
writeFileSync(join(PUBLIC, 'favicon.ico'), buf);

console.log(`favicon.png ${png.length}B  favicon.ico ${buf.length}B`);
