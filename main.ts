// World News — 20 November 2026 front page.
// Node 22, standard library only. Draws the whole infographic procedurally
// (own 5x7 bitmap font, own minimal PNG writer) and writes /output/entry.png.
// Deterministic: no clock, no randomness, fixed coordinates everywhere.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

// ---------------------------------------------------------------- font
// 5x7 bitmap font, one row per number, MSB = leftmost pixel.
const FONT: Record<string, number[]> = {
  ' ': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  '!': [0x04, 0x04, 0x04, 0x04, 0x04, 0x00, 0x04],
  '"': [0x0a, 0x0a, 0x0a, 0x00, 0x00, 0x00, 0x00],
  '#': [0x0a, 0x0a, 0x1f, 0x0a, 0x1f, 0x0a, 0x0a],
  '$': [0x04, 0x0f, 0x14, 0x0e, 0x05, 0x1e, 0x04],
  '%': [0x19, 0x1a, 0x02, 0x04, 0x08, 0x0b, 0x13],
  '&': [0x0c, 0x12, 0x14, 0x08, 0x15, 0x12, 0x0d],
  "'": [0x04, 0x04, 0x08, 0x00, 0x00, 0x00, 0x00],
  '(': [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
  ')': [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  '*': [0x00, 0x15, 0x0e, 0x1f, 0x0e, 0x15, 0x00],
  '+': [0x00, 0x04, 0x04, 0x1f, 0x04, 0x04, 0x00],
  ',': [0x00, 0x00, 0x00, 0x00, 0x04, 0x04, 0x08],
  '-': [0x00, 0x00, 0x00, 0x1f, 0x00, 0x00, 0x00],
  '.': [0x00, 0x00, 0x00, 0x00, 0x00, 0x0c, 0x0c],
  '/': [0x01, 0x02, 0x02, 0x04, 0x08, 0x08, 0x10],
  '0': [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  '1': [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  '2': [0x0e, 0x11, 0x01, 0x06, 0x08, 0x10, 0x1f],
  '3': [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  '4': [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  '5': [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  '6': [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  '7': [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  '8': [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  '9': [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  ':': [0x00, 0x0c, 0x0c, 0x00, 0x0c, 0x0c, 0x00],
  ';': [0x00, 0x0c, 0x0c, 0x00, 0x0c, 0x0c, 0x08],
  '<': [0x02, 0x04, 0x08, 0x10, 0x08, 0x04, 0x02],
  '=': [0x00, 0x00, 0x1f, 0x00, 0x1f, 0x00, 0x00],
  '>': [0x08, 0x04, 0x02, 0x01, 0x02, 0x04, 0x08],
  '?': [0x0e, 0x11, 0x01, 0x06, 0x04, 0x00, 0x04],
  '@': [0x0e, 0x11, 0x17, 0x15, 0x16, 0x10, 0x0e],
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1c, 0x12, 0x11, 0x11, 0x11, 0x12, 0x1c],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x15, 0x0a],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  '[': [0x0e, 0x08, 0x08, 0x08, 0x08, 0x08, 0x0e],
  '\\': [0x10, 0x08, 0x08, 0x04, 0x02, 0x02, 0x01],
  ']': [0x0e, 0x02, 0x02, 0x02, 0x02, 0x02, 0x0e],
  '^': [0x04, 0x0a, 0x11, 0x00, 0x00, 0x00, 0x00],
  _: [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1f],
  '`': [0x04, 0x04, 0x02, 0x00, 0x00, 0x00, 0x00],
  a: [0x00, 0x00, 0x0e, 0x01, 0x0f, 0x11, 0x0f],
  b: [0x10, 0x10, 0x1e, 0x11, 0x11, 0x11, 0x1e],
  c: [0x00, 0x00, 0x0e, 0x10, 0x10, 0x11, 0x0e],
  d: [0x01, 0x01, 0x0f, 0x11, 0x11, 0x11, 0x0f],
  e: [0x00, 0x00, 0x0e, 0x11, 0x1f, 0x10, 0x0e],
  f: [0x06, 0x09, 0x08, 0x1e, 0x08, 0x08, 0x08],
  g: [0x00, 0x0f, 0x11, 0x11, 0x0f, 0x01, 0x0e],
  h: [0x10, 0x10, 0x1e, 0x11, 0x11, 0x11, 0x11],
  i: [0x04, 0x00, 0x0c, 0x04, 0x04, 0x04, 0x0e],
  j: [0x02, 0x00, 0x06, 0x02, 0x02, 0x12, 0x0c],
  k: [0x10, 0x10, 0x12, 0x14, 0x18, 0x14, 0x12],
  l: [0x0c, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  m: [0x00, 0x00, 0x1a, 0x15, 0x15, 0x15, 0x15],
  n: [0x00, 0x00, 0x1e, 0x11, 0x11, 0x11, 0x11],
  o: [0x00, 0x00, 0x0e, 0x11, 0x11, 0x11, 0x0e],
  p: [0x00, 0x00, 0x1e, 0x11, 0x11, 0x1e, 0x10],
  q: [0x00, 0x00, 0x0f, 0x11, 0x11, 0x0f, 0x01],
  r: [0x00, 0x00, 0x16, 0x19, 0x10, 0x10, 0x10],
  s: [0x00, 0x00, 0x0f, 0x10, 0x0e, 0x01, 0x1e],
  t: [0x08, 0x08, 0x1c, 0x08, 0x08, 0x09, 0x06],
  u: [0x00, 0x00, 0x11, 0x11, 0x11, 0x13, 0x0d],
  v: [0x00, 0x00, 0x11, 0x11, 0x11, 0x0a, 0x04],
  w: [0x00, 0x00, 0x11, 0x15, 0x15, 0x15, 0x0a],
  x: [0x00, 0x00, 0x11, 0x0a, 0x04, 0x0a, 0x11],
  y: [0x00, 0x00, 0x11, 0x11, 0x0f, 0x01, 0x0e],
  z: [0x00, 0x00, 0x1f, 0x02, 0x04, 0x08, 0x1f],
  '{': [0x02, 0x04, 0x04, 0x0e, 0x04, 0x04, 0x02],
  '|': [0x04, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  '}': [0x08, 0x04, 0x04, 0x0e, 0x04, 0x04, 0x08],
  '~': [0x00, 0x00, 0x09, 0x16, 0x00, 0x00, 0x00],
};

// ---------------------------------------------------------------- canvas
const W = 1024;
const H = 1024;
type RGB = [number, number, number];
const PAPER: RGB = [246, 241, 227];
const INK: RGB = [25, 25, 25];
const RED: RGB = [158, 27, 30];
const NAVY: RGB = [28, 58, 94];
const TEAL_DARK: RGB = [13, 53, 71];
const TEAL_MID: RGB = [23, 112, 138];
const TEAL_LIGHT: RGB = [191, 227, 236];
const CREAM: RGB = [250, 244, 214];
const GOLD: RGB = [201, 151, 0];
const GOLD_LIGHT: RGB = [243, 226, 160];
const GRAY: RGB = [90, 90, 90];
const GREEN: RGB = [34, 139, 64];
const WHITE: RGB = [255, 255, 255];
const SKY: RGB = [168, 210, 226];

const px = Buffer.alloc(W * H * 3);
for (let i = 0; i < W * H; i++) {
  px[i * 3] = PAPER[0];
  px[i * 3 + 1] = PAPER[1];
  px[i * 3 + 2] = PAPER[2];
}

function set(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}

function fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(W, x + w);
  const y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) set(xx, yy, c);
  }
}

function hline(x: number, y: number, w: number, c: RGB): void {
  fillRect(x, y, w, 1, c);
}

function vline(x: number, y: number, h: number, c: RGB): void {
  fillRect(x, y, 1, h, c);
}

function rectBorder(x: number, y: number, w: number, h: number, c: RGB, t = 2): void {
  fillRect(x, y, w, t, c);
  fillRect(x, y + h - t, w, t, c);
  fillRect(x, y, t, h, c);
  fillRect(x + w - t, y, t, h, c);
}

function fillCircle(cx: number, cy: number, r: number, c: RGB): void {
  for (let dy = -r; dy <= r; dy++) {
    const dx = Math.floor(Math.sqrt(r * r - dy * dy));
    fillRect(cx - dx, cy + dy, dx * 2 + 1, 1, c);
  }
}

function ring(cx: number, cy: number, r: number, t: number, c: RGB): void {
  for (let a = 0; a < 360; a += 1) {
    const rad = (a * Math.PI) / 180;
    for (let k = 0; k < t; k++) {
      set(Math.round(cx + (r + k) * Math.cos(rad)), Math.round(cy + (r + k) * Math.sin(rad)), c);
    }
  }
}

// ---------------------------------------------------------------- text
function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}

function drawChar(ch: string, x: number, y: number, scale: number, c: RGB): void {
  const g = FONT[ch] ?? FONT['?'];
  for (let row = 0; row < 7; row++) {
    const bits = g[row];
    for (let col = 0; col < 5; col++) {
      if (bits & (1 << (4 - col))) {
        fillRect(x + col * scale, y + row * scale, scale, scale, c);
      }
    }
  }
}

function drawText(s: string, x: number, y: number, scale: number, c: RGB, bold = false): void {
  let cx = x;
  const off = bold ? (scale >= 4 ? 2 : 1) : 0;
  for (const ch of s) {
    drawChar(ch, cx, y, scale, c);
    if (bold) drawChar(ch, cx + off, y, scale, c);
    cx += 6 * scale;
  }
}

function centerText(s: string, cx: number, y: number, scale: number, c: RGB, bold = false): void {
  drawText(s, cx - Math.floor(textWidth(s, scale) / 2), y, scale, c, bold);
}

function wrapText(s: string, maxW: number, scale: number): string[] {
  const words = s.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur === '' ? w : cur + ' ' + w;
    if (textWidth(test, scale) <= maxW || cur === '') {
      cur = test;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur !== '') lines.push(cur);
  return lines;
}

function drawBlock(s: string, x: number, y: number, w: number, scale: number, lh: number, c: RGB, bold = false): number {
  const lines = wrapText(s, w, scale);
  for (let i = 0; i < lines.length; i++) {
    drawText(lines[i], x, y + i * lh, scale, c, bold);
  }
  return y + lines.length * lh;
}

// ---------------------------------------------------------------- PNG writer
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}

function encodePNG(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    px.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- layout
function panel(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, WHITE);
  rectBorder(x, y, w, h, INK, 2);
}

function kicker(s: string, x: number, y: number): void {
  drawText(s, x, y, 2, RED, true);
}

function headlineBlock(s: string, x: number, y: number, w: number, scale: number, lh: number): number {
  return drawBlock(s, x, y, w, scale, lh, INK, true);
}

function bodyBlock(s: string, x: number, y: number, w: number): number {
  return drawBlock(s, x, y, w, 2, 16, INK, false);
}

// Cyclone spiral: expanding arms plotted as fat dots, plus an eye.
function drawCyclone(cx: number, cy: number, rMax: number): void {
  const arms = [
    { phase: 0.0, col: WHITE, dot: 7 },
    { phase: 2.1, col: TEAL_LIGHT, dot: 6 },
    { phase: 4.2, col: SKY, dot: 5 },
  ];
  for (const arm of arms) {
    const turns = 2.6;
    const steps = 520;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * turns * Math.PI * 2;
      const r = 14 + (rMax - 14) * (i / steps);
      const a = t + arm.phase;
      const x = Math.round(cx + r * Math.cos(a));
      const y = Math.round(cy + r * Math.sin(a) * 0.9);
      fillCircle(x, y, arm.dot, arm.col);
    }
  }
  // Rain bands: broken outer arcs.
  for (const [r, a0, a1] of [
    [rMax + 26, 0.4, 1.9],
    [rMax + 44, 2.4, 4.0],
    [rMax + 62, 4.6, 5.9],
  ] as const) {
    for (let a = a0; a <= a1; a += 0.03) {
      fillCircle(Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a) * 0.9), 4, TEAL_LIGHT);
    }
  }
  // Eye.
  fillCircle(cx, cy, 17, CREAM);
  ring(cx, cy, 17, 2, INK);
  fillCircle(cx, cy, 9, TEAL_DARK);
}

// ---------------------------------------------------------------- masthead
fillRect(24, 10, 976, 4, RED);
centerText('FRIDAY, 20 NOVEMBER 2026', 512, 24, 2, INK, true);
centerText('WORLD NEWS', 512, 44, 9, INK, true);
centerText("THE DAY'S TOP STORIES FROM AROUND THE GLOBE", 512, 108, 2, GRAY, false);
fillRect(24, 126, 976, 2, INK);
fillRect(24, 130, 976, 1, INK);

// ---------------------------------------------------------------- hero: Cyclone Akvan
const HERO_Y = 140;
const HERO_H = 336;
panel(24, HERO_Y, 976, HERO_H);
// Left art: storm over the Bay of Bengal.
fillRect(26, HERO_Y + 2, 372, HERO_H - 4, TEAL_DARK);
// Cloud puffs at the top of the art.
fillCircle(90, 176, 26, SKY);
fillCircle(130, 168, 32, TEAL_LIGHT);
fillCircle(330, 172, 24, SKY);
fillCircle(360, 184, 18, TEAL_LIGHT);
drawCyclone(212, 312, 118);
// Rain streaks lower corners.
for (let i = 0; i < 9; i++) {
  const x = 44 + i * 14;
  fillRect(x, 420 + (i % 3) * 6, 3, 22, TEAL_LIGHT);
  const x2 = 330 + i * 7;
  fillRect(x2, 428 + (i % 2) * 8, 3, 18, TEAL_LIGHT);
}
// Solid strip at the bottom of the art so the caption never fights the bands.
fillRect(26, 438, 372, 36, TEAL_DARK);
centerText('CYCLONE AKVAN', 212, 444, 2, WHITE, true);
centerText('BAY OF BENGAL', 212, 460, 2, TEAL_LIGHT, false);

// Right text.
const HX = 416;
const HW = 1000 - HX - 16;
kicker('INDIA - LANDFALL TODAY', HX, HERO_Y + 14);
let y = headlineBlock("CYCLONE AKVAN SLAMS INDIA'S EAST COAST", HX, HERO_Y + 38, HW, 5, 40);
y = drawBlock(
  'Landfall under way near Gopalpur. Winds 70-80 kmph, gusts to 90. Red alerts in Srikakulam and Vizianagaram.',
  HX, y + 8, HW, 3, 24, INK, false,
);
// Fact chips, 2 x 2.
const chips = ['300,000+ EVACUATED', '423 RESCUE TEAMS', '69 TRAINS CANCELLED', 'GUSTS TO 90 KMPH'];
for (let i = 0; i < 4; i++) {
  const cx = HX + (i % 2) * (283 + 16);
  const cy = HERO_Y + 232 + Math.floor(i / 2) * 44;
  fillRect(cx, cy, 283, 36, GOLD_LIGHT);
  rectBorder(cx, cy, 283, 36, INK, 1);
  centerText(chips[i], cx + 141, cy + 11, 2, INK, true);
}
drawText('THIRD CYCLONE IN THE REGION IN UNDER A MONTH', HX, HERO_Y + 318, 2, RED, true);

// ---------------------------------------------------------------- row 1: Europe
// Panel A — EU summons Russian envoy.
panel(24, 488, 478, 188);
kicker('EUROPE - KYIV, 19 NOV', 40, 502);
headlineBlock('EU SUMMONS RUSSIAN ENVOY AFTER EMBASSIES HIT', 40, 524, 446, 3, 24);
bodyBlock(
  "Several embassies were damaged in Russian strikes on Kyiv, EU chief Kaja Kallas said. The Netherlands also summoned Russia's ambassador.",
  40, 578, 446,
);
// Panel B — Berlin summit.
panel(522, 488, 478, 188);
kicker('GERMANY - BERLIN, 19 NOV', 538, 502);
headlineBlock('EUROPE DEMANDS A SEAT AT UKRAINE PEACE TALKS', 538, 524, 446, 3, 24);
bodyBlock(
  '25+ leaders from about 37 countries, plus US envoys Witkoff and Kushner, backed a four-party format. No date or venue agreed. The EU proposed a 45 billion euro loan.',
  538, 578, 446,
);

// ---------------------------------------------------------------- row 2: Shenzhen + markets
// Panel C — Shenzhen aftermath.
panel(24, 688, 478, 188);
kicker('CHINA - SHENZHEN, 19 NOV', 40, 702);
headlineBlock('AFTER SHENZHEN: NO BREAKTHROUGH, BUT A DEAL', 40, 724, 446, 3, 24);
bodyBlock(
  'Trump, Xi and Putin met about 90 minutes. Joint peace declaration and extended US-China trade truce. Putin invited European diplomats to Moscow.',
  40, 800, 446,
);
// Panel D — Anthropic debut, with a small chart.
panel(522, 688, 478, 188);
kicker('MARKETS - NEW YORK', 538, 702);
headlineBlock('ANTHROPIC SHARES JUMP 17% IN NASDAQ DEBUT', 538, 724, 446, 3, 24);
bodyBlock('The AI firm closed at about $97 on its first day of trading.', 538, 776, 446);
// Bars: three flat sessions, then the debut jump.
const bars: Array<[number, number, RGB]> = [
  [560, 14, NAVY],
  [640, 20, NAVY],
  [720, 28, NAVY],
  [800, 52, GREEN],
];
for (const [bx, bh, bc] of bars) fillRect(bx, 862 - bh, 56, bh, bc);
hline(540, 862, 444, INK);
drawText('+17%', 880, 812, 4, GREEN, true);
drawText('$97 CLOSE', 880, 844, 2, INK, true);

// ---------------------------------------------------------------- bottom strip: also today
drawText('ALSO TODAY', 24, 894, 2, RED, true);
fillRect(24, 912, 976, 2, INK);
const small: Array<[string, string]> = [
  ['UKRAINE FIRED ABOUT 1,200 DRONES AT RUSSIA', '117 drones back; 2 killed.'],
  ['HOUTHIS CLAIM STRIKES ON 4 SAUDI TARGETS', 'Investors warned to leave.'],
  ['ICJ MYANMAR RULING FINAL: 9-6, NO APPEAL', 'World reaction continues.'],
  ['GTA VI ROLLOUT CONTINUES AFTER 19 NOV LAUNCH', 'Global release under way.'],
  ['VOYAGER 1 REACHES ONE LIGHT-DAY FROM EARTH', 'NASA confirmation due.'],
  ['FED MINUTES: FURTHER RATE HIKES MAY BE NEEDED', 'Oct 27-28 minutes.'],
];
for (let i = 0; i < 6; i++) {
  const sx = 24 + (i % 3) * 328;
  const sy = 920 + Math.floor(i / 3) * 46;
  const headLines = wrapText(small[i][0], 312, 2);
  for (let j = 0; j < headLines.length; j++) {
    drawText(headLines[j], sx, sy + j * 15, 2, INK, true);
  }
  drawText(small[i][1], sx, sy + headLines.length * 15, 2, GRAY, false);
}
vline(340, 920, 92, GRAY);
vline(668, 920, 92, GRAY);
fillRect(24, 1016, 976, 3, RED);

// ---------------------------------------------------------------- write output
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), encodePNG());
