// Gera os PNGs do ícone (provisório) sem dependências: rasteriza formas simples e codifica PNG com zlib.
// Uso: npm run icons
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const BG = [0x0e, 0x10, 0x13];
const FG = [0xc6, 0xff, 0x3d];

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
function inPoly(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
// Mesmo desenho do public/icon.svg (coordenadas 0–512): cronômetro + raio.
const BOLT = [[276, 166], [196, 300], [260, 300], [236, 402], [320, 262], [254, 262]];
function shape(u, v, { rounded, scale }) {
  // scale < 1 encolhe o desenho (área segura do ícone maskable)
  const cx = 256 + (u - 256) / scale, cy = 256 + (v - 256) / scale;
  if (rounded) {
    const r = 112, dx = Math.max(r - u, 0, u - (512 - r)), dy = Math.max(r - v, 0, v - (512 - r));
    if (dx * dx + dy * dy > r * r) return null;
  }
  const d = Math.hypot(cx - 256, cy - 276);
  if (Math.abs(d - 150) <= 18) return FG;
  if (cx >= 226 && cx <= 286 && cy >= 70 && cy <= 114) return FG;
  if (inPoly(cx, cy, BOLT)) return FG;
  return BG;
}
function render(size, opts) {
  const ss = 3; // supersampling
  return png(size, (x, y) => {
    let r = 0, g = 0, b = 0, a = 0;
    for (let i = 0; i < ss; i++) for (let j = 0; j < ss; j++) {
      const c = shape(((x + (i + 0.5) / ss) / size) * 512, ((y + (j + 0.5) / ss) / size) * 512, opts);
      if (c) { r += c[0]; g += c[1]; b += c[2]; a += 255; }
    }
    const n = ss * ss, cov = a / 255 || 1;
    return [r / cov, g / cov, b / cov, a / n].map(Math.round);
  });
}
const out = (name, buf) => writeFileSync(new URL(`../public/${name}`, import.meta.url), buf);
out('icon-192.png', render(192, { rounded: true, scale: 1 }));
out('icon-512.png', render(512, { rounded: true, scale: 1 }));
out('icon-maskable-512.png', render(512, { rounded: false, scale: 0.8 }));
out('apple-touch-icon.png', render(180, { rounded: false, scale: 0.9 }));
console.log('ícones gerados em public/');
