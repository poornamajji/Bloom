// Generates PWA icons (PNG) using only Node built-ins.
// Run: npm run icons
import { deflateSync, crc32 } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const OUT = new URL('../public/icons/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const C1 = [255, 158, 189];
const C2 = [183, 156, 255];
const WHITE = [255, 255, 255];
const YELLOW = [255, 217, 107];

// scale < 1 shrinks the artwork (used for the maskable safe zone)
function pixel(u, v, { scale, rounded }) {
  if (rounded) {
    // rounded-square mask, corner radius 0.22
    const r = 0.22;
    const dx = Math.max(Math.abs(u - 0.5) - (0.5 - r), 0);
    const dy = Math.max(Math.abs(v - 0.5) - (0.5 - r), 0);
    if (dx * dx + dy * dy > r * r) return [0, 0, 0, 0];
  }

  let color = mix(C1, C2, (u + v) / 2);
  const x = (u - 0.5) / scale + 0.5;
  const y = (v - 0.5) / scale + 0.5;

  const petals = [
    [0.5, 0.28],
    [0.5, 0.72],
    [0.28, 0.5],
    [0.72, 0.5],
  ];
  if (petals.some(([px, py]) => (x - px) ** 2 + (y - py) ** 2 < 0.14 ** 2)) {
    color = WHITE;
  }
  if ((x - 0.5) ** 2 + (y - 0.5) ** 2 < 0.11 ** 2) color = YELLOW;

  return [...color, 255];
}

function render(size, opts) {
  const SS = 3; // supersampling for smooth edges
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);

  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const [pr, pg, pb, pa] = pixel(
            (x + (sx + 0.5) / SS) / size,
            (y + (sy + 0.5) / SS) / size,
            opts,
          );
          r += pr * pa;
          g += pg * pa;
          b += pb * pa;
          a += pa;
        }
      }
      const o = y * stride + 1 + x * 4;
      const n = SS * SS;
      raw[o] = a ? Math.round(r / a) : 0;
      raw[o + 1] = a ? Math.round(g / a) : 0;
      raw[o + 2] = a ? Math.round(b / a) : 0;
      raw[o + 3] = Math.round(a / n);
    }
  }
  return encodePNG(size, raw);
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td) >>> 0);
  return Buffer.concat([len, td, crc]);
}

function encodePNG(size, raw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const files = [
  ['icon-192.png', 192, { scale: 1, rounded: true }],
  ['icon-512.png', 512, { scale: 1, rounded: true }],
  ['icon-maskable-512.png', 512, { scale: 0.7, rounded: false }],
  ['apple-touch-icon.png', 180, { scale: 0.9, rounded: false }],
];

for (const [name, size, opts] of files) {
  writeFileSync(new URL(name, OUT), render(size, opts));
  console.log('wrote', name);
}9