// RFC 1321 MD5 implementation in AssemblyScript
// Exposes both streaming and one-shot hashing utilities.

const BLOCK_SIZE: i32 = 64;

// State (A, B, C, D)
let A: u32 = 0;
let B: u32 = 0;
let C: u32 = 0;
let D: u32 = 0;

// Internal buffer for partial blocks
const buf: StaticArray<u8> = new StaticArray<u8>(BLOCK_SIZE);
let bufLen: i32 = 0;
let bytesHashed: u64 = 0; // total bytes fed to update
let finalized: bool = false;

// Precomputed K constants: floor(2^32 * abs(sin(i+1)))
const K: StaticArray<u32> = [
  0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
  0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
  0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
  0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
  0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
  0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
  0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
  0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
];

// Per-round shift amounts
const S1: StaticArray<i32> = [7, 12, 17, 22];
const S2: StaticArray<i32> = [5, 9, 14, 20];
const S3: StaticArray<i32> = [4, 11, 16, 23];
const S4: StaticArray<i32> = [6, 10, 15, 21];

function F(x: u32, y: u32, z: u32): u32 {
  return (x & y) | (~x & z);
}
function G(x: u32, y: u32, z: u32): u32 {
  return (x & z) | (y & ~z);
}
function Hf(x: u32, y: u32, z: u32): u32 {
  return x ^ y ^ z;
}
function I(x: u32, y: u32, z: u32): u32 {
  return y ^ (x | ~z);
}
function rotl32(x: u32, s: i32): u32 {
  return (x << s) | (x >>> (32 - s));
}

// Read 16 words (little endian) and transform state
function transform(blockPtr: usize): void {
  let a: u32 = A;
  let b: u32 = B;
  let c: u32 = C;
  let d: u32 = D;

  // Load block words (little endian)
  const X0: u32 = load<u32>(blockPtr, 0);
  const X1: u32 = load<u32>(blockPtr + 4, 0);
  const X2: u32 = load<u32>(blockPtr + 8, 0);
  const X3: u32 = load<u32>(blockPtr + 12, 0);
  const X4: u32 = load<u32>(blockPtr + 16, 0);
  const X5: u32 = load<u32>(blockPtr + 20, 0);
  const X6: u32 = load<u32>(blockPtr + 24, 0);
  const X7: u32 = load<u32>(blockPtr + 28, 0);
  const X8: u32 = load<u32>(blockPtr + 32, 0);
  const X9: u32 = load<u32>(blockPtr + 36, 0);
  const X10: u32 = load<u32>(blockPtr + 40, 0);
  const X11: u32 = load<u32>(blockPtr + 44, 0);
  const X12: u32 = load<u32>(blockPtr + 48, 0);
  const X13: u32 = load<u32>(blockPtr + 52, 0);
  const X14: u32 = load<u32>(blockPtr + 56, 0);
  const X15: u32 = load<u32>(blockPtr + 60, 0);

  // Round 1
  a = b + rotl32(a + F(b, c, d) + X0 + K[0], S1[0]);
  d = a + rotl32(d + F(a, b, c) + X1 + K[1], S1[1]);
  c = d + rotl32(c + F(d, a, b) + X2 + K[2], S1[2]);
  b = c + rotl32(b + F(c, d, a) + X3 + K[3], S1[3]);

  a = b + rotl32(a + F(b, c, d) + X4 + K[4], S1[0]);
  d = a + rotl32(d + F(a, b, c) + X5 + K[5], S1[1]);
  c = d + rotl32(c + F(d, a, b) + X6 + K[6], S1[2]);
  b = c + rotl32(b + F(c, d, a) + X7 + K[7], S1[3]);

  a = b + rotl32(a + F(b, c, d) + X8 + K[8], S1[0]);
  d = a + rotl32(d + F(a, b, c) + X9 + K[9], S1[1]);
  c = d + rotl32(c + F(d, a, b) + X10 + K[10], S1[2]);
  b = c + rotl32(b + F(c, d, a) + X11 + K[11], S1[3]);

  a = b + rotl32(a + F(b, c, d) + X12 + K[12], S1[0]);
  d = a + rotl32(d + F(a, b, c) + X13 + K[13], S1[1]);
  c = d + rotl32(c + F(d, a, b) + X14 + K[14], S1[2]);
  b = c + rotl32(b + F(c, d, a) + X15 + K[15], S1[3]);

  // Round 2
  a = b + rotl32(a + G(b, c, d) + X1 + K[16], S2[0]);
  d = a + rotl32(d + G(a, b, c) + X6 + K[17], S2[1]);
  c = d + rotl32(c + G(d, a, b) + X11 + K[18], S2[2]);
  b = c + rotl32(b + G(c, d, a) + X0 + K[19], S2[3]);

  a = b + rotl32(a + G(b, c, d) + X5 + K[20], S2[0]);
  d = a + rotl32(d + G(a, b, c) + X10 + K[21], S2[1]);
  c = d + rotl32(c + G(d, a, b) + X15 + K[22], S2[2]);
  b = c + rotl32(b + G(c, d, a) + X4 + K[23], S2[3]);

  a = b + rotl32(a + G(b, c, d) + X9 + K[24], S2[0]);
  d = a + rotl32(d + G(a, b, c) + X14 + K[25], S2[1]);
  c = d + rotl32(c + G(d, a, b) + X3 + K[26], S2[2]);
  b = c + rotl32(b + G(c, d, a) + X8 + K[27], S2[3]);

  a = b + rotl32(a + G(b, c, d) + X13 + K[28], S2[0]);
  d = a + rotl32(d + G(a, b, c) + X2 + K[29], S2[1]);
  c = d + rotl32(c + G(d, a, b) + X7 + K[30], S2[2]);
  b = c + rotl32(b + G(c, d, a) + X12 + K[31], S2[3]);

  // Round 3
  a = b + rotl32(a + Hf(b, c, d) + X5 + K[32], S3[0]);
  d = a + rotl32(d + Hf(a, b, c) + X8 + K[33], S3[1]);
  c = d + rotl32(c + Hf(d, a, b) + X11 + K[34], S3[2]);
  b = c + rotl32(b + Hf(c, d, a) + X14 + K[35], S3[3]);

  a = b + rotl32(a + Hf(b, c, d) + X1 + K[36], S3[0]);
  d = a + rotl32(d + Hf(a, b, c) + X4 + K[37], S3[1]);
  c = d + rotl32(c + Hf(d, a, b) + X7 + K[38], S3[2]);
  b = c + rotl32(b + Hf(c, d, a) + X10 + K[39], S3[3]);

  a = b + rotl32(a + Hf(b, c, d) + X13 + K[40], S3[0]);
  d = a + rotl32(d + Hf(a, b, c) + X0 + K[41], S3[1]);
  c = d + rotl32(c + Hf(d, a, b) + X3 + K[42], S3[2]);
  b = c + rotl32(b + Hf(c, d, a) + X6 + K[43], S3[3]);

  a = b + rotl32(a + Hf(b, c, d) + X9 + K[44], S3[0]);
  d = a + rotl32(d + Hf(a, b, c) + X12 + K[45], S3[1]);
  c = d + rotl32(c + Hf(d, a, b) + X15 + K[46], S3[2]);
  b = c + rotl32(b + Hf(c, d, a) + X2 + K[47], S3[3]);

  // Round 4
  a = b + rotl32(a + I(b, c, d) + X0 + K[48], S4[0]);
  d = a + rotl32(d + I(a, b, c) + X7 + K[49], S4[1]);
  c = d + rotl32(c + I(d, a, b) + X14 + K[50], S4[2]);
  b = c + rotl32(b + I(c, d, a) + X5 + K[51], S4[3]);

  a = b + rotl32(a + I(b, c, d) + X12 + K[52], S4[0]);
  d = a + rotl32(d + I(a, b, c) + X3 + K[53], S4[1]);
  c = d + rotl32(c + I(d, a, b) + X10 + K[54], S4[2]);
  b = c + rotl32(b + I(c, d, a) + X1 + K[55], S4[3]);

  a = b + rotl32(a + I(b, c, d) + X8 + K[56], S4[0]);
  d = a + rotl32(d + I(a, b, c) + X15 + K[57], S4[1]);
  c = d + rotl32(c + I(d, a, b) + X6 + K[58], S4[2]);
  b = c + rotl32(b + I(c, d, a) + X13 + K[59], S4[3]);

  a = b + rotl32(a + I(b, c, d) + X4 + K[60], S4[0]);
  d = a + rotl32(d + I(a, b, c) + X11 + K[61], S4[1]);
  c = d + rotl32(c + I(d, a, b) + X2 + K[62], S4[2]);
  b = c + rotl32(b + I(c, d, a) + X9 + K[63], S4[3]);

  A = A + a;
  B = B + b;
  C = C + c;
  D = D + d;
}

export function md5Reset(): void {
  A = 0x67452301;
  B = 0xefcdab89;
  C = 0x98badcfe;
  D = 0x10325476;
  bufLen = 0;
  bytesHashed = 0;
  finalized = false;
}

export function md5Update(ptr: usize, len: i32): void {
  if (finalized) return; // ignore updates after finalization
  if (len <= 0) return;

  let remaining: i32 = len;
  bytesHashed += <u64>remaining;

  let p: usize = ptr;
  // If buffer has data, fill it to a block first
  if (bufLen > 0) {
    const need: i32 = BLOCK_SIZE - bufLen;
    if (remaining < need) {
      // just append
      const bp1: usize = changetype<usize>(buf);
      for (let i: i32 = 0; i < remaining; i++) {
        store<u8>(bp1 + <usize>(bufLen + i), load<u8>(p + <usize>i));
      }
      bufLen += remaining;
      return;
    } else {
      // fill buffer to full block
      const bp2: usize = changetype<usize>(buf);
      for (let i: i32 = 0; i < need; i++) {
        store<u8>(bp2 + <usize>(bufLen + i), load<u8>(p + <usize>i));
      }
      transform(bp2);
      p += <usize>need;
      remaining -= need;
      bufLen = 0;
    }
  }

  // Process as many full blocks directly from input as possible
  const fullBlocks: i32 = remaining & -BLOCK_SIZE; // largest multiple of 64 <= remaining
  if (fullBlocks > 0) {
    let off: i32 = 0;
    while (off < fullBlocks) {
      transform(p + <usize>off);
      off += BLOCK_SIZE;
    }
    p += <usize>fullBlocks;
    remaining -= fullBlocks;
  }

  // Buffer the remaining tail
  if (remaining > 0) {
    const bp: usize = changetype<usize>(buf);
    for (let i: i32 = 0; i < remaining; i++) {
      store<u8>(bp + <usize>i, load<u8>(p + <usize>i));
    }
    bufLen = remaining;
  }
}

function md5Finalize(): void {
  if (finalized) return;

  const bp: usize = changetype<usize>(buf);

  // Append 0x80
  store<u8>(bp + <usize>bufLen, 0x80);
  bufLen += 1;

  if (bufLen > 56) {
    // zero pad to 64 and process
    for (let i: i32 = bufLen; i < BLOCK_SIZE; i++) store<u8>(bp + <usize>i, 0);
    transform(bp);
    bufLen = 0;
  }

  // Pad zeros until 56 bytes
  for (let i: i32 = bufLen; i < 56; i++) store<u8>(bp + <usize>i, 0);

  // Append message length in bits (little endian 64-bit)
  const bitLen: u64 = bytesHashed << 3;
  store<u64>(bp + 56, bitLen, 0);

  transform(bp);
  bufLen = 0;
  finalized = true;
}

// Write 16-byte digest into memory at outPtr
export function md5DigestBytes(outPtr: usize): i32 {
  md5Finalize();
  // Output is A, B, C, D in little endian
  store<u32>(outPtr, A, 0);
  store<u32>(outPtr + 4, B, 0);
  store<u32>(outPtr + 8, C, 0);
  store<u32>(outPtr + 12, D, 0);
  return 16;
}

const HEX_CHARS: StaticArray<i32> = [
  48,
  49,
  50,
  51,
  52,
  53,
  54,
  55,
  56,
  57, // 0-9
  97,
  98,
  99,
  100,
  101,
  102, // a-f
];

function toHexString16(outPtr: usize): string {
  // Read 16 bytes and convert to 32-char hex string
  const codes: Array<i32> = new Array<i32>(32);
  let idx: i32 = 0;
  for (let i: i32 = 0; i < 16; i++) {
    const b: u32 = load<u8>(outPtr + <usize>i);
    codes[idx++] = HEX_CHARS[(b >>> 4) & 0x0f];
    codes[idx++] = HEX_CHARS[b & 0x0f];
  }
  return String.fromCharCodes(codes);
}

export function md5DigestHex(): string {
  // Allocate a small temp for bytes, then encode hex
  const tmp: usize = memory.data(16);
  md5DigestBytes(tmp);
  return toHexString16(tmp);
}

// Convenience one-shot APIs
export function md5HexFromBytes(ptr: usize, len: i32): string {
  md5Reset();
  md5Update(ptr, len);
  return md5DigestHex();
}

// Encode JS string (UTF-16 in AS) to UTF-8 bytes, hash, and return hex
export function md5HexFromUTF8(text: string): string {
  md5Reset();
  // Encode to UTF-8 (no null terminator in counted length)
  const ab: ArrayBuffer = String.UTF8.encode(text, false);
  const p: usize = changetype<usize>(ab);
  const l: i32 = ab.byteLength as i32;
  md5Update(p, l);
  return md5DigestHex();
}

// Friendly JS-facing API: accept a Uint8Array directly (ESM bindings will marshal automatically)
export function md5Hex(data: Uint8Array): string {
  md5Reset();
  const ptr: usize = changetype<usize>(data.dataStart);
  const len: i32 = data.length as i32;
  md5Update(ptr, len);
  return md5DigestHex();
}

// Initialize default state on module load
md5Reset();
