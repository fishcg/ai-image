function readUInt32BE(buf, offset) {
  return (buf[offset] << 24) | (buf[offset + 1] << 16) | (buf[offset + 2] << 8) | buf[offset + 3];
}

function readUInt16LE(buf, offset) {
  return buf[offset] | (buf[offset + 1] << 8);
}

function tryGetImageSize(buffer, mime) {
  try {
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    if (buf.length < 10) return null;

    // PNG
    if (mime === 'image/png' && buf.length >= 24 && buf.toString('ascii', 1, 4) === 'PNG') {
      const width = readUInt32BE(buf, 16);
      const height = readUInt32BE(buf, 20);
      if (width > 0 && height > 0) return { width, height };
      return null;
    }

    // GIF
    if (mime === 'image/gif' && buf.length >= 10 && buf.toString('ascii', 0, 3) === 'GIF') {
      const width = readUInt16LE(buf, 6);
      const height = readUInt16LE(buf, 8);
      if (width > 0 && height > 0) return { width, height };
      return null;
    }

    // JPEG (baseline/progressive)
    if (mime === 'image/jpeg' && buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
      let offset = 2;
      while (offset + 4 < buf.length) {
        if (buf[offset] !== 0xff) {
          offset += 1;
          continue;
        }
        const marker = buf[offset + 1];
        const len = (buf[offset + 2] << 8) | buf[offset + 3];
        if (len < 2) return null;

        const isSOF =
          (marker >= 0xc0 && marker <= 0xc3) ||
          (marker >= 0xc5 && marker <= 0xc7) ||
          (marker >= 0xc9 && marker <= 0xcb) ||
          (marker >= 0xcd && marker <= 0xcf);
        if (isSOF && offset + 8 < buf.length) {
          const height = (buf[offset + 5] << 8) | buf[offset + 6];
          const width = (buf[offset + 7] << 8) | buf[offset + 8];
          if (width > 0 && height > 0) return { width, height };
          return null;
        }
        offset += 2 + len;
      }
      return null;
    }

    // WebP (best-effort: VP8X / VP8 )
    if (
      mime === 'image/webp' &&
      buf.length >= 30 &&
      buf.toString('ascii', 0, 4) === 'RIFF' &&
      buf.toString('ascii', 8, 12) === 'WEBP'
    ) {
      const chunk = buf.toString('ascii', 12, 16);
      if (chunk === 'VP8X' && buf.length >= 30) {
        const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
        const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
        if (width > 0 && height > 0) return { width, height };
        return null;
      }
      if (chunk === 'VP8 ' && buf.length >= 30) {
        const w = buf[26] | (buf[27] << 8);
        const h = buf[28] | (buf[29] << 8);
        const width = w & 0x3fff;
        const height = h & 0x3fff;
        if (width > 0 && height > 0) return { width, height };
        return null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function gcd(a, b) {
  let x = Math.abs(Number(a) || 0);
  let y = Math.abs(Number(b) || 0);
  while (y) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x || 1;
}

function buildAspectRatio(dim) {
  if (!dim?.width || !dim?.height) return null;
  const w = Math.floor(Number(dim.width));
  const h = Math.floor(Number(dim.height));
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  const g = gcd(w, h);
  return `${Math.max(1, Math.floor(w / g))}:${Math.max(1, Math.floor(h / g))}`;
}

module.exports = { tryGetImageSize, buildAspectRatio };
