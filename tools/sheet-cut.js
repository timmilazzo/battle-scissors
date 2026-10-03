// Sheet cutter (dev tool, not deployed; no dependencies). Cuts an art pack's sprite sheets into the single PNGs that
// tools/kit-import.html expects under assets/kit/incoming/<section>/, and writes that folder's manifest.json.
//
//   node tools/sheet-cut.js scan <sheet.png> [--key magenta] [--merge 24] [--min 12] [--alpha 24]
//       Finds the objects on a sheet (connected blobs of visible pixels, merged when their boxes come within --merge px,
//       blobs under --min px dropped; a pixel counts as visible from alpha --alpha, raise it on sheets with a faint haze)
//       and prints them numbered, by row then left to right, with their boxes.
//   node tools/sheet-cut.js cut <cutlist.json>
//       Cuts every sheet in the list and writes the PNGs plus incoming/manifest.json (merged with what's there).
//
// A cut list: { "out": "assets/kit/incoming", "sheets": [ { "file", "section", "key": "alpha" | "magenta",
//   "merge": 24, "min": 12, "items": [ { "name", "parts": [blob indices from scan] | "box": [x, y, w, h],
//   "canvas": [w, h] (centre the crop on a fixed canvas), "fit": n (scale the crop so its longest side is n px,
//   bilinear), "pad": n (transparent margin, default 8), "kind": "sprite" | "strip" | "texture" } ] } ] }
// A sheet with no items and a "name" + "kind": "texture" is copied whole (a ground tile or a map plate).
// Magenta keying: a pixel's alpha comes from its distance to #FF00FF (full within keyIn, none past keyOut), and the
// magenta spill on the edge pixels is pulled toward the object's colour.
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');

// ---------- PNG read / write (8-bit RGB / RGBA / grey / palette, non-interlaced) ----------
const CRC = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
const crc32 = (buf) => { let c = -1; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function readPng(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG: ' + file);
  let p = 8, w = 0, h = 0, depth = 8, ctype = 6, interlace = 0, pal = null, trns = null; const idat = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p), type = b.toString('latin1', p + 4, p + 8), data = b.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ctype = data[9]; interlace = data[12]; }
    else if (type === 'PLTE') pal = data; else if (type === 'tRNS') trns = data; else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  if (depth !== 8 || interlace) throw new Error('unsupported PNG (need 8-bit, non-interlaced): ' + file);
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ctype], raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * ch;
  const px = Buffer.alloc(w * h * ch); let prev = Buffer.alloc(stride);
  for (let y = 0, q = 0; y < h; y++) {
    const f = raw[q++], row = px.subarray(y * stride, (y + 1) * stride);
    raw.copy(row, 0, q, q + stride); q += stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? row[i - ch] : 0, up = prev[i], c = i >= ch ? prev[i - ch] : 0; let v = row[i];
      if (f === 1) v += a; else if (f === 2) v += up; else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) { const pp = a + up - c, pa = Math.abs(pp - a), pb = Math.abs(pp - up), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c; }
      row[i] = v & 255;
    }
    prev = row;
  }
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0, j = 0; i < w * h; i++, j += 4) {
    if (ctype === 6) { out[j] = px[i * 4]; out[j + 1] = px[i * 4 + 1]; out[j + 2] = px[i * 4 + 2]; out[j + 3] = px[i * 4 + 3]; }
    else if (ctype === 2) { out[j] = px[i * 3]; out[j + 1] = px[i * 3 + 1]; out[j + 2] = px[i * 3 + 2]; out[j + 3] = 255; }
    else if (ctype === 0) { out[j] = out[j + 1] = out[j + 2] = px[i]; out[j + 3] = 255; }
    else if (ctype === 4) { out[j] = out[j + 1] = out[j + 2] = px[i * 2]; out[j + 3] = px[i * 2 + 1]; }
    else { const k = px[i]; out[j] = pal[k * 3]; out[j + 1] = pal[k * 3 + 1]; out[j + 2] = pal[k * 3 + 2]; out[j + 3] = trns && k < trns.length ? trns[k] : 255; }
  }
  return { w, h, data: out };
}
function writePng(file, img) {
  const { w, h, data } = img, stride = w * 4, raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (stride + 1)] = 0; data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride); }
  const chunk = (type, d) => { const b = Buffer.alloc(12 + d.length); b.writeUInt32BE(d.length, 0); b.write(type, 4, 'latin1'); d.copy(b, 8); b.writeUInt32BE(crc32(b.subarray(4, 8 + d.length)), 8 + d.length); return b; };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]));
}

// ---------- keying ----------
const KEY_IN = 40, KEY_OUT = 150;   // distance to #FF00FF (0..441): fully transparent within KEY_IN, fully opaque past KEY_OUT
function keyMagenta(img) {
  const d = img.data;
  for (let j = 0; j < d.length; j += 4) {
    const r = d[j], g = d[j + 1], b = d[j + 2], dist = Math.hypot(255 - r, g, 255 - b);
    const a = dist <= KEY_IN ? 0 : dist >= KEY_OUT ? 1 : (dist - KEY_IN) / (KEY_OUT - KEY_IN);
    if (a < 1 && a > 0) {   // de-spill: an edge pixel is a mix of the object and magenta; take the magenta share out
      d[j] = Math.max(0, Math.min(255, (r - 255 * (1 - a)) / a)); d[j + 1] = Math.max(0, Math.min(255, g / a)); d[j + 2] = Math.max(0, Math.min(255, (b - 255 * (1 - a)) / a));
    }
    d[j + 3] = Math.round(a * 255);
  }
}

// ---------- blobs ----------
function findBlobs(img, { merge = 24, min = 12, alphaAt = 24 } = {}) {
  const { w, h, data } = img, seen = new Uint8Array(w * h), blobs = [], stack = new Int32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (seen[i] || data[i * 4 + 3] < alphaAt) continue;
    let n = 0, top = 0, x0 = w, y0 = h, x1 = 0, y1 = 0; stack[top++] = i; seen[i] = 1;
    while (top) {
      const k = stack[--top], x = k % w, y = (k - x) / w; n++;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      const nb = [k - 1, k + 1, k - w, k + w];
      if (x === 0) nb[0] = -1; if (x === w - 1) nb[1] = -1;
      for (const m of nb) if (m >= 0 && m < w * h && !seen[m] && data[m * 4 + 3] >= alphaAt) { seen[m] = 1; stack[top++] = m; }
    }
    if (n >= min) blobs.push({ x0, y0, x1, y1, n });
  }
  // merge boxes that come within `merge` px of each other, until nothing merges
  for (let changed = true; changed;) {
    changed = false;
    for (let a = 0; a < blobs.length && !changed; a++) for (let b = a + 1; b < blobs.length; b++) {
      const A = blobs[a], B = blobs[b];
      if (A.x0 - merge <= B.x1 && B.x0 - merge <= A.x1 && A.y0 - merge <= B.y1 && B.y0 - merge <= A.y1) {
        A.x0 = Math.min(A.x0, B.x0); A.y0 = Math.min(A.y0, B.y0); A.x1 = Math.max(A.x1, B.x1); A.y1 = Math.max(A.y1, B.y1); A.n += B.n;
        blobs.splice(b, 1); changed = true; break;
      }
    }
  }
  // rows: sort by centre y, start a new row when the next blob's centre is below every blob of the row's bottom band
  blobs.sort((a, b) => (a.y0 + a.y1) - (b.y0 + b.y1));
  const rows = [];
  for (const b of blobs) {
    const cy = (b.y0 + b.y1) / 2, row = rows[rows.length - 1];
    if (row && cy < row.y1) { row.items.push(b); row.y1 = Math.max(row.y1, b.y1); } else rows.push({ y1: b.y1, items: [b] });
  }
  const out = [];
  for (const r of rows) { r.items.sort((a, b) => a.x0 - b.x0); out.push(...r.items); }
  return out.map((b, i) => ({ i, x: b.x0, y: b.y0, w: b.x1 - b.x0 + 1, h: b.y1 - b.y0 + 1, px: b.n }));
}

// ---------- crops ----------
function crop(img, x, y, w, h) {
  const out = Buffer.alloc(w * h * 4);
  for (let r = 0; r < h; r++) {
    const sy = y + r; if (sy < 0 || sy >= img.h) continue;
    const sx0 = Math.max(0, x), sx1 = Math.min(img.w, x + w);
    if (sx1 > sx0) img.data.copy(out, (r * w + (sx0 - x)) * 4, (sy * img.w + sx0) * 4, (sy * img.w + sx1) * 4);
  }
  return { w, h, data: out };
}
function resize(img, nw, nh) {   // bilinear, premultiplied so transparent neighbours don't darken edges
  const out = Buffer.alloc(nw * nh * 4), { w, h, data } = img;
  for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) {
    const fx = Math.min(w - 1, (x + 0.5) * w / nw - 0.5), fy = Math.min(h - 1, (y + 0.5) * h / nh - 0.5);
    const x0 = Math.max(0, Math.floor(fx)), y0 = Math.max(0, Math.floor(fy)), x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1), tx = fx - x0, ty = fy - y0;
    let r = 0, g = 0, b = 0, a = 0;
    for (const [sx, sy, wt] of [[x0, y0, (1 - tx) * (1 - ty)], [x1, y0, tx * (1 - ty)], [x0, y1, (1 - tx) * ty], [x1, y1, tx * ty]]) {
      const j = (sy * w + sx) * 4, pa = data[j + 3] / 255 * wt; r += data[j] * pa; g += data[j + 1] * pa; b += data[j + 2] * pa; a += pa;
    }
    const o = (y * nw + x) * 4;
    if (a > 0) { out[o] = r / a; out[o + 1] = g / a; out[o + 2] = b / a; } out[o + 3] = Math.round(a * 255);
  }
  return { w: nw, h: nh, data: out };
}
function place(img, cw, ch) {   // centre on a fixed transparent canvas (clipped if bigger)
  const out = Buffer.alloc(cw * ch * 4), ox = Math.round((cw - img.w) / 2), oy = Math.round((ch - img.h) / 2);
  for (let y = 0; y < img.h; y++) {
    const ty = y + oy; if (ty < 0 || ty >= ch) continue;
    for (let x = 0; x < img.w; x++) { const tx = x + ox; if (tx < 0 || tx >= cw) continue; img.data.copy(out, (ty * cw + tx) * 4, (y * img.w + x) * 4, (y * img.w + x) * 4 + 4); }
  }
  return { w: cw, h: ch, data: out };
}
function bounds(img, alphaAt = 8) {
  let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.data[(y * img.w + x) * 4 + 3] >= alphaAt) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

// ---------- commands ----------
function loadSheet(file, key) { const img = readPng(file); if (key === 'magenta') keyMagenta(img); return img; }
function scan(file, opts) {
  const img = loadSheet(file, opts.key), blobs = findBlobs(img, opts);
  console.log(file + ': ' + img.w + 'x' + img.h + ', ' + blobs.length + ' objects (merge ' + (opts.merge || 24) + ', min ' + (opts.min || 12) + ')');
  for (const b of blobs) console.log('  #' + String(b.i).padStart(2) + '  x ' + String(b.x).padStart(5) + '  y ' + String(b.y).padStart(5) + '  w ' + String(b.w).padStart(4) + '  h ' + String(b.h).padStart(4) + '  px ' + b.px);
}
function cut(listFile) {
  const list = JSON.parse(fs.readFileSync(listFile, 'utf8')), base = path.dirname(listFile), outDir = list.out || 'assets/kit/incoming';
  const manifestFile = path.join(outDir, 'manifest.json');
  const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : { assets: [] };
  const add = (entry) => { const k = manifest.assets.findIndex(a => a.name === entry.name && a.section === entry.section); if (k >= 0) manifest.assets[k] = entry; else manifest.assets.push(entry); };
  for (const sh of list.sheets) {
    const file = path.isAbsolute(sh.file) ? sh.file : path.join(base, sh.file), img = loadSheet(file, sh.key);
    if (!sh.items) {   // whole file: a texture or a map
      const dest = path.join(outDir, sh.section, sh.name + '.png');
      let out = img; if (sh.size) out = resize(img, sh.size[0], sh.size[1]);
      writePng(dest, out); add({ name: sh.name, file: outDir + '/' + sh.section + '/' + sh.name + '.png', width: out.w, height: out.h, kind: sh.kind || 'texture', section: sh.section });
      console.log(dest + '  ' + out.w + 'x' + out.h); continue;
    }
    const blobs = findBlobs(img, sh);
    for (const it of sh.items) {
      let box;
      if (it.box) box = { x: it.box[0], y: it.box[1], w: it.box[2], h: it.box[3] };
      else {
        const parts = it.parts.map(i => { const b = blobs[i]; if (!b) throw new Error(sh.file + ': no blob #' + i + ' for ' + it.name); return b; });
        const x0 = Math.min(...parts.map(b => b.x)), y0 = Math.min(...parts.map(b => b.y)), x1 = Math.max(...parts.map(b => b.x + b.w)), y1 = Math.max(...parts.map(b => b.y + b.h));
        box = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
      }
      const pad = it.pad == null ? 8 : it.pad;
      let out = crop(img, box.x - pad, box.y - pad, box.w + 2 * pad, box.h + 2 * pad);
      if (it.alphaAt) for (let j = 3; j < out.data.length; j += 4) if (out.data[j] < it.alphaAt) out.data[j] = 0;   // drop faint fringe pixels
      if (it.fit) { const s = it.fit / Math.max(out.w, out.h); out = resize(out, Math.max(1, Math.round(out.w * s)), Math.max(1, Math.round(out.h * s))); }
      if (it.scale) out = resize(out, Math.max(1, Math.round(out.w * it.scale)), Math.max(1, Math.round(out.h * it.scale)));
      if (it.canvas) out = place(out, it.canvas[0], it.canvas[1]);
      const dest = path.join(outDir, sh.section, it.name + '.png');
      writePng(dest, out);
      add({ name: it.name, file: outDir + '/' + sh.section + '/' + it.name + '.png', width: out.w, height: out.h, kind: it.kind || 'sprite', section: sh.section });
      const vis = bounds(out); console.log(dest + '  ' + out.w + 'x' + out.h + (vis ? '  visible ' + vis.w + 'x' + vis.h : '  EMPTY'));
    }
  }
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
  console.log('manifest: ' + manifest.assets.length + ' assets -> ' + manifestFile);
}

const [cmd, arg, ...rest] = process.argv.slice(2);
const opt = (k, d) => { const i = rest.indexOf('--' + k); return i >= 0 ? (isNaN(+rest[i + 1]) ? rest[i + 1] : +rest[i + 1]) : d; };
if (cmd === 'scan') scan(arg, { key: opt('key', 'alpha'), merge: opt('merge', 24), min: opt('min', 12), alphaAt: opt('alpha', 24) });
else if (cmd === 'cut') cut(arg);
else console.log('usage: node tools/sheet-cut.js scan <sheet.png> [--key magenta] [--merge 24] [--min 12]\n       node tools/sheet-cut.js cut <cutlist.json>');
