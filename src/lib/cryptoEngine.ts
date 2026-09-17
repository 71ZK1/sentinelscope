// src/lib/cryptoEngine.ts
// Comprehensive Browser-Native Cryptographic & Encoding Suite

// Pure JS MD5 implementation for hash suite
export function md5(string: string): string {
  function md5_RotateLeft(lValue: number, iShiftBits: number) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  function md5_AddUnsigned(lX: number, lY: number) {
    const lX8 = lX & 0x80000000;
    const lY8 = lY & 0x80000000;
    const lX4 = lX & 0x40000000;
    const lY4 = lY & 0x40000000;
    const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
      return lResult ^ 0x40000000 ^ lX8 ^ lY8;
    }
    return lResult ^ lX8 ^ lY8;
  }
  function md5_F(x: number, y: number, z: number) {
    return (x & y) | (~x & z);
  }
  function md5_G(x: number, y: number, z: number) {
    return (x & z) | (y & ~z);
  }
  function md5_H(x: number, y: number, z: number) {
    return x ^ y ^ z;
  }
  function md5_I(x: number, y: number, z: number) {
    return y ^ (x | ~z);
  }
  function md5_FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_F(b, c, d), x), ac));
    return md5_AddUnsigned(md5_RotateLeft(a, s), b);
  }
  function md5_GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_G(b, c, d), x), ac));
    return md5_AddUnsigned(md5_RotateLeft(a, s), b);
  }
  function md5_HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_H(b, c, d), x), ac));
    return md5_AddUnsigned(md5_RotateLeft(a, s), b);
  }
  function md5_II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_I(b, c, d), x), ac));
    return md5_AddUnsigned(md5_RotateLeft(a, s), b);
  }
  function md5_ConvertToWordArray(string: string) {
    let lWordCount;
    const lMessageLength = string.length;
    const lNumberOfWords_temp1 = lMessageLength + 8;
    const lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    const lWordArray = Array(lNumberOfWords - 1);
    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition);
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }
  function md5_WordToHex(lValue: number) {
    let WordToHexValue = '',
      WordToHexValue_temp = '',
      lByte,
      lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      WordToHexValue_temp = '0' + lByte.toString(16);
      WordToHexValue = WordToHexValue + WordToHexValue_temp.substring(WordToHexValue_temp.length - 2);
    }
    return WordToHexValue;
  }

  let x = md5_ConvertToWordArray(string);
  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;
  const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  const S41 = 6, S42 = 10, S43 = 15, S44 = 21;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    a = md5_FF(a, b, c, d, x[k + 0], S11, 0xd76aa478);
    d = md5_FF(d, a, b, c, x[k + 1], S12, 0xe8c7b756);
    c = md5_FF(c, d, a, b, x[k + 2], S13, 0x242070db);
    b = md5_FF(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
    a = md5_FF(a, b, c, d, x[k + 4], S11, 0xf57c0faf);
    d = md5_FF(d, a, b, c, x[k + 5], S12, 0x4787c62a);
    c = md5_FF(c, d, a, b, x[k + 6], S13, 0xa8304613);
    b = md5_FF(b, c, d, a, x[k + 7], S14, 0xfd469501);
    a = md5_FF(a, b, c, d, x[k + 8], S11, 0x698098d8);
    d = md5_FF(d, a, b, c, x[k + 9], S12, 0x8b44f7af);
    c = md5_FF(c, d, a, b, x[k + 10], S13, 0xffff5bb1);
    b = md5_FF(b, c, d, a, x[k + 11], S14, 0x895cd7be);
    a = md5_FF(a, b, c, d, x[k + 12], S11, 0x6b901122);
    d = md5_FF(d, a, b, c, x[k + 13], S12, 0xfd987193);
    c = md5_FF(c, d, a, b, x[k + 14], S13, 0xa679438e);
    b = md5_FF(b, c, d, a, x[k + 15], S14, 0x49b40821);
    a = md5_GG(a, b, c, d, x[k + 1], S21, 0xf61e2562);
    d = md5_GG(d, a, b, c, x[k + 6], S22, 0xc040b340);
    c = md5_GG(c, d, a, b, x[k + 11], S23, 0x265e5a51);
    b = md5_GG(b, c, d, a, x[k + 0], S24, 0xe9b6c7aa);
    a = md5_GG(a, b, c, d, x[k + 5], S21, 0xd62f105d);
    d = md5_GG(d, a, b, c, x[k + 10], S22, 0x2441453);
    c = md5_GG(c, d, a, b, x[k + 15], S23, 0xd8a1e681);
    b = md5_GG(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
    a = md5_GG(a, b, c, d, x[k + 9], S21, 0x21e1cde6);
    d = md5_GG(d, a, b, c, x[k + 14], S22, 0xc33707d6);
    c = md5_GG(c, d, a, b, x[k + 3], S23, 0xf4d50d87);
    b = md5_GG(b, c, d, a, x[k + 8], S24, 0x455a14ed);
    a = md5_GG(a, b, c, d, x[k + 13], S21, 0xa9e3e905);
    d = md5_GG(d, a, b, c, x[k + 2], S22, 0xfcefa3f8);
    c = md5_GG(c, d, a, b, x[k + 7], S23, 0x676f02d9);
    b = md5_GG(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);
    a = md5_HH(a, b, c, d, x[k + 5], S31, 0xfffa3942);
    d = md5_HH(d, a, b, c, x[k + 8], S32, 0x8771f681);
    c = md5_HH(c, d, a, b, x[k + 11], S33, 0x6d9d6122);
    b = md5_HH(b, c, d, a, x[k + 14], S34, 0xfde5380c);
    a = md5_HH(a, b, c, d, x[k + 1], S31, 0xa4beea44);
    d = md5_HH(d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
    c = md5_HH(c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
    b = md5_HH(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
    a = md5_HH(a, b, c, d, x[k + 13], S31, 0x289b7ec6);
    d = md5_HH(d, a, b, c, x[k + 0], S32, 0xeaa127fa);
    c = md5_HH(c, d, a, b, x[k + 3], S33, 0xd4ef3085);
    b = md5_HH(b, c, d, a, x[k + 6], S34, 0x4881d05);
    a = md5_HH(a, b, c, d, x[k + 9], S31, 0xd9d4d039);
    d = md5_HH(d, a, b, c, x[k + 12], S32, 0xe6db99e5);
    c = md5_HH(c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
    b = md5_HH(b, c, d, a, x[k + 2], S34, 0xc4ac5665);
    a = md5_II(a, b, c, d, x[k + 0], S41, 0xf4292244);
    d = md5_II(d, a, b, c, x[k + 7], S42, 0x432aff97);
    c = md5_II(c, d, a, b, x[k + 14], S43, 0xab9423a7);
    b = md5_II(b, c, d, a, x[k + 5], S44, 0xfc93a039);
    a = md5_II(a, b, c, d, x[k + 12], S41, 0x655b59c3);
    d = md5_II(d, a, b, c, x[k + 3], S42, 0x8f0ccc92);
    c = md5_II(c, d, a, b, x[k + 10], S43, 0xffeff47d);
    b = md5_II(b, c, d, a, x[k + 1], S44, 0x85845dd1);
    a = md5_II(a, b, c, d, x[k + 8], S41, 0x6fa87e4f);
    d = md5_II(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
    c = md5_II(c, d, a, b, x[k + 6], S43, 0xa3014314);
    b = md5_II(b, c, d, a, x[k + 13], S44, 0x4e0811a1);
    a = md5_II(a, b, c, d, x[k + 4], S41, 0xf7537e82);
    d = md5_II(d, a, b, c, x[k + 11], S42, 0xbd3af235);
    c = md5_II(c, d, a, b, x[k + 2], S43, 0x2ad7d2bb);
    b = md5_II(b, c, d, a, x[k + 9], S44, 0xeb86d391);
    a = md5_AddUnsigned(a, AA);
    b = md5_AddUnsigned(b, BB);
    c = md5_AddUnsigned(c, CC);
    d = md5_AddUnsigned(d, DD);
  }
  return (md5_WordToHex(a) + md5_WordToHex(b) + md5_WordToHex(c) + md5_WordToHex(d)).toLowerCase();
}

// Helpers
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): Uint8Array {
  const clean = base64.trim().replace(/[\r\n\s]/g, '');
  const binary_string = atob(clean);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

export function arrayBufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToArrayBuffer(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

export function textToUint8Array(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function uint8ArrayToText(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

// AES-GCM (256-bit / 128-bit) with PBKDF2 Key Derivation
export async function encryptAES_GCM(
  plaintext: string,
  passphrase: string,
  keyLength: 128 | 256 = 256
): Promise<{
  ciphertextBase64: string;
  ciphertextHex: string;
  ivHex: string;
  saltHex: string;
  bundleJson: string;
}> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const passwordKey = await crypto.subtle.importKey(
    'raw',
    textToUint8Array(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: keyLength },
    false,
    ['encrypt']
  );

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    textToUint8Array(plaintext)
  );

  const encryptedBytes = new Uint8Array(encryptedBuffer);

  // Bundle: [SALT (16)][IV (12)][CIPHERTEXT (with 16-byte GCM tag)]
  const bundle = new Uint8Array(salt.length + iv.length + encryptedBytes.length);
  bundle.set(salt, 0);
  bundle.set(iv, salt.length);
  bundle.set(encryptedBytes, salt.length + iv.length);

  const bundleObj = {
    algorithm: `AES-GCM-${keyLength}`,
    salt: arrayBufferToHex(salt),
    iv: arrayBufferToHex(iv),
    ciphertext: arrayBufferToBase64(encryptedBytes),
    bundleBase64: arrayBufferToBase64(bundle),
  };

  return {
    ciphertextBase64: arrayBufferToBase64(bundle),
    ciphertextHex: arrayBufferToHex(bundle),
    ivHex: arrayBufferToHex(iv),
    saltHex: arrayBufferToHex(salt),
    bundleJson: JSON.stringify(bundleObj, null, 2),
  };
}

export async function decryptAES_GCM(
  ciphertextInput: string,
  passphrase: string,
  keyLength: 128 | 256 = 256
): Promise<string> {
  let bundleBytes: Uint8Array;

  const trimmed = ciphertextInput.trim();
  // Check if JSON bundle
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.bundleBase64) {
        bundleBytes = base64ToArrayBuffer(parsed.bundleBase64);
      } else if (parsed.salt && parsed.iv && parsed.ciphertext) {
        const salt = hexToArrayBuffer(parsed.salt);
        const iv = hexToArrayBuffer(parsed.iv);
        const ct = base64ToArrayBuffer(parsed.ciphertext);
        bundleBytes = new Uint8Array(salt.length + iv.length + ct.length);
        bundleBytes.set(salt, 0);
        bundleBytes.set(iv, salt.length);
        bundleBytes.set(ct, salt.length + iv.length);
      } else {
        throw new Error('Invalid JSON format');
      }
    } catch {
      bundleBytes = base64ToArrayBuffer(trimmed);
    }
  } else if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length > 56) {
    bundleBytes = hexToArrayBuffer(trimmed);
  } else {
    bundleBytes = base64ToArrayBuffer(trimmed);
  }

  if (bundleBytes.length < 28) {
    throw new Error('Ciphertext payload is too short or malformed.');
  }

  const salt = bundleBytes.slice(0, 16);
  const iv = bundleBytes.slice(16, 28);
  const ciphertext = bundleBytes.slice(28);

  const passwordKey = await crypto.subtle.importKey(
    'raw',
    textToUint8Array(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: keyLength },
    false,
    ['decrypt']
  );

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    ciphertext
  );

  return uint8ArrayToText(new Uint8Array(decryptedBuffer));
}

// AES-CBC (256-bit)
export async function encryptAES_CBC(
  plaintext: string,
  passphrase: string
): Promise<{ ciphertextBase64: string; ivHex: string; saltHex: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(16));

  const passwordKey = await crypto.subtle.importKey(
    'raw',
    textToUint8Array(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-CBC', length: 256 },
    false,
    ['encrypt']
  );

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    aesKey,
    textToUint8Array(plaintext)
  );

  const encryptedBytes = new Uint8Array(encryptedBuffer);
  const bundle = new Uint8Array(salt.length + iv.length + encryptedBytes.length);
  bundle.set(salt, 0);
  bundle.set(iv, salt.length);
  bundle.set(encryptedBytes, salt.length + iv.length);

  return {
    ciphertextBase64: arrayBufferToBase64(bundle),
    ivHex: arrayBufferToHex(iv),
    saltHex: arrayBufferToHex(salt),
  };
}

export async function decryptAES_CBC(
  ciphertextInput: string,
  passphrase: string
): Promise<string> {
  const bundleBytes = base64ToArrayBuffer(ciphertextInput.trim());
  if (bundleBytes.length < 32) {
    throw new Error('Ciphertext payload is too short for AES-CBC.');
  }

  const salt = bundleBytes.slice(0, 16);
  const iv = bundleBytes.slice(16, 32);
  const ciphertext = bundleBytes.slice(32);

  const passwordKey = await crypto.subtle.importKey(
    'raw',
    textToUint8Array(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-CBC', length: 256 },
    false,
    ['decrypt']
  );

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv },
    aesKey,
    ciphertext
  );

  return uint8ArrayToText(new Uint8Array(decryptedBuffer));
}

// RSA-OAEP Key Pair Generation, Encryption & Decryption
export async function generateRSAKeyPair(
  modulusLength: 2048 | 4096 = 2048
): Promise<{ publicKeyPem: string; privateKeyPem: string }> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const exportedPublic = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const exportedPrivate = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const publicB64 = arrayBufferToBase64(exportedPublic);
  const privateB64 = arrayBufferToBase64(exportedPrivate);

  const formatPem = (b64: string, type: 'PUBLIC' | 'PRIVATE') => {
    const lines = b64.match(/.{1,64}/g) || [];
    return `-----BEGIN ${type} KEY-----\n${lines.join('\n')}\n-----END ${type} KEY-----`;
  };

  return {
    publicKeyPem: formatPem(publicB64, 'PUBLIC'),
    privateKeyPem: formatPem(privateB64, 'PRIVATE'),
  };
}

export async function encryptRSA(
  plaintext: string,
  publicKeyPem: string
): Promise<string> {
  const cleanPem = publicKeyPem
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s+/g, '');

  const keyBytes = base64ToArrayBuffer(cleanPem);
  const publicKey = await crypto.subtle.importKey(
    'spki',
    keyBytes,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt']
  );

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    textToUint8Array(plaintext)
  );

  return arrayBufferToBase64(encryptedBuffer);
}

export async function decryptRSA(
  ciphertextBase64: string,
  privateKeyPem: string
): Promise<string> {
  const cleanPem = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');

  const keyBytes = base64ToArrayBuffer(cleanPem);
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['decrypt']
  );

  const ciphertextBytes = base64ToArrayBuffer(ciphertextBase64.trim());
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    ciphertextBytes
  );

  return uint8ArrayToText(new Uint8Array(decryptedBuffer));
}

// Classical Ciphers
export function xorCipher(text: string, key: string): { hex: string; base64: string } {
  if (!key) return { hex: '', base64: '' };
  const textBytes = textToUint8Array(text);
  const keyBytes = textToUint8Array(key);
  const out = new Uint8Array(textBytes.length);

  for (let i = 0; i < textBytes.length; i++) {
    out[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  return {
    hex: arrayBufferToHex(out),
    base64: arrayBufferToBase64(out),
  };
}

export function xorDecrypt(input: string, key: string, isHex = false): string {
  if (!key) return '';
  const inputBytes = isHex ? hexToArrayBuffer(input) : base64ToArrayBuffer(input);
  const keyBytes = textToUint8Array(key);
  const out = new Uint8Array(inputBytes.length);

  for (let i = 0; i < inputBytes.length; i++) {
    out[i] = inputBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  return uint8ArrayToText(out);
}

export function caesarCipher(text: string, shift: number): string {
  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(((code - 65 + shift) % 26 + 26) % 26 + 65);
      } else if (code >= 97 && code <= 122) {
        return String.fromCharCode(((code - 97 + shift) % 26 + 26) % 26 + 97);
      }
      return char;
    })
    .join('');
}

// Hash Functions
export async function computeHash(
  algorithm: 'SHA-256' | 'SHA-512' | 'SHA-384' | 'SHA-1' | 'MD5',
  text: string
): Promise<string> {
  if (algorithm === 'MD5') {
    return md5(text);
  }
  const buffer = await crypto.subtle.digest(algorithm, textToUint8Array(text));
  return arrayBufferToHex(buffer);
}

export async function computeHMAC(
  algorithm: 'SHA-256' | 'SHA-512',
  text: string,
  secretKey: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    textToUint8Array(secretKey),
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, textToUint8Array(text));
  return arrayBufferToHex(signature);
}

// Encoders & Decoders
export function encodeDecodeUtility(
  text: string,
  format: 'base64' | 'base64url' | 'hex' | 'binary' | 'url' | 'html' | 'reverse',
  mode: 'encode' | 'decode'
): string {
  try {
    if (mode === 'encode') {
      switch (format) {
        case 'base64':
          return btoa(unescape(encodeURIComponent(text)));
        case 'base64url':
          return btoa(unescape(encodeURIComponent(text)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        case 'hex':
          return arrayBufferToHex(textToUint8Array(text));
        case 'binary':
          return Array.from(textToUint8Array(text))
            .map((b) => b.toString(2).padStart(8, '0'))
            .join(' ');
        case 'url':
          return encodeURIComponent(text);
        case 'html':
          return text.replace(/[&<>"']/g, (m) => {
            const map: Record<string, string> = {
              '&': '&amp;',
              '<': '&lt;',
              '>': '&gt;',
              '"': '&quot;',
              "'": '&#039;',
            };
            return map[m] || m;
          });
        case 'reverse':
          return text.split('').reverse().join('');
      }
    } else {
      switch (format) {
        case 'base64':
          return decodeURIComponent(escape(atob(text.trim())));
        case 'base64url': {
          let b64 = text.replace(/-/g, '+').replace(/_/g, '/');
          while (b64.length % 4) b64 += '=';
          return decodeURIComponent(escape(atob(b64)));
        }
        case 'hex':
          return uint8ArrayToText(hexToArrayBuffer(text.trim()));
        case 'binary': {
          const bins = text.trim().split(/\s+/);
          const bytes = new Uint8Array(bins.map((bin) => parseInt(bin, 2)));
          return uint8ArrayToText(bytes);
        }
        case 'url':
          return decodeURIComponent(text);
        case 'html': {
          const doc = new DOMParser().parseFromString(text, 'text/html');
          return doc.documentElement.textContent || '';
        }
        case 'reverse':
          return text.split('').reverse().join('');
      }
    }
  } catch (err: any) {
    return `Error: ${err.message || 'Malformed input'}`;
  }
}

// JWT Token Decoder & Inspect
export function decodeJWT(token: string): {
  header: any;
  payload: any;
  signature: string;
  isExpired: boolean;
  issuedAt?: string;
  expiresAt?: string;
} {
  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format (requires header.payload.signature)');
  }

  const decodeB64Url = (str: string) => {
    let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return JSON.parse(decodeURIComponent(escape(atob(b64))));
  };

  const header = decodeB64Url(parts[0]);
  const payload = decodeB64Url(parts[1]);
  const signature = parts[2];

  let isExpired = false;
  let expiresAt;
  let issuedAt;

  if (payload.exp) {
    const expDate = new Date(payload.exp * 1000);
    isExpired = Date.now() > expDate.getTime();
    expiresAt = expDate.toISOString();
  }
  if (payload.iat) {
    issuedAt = new Date(payload.iat * 1000).toISOString();
  }

  return {
    header,
    payload,
    signature,
    isExpired,
    issuedAt,
    expiresAt,
  };
}
