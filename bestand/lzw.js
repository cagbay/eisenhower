// TIFF LZW Decoder (MSB zuerst, 9 bis 12 Bit, Early Change) für swissALTI3D Kacheln im Browser.
self.wvzLzwDecode = function (src) {
  const prefix = new Int16Array(4096), suffix = new Uint8Array(4096), first = new Uint8Array(4096), len = new Uint16Array(4096);
  for (let i = 0; i < 256; i++) { prefix[i] = -1; suffix[i] = i; first[i] = i; len[i] = 1; }
  let out = new Uint8Array(Math.max(1024, src.length * 4)), o = 0;
  let bitBuf = 0, bitCnt = 0, p = 0, codeLen = 9, next = 258, old = -1;
  const emit = (c) => {
    const l = len[c];
    if (o + l > out.length) { const n = new Uint8Array(Math.max(out.length * 2, o + l)); n.set(out); out = n; }
    let k = o + l - 1;
    while (c >= 0) { out[k--] = suffix[c]; c = prefix[c]; }
    o += l;
  };
  for (;;) {
    while (bitCnt < codeLen) { if (p >= src.length) { bitCnt = -1; break; } bitBuf = ((bitBuf << 8) | src[p++]) >>> 0; bitCnt += 8; }
    if (bitCnt < 0) break;
    const code = (bitBuf >>> (bitCnt - codeLen)) & ((1 << codeLen) - 1); bitCnt -= codeLen; bitBuf &= (1 << bitCnt) - 1;
    if (code === 257) break;
    if (code === 256) { codeLen = 9; next = 258; old = -1; continue; }
    if (old === -1) { emit(code); old = code; continue; }
    if (next < 4096) {
      const f = code < next ? first[code] : first[old];
      prefix[next] = old; suffix[next] = f; first[next] = first[old]; len[next] = len[old] + 1; next++;
    }
    emit(code);
    old = code;
    if (next >= (1 << codeLen) - 1 && codeLen < 12) codeLen++;
  }
  return out.subarray(0, o);
};
