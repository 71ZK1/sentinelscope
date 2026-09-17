// src/lib/stegoEngine.ts
// Comprehensive Image Forensic Metadata, EXIF Inspector & LSB Steganography Engine

import {
  encryptAES_GCM,
  decryptAES_GCM,
  arrayBufferToHex,
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from './cryptoEngine';

export interface ExifTag {
  id: string;
  name: string;
  value: string | number;
  category: 'Camera' | 'Image' | 'GPS' | 'Timestamps' | 'Software' | 'Chunks';
}

export interface ImageMetadataReport {
  fileName: string;
  fileSize: number;
  fileSizeFormatted: string;
  mimeType: string;
  width: number;
  height: number;
  aspectRatio: string;
  totalPixels: number;
  colorChannels: number;
  shannonEntropy: number;
  entropyEvaluation: 'Normal Natural Image' | 'High Entropy / Likely Encrypted or Compressed' | 'Suspicious LSB Steganography Density';
  stegoCapacityBytes: number;
  stegoCapacityFormatted: string;
  exifTags: ExifTag[];
  gpsCoordinates?: {
    lat: number;
    lng: number;
    latRef: string;
    lngRef: string;
    altitude?: number;
    mapsUrl: string;
  };
  rawChunks: { name: string; size: number; details?: string }[];
  hexPreview: string;
}

// Extract EXIF & Structure from Image ArrayBuffer
export function analyzeImageMetadata(
  file: File,
  buffer: ArrayBuffer,
  imgWidth: number,
  imgHeight: number,
  pixelData?: Uint8ClampedArray
): ImageMetadataReport {
  const bytes = new Uint8Array(buffer);
  const tags: ExifTag[] = [];
  const rawChunks: { name: string; size: number; details?: string }[] = [];
  let gpsInfo: ImageMetadataReport['gpsCoordinates'] = undefined;

  // Format file size
  const sizeFormatted =
    file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${(file.size / 1024).toFixed(1)} KB`;

  // Capacity in LSB (1 bit per RGB channel = 3 bits per pixel)
  const totalBits = imgWidth * imgHeight * 3;
  const capacityBytes = Math.max(0, Math.floor(totalBits / 8) - 64);
  const capacityFormatted =
    capacityBytes > 1024 * 1024
      ? `${(capacityBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(capacityBytes / 1024).toFixed(1)} KB`;

  // 1. Calculate Shannon Entropy over pixel data or raw file bytes
  const byteFrequency = new Array(256).fill(0);
  const sampleBytes = pixelData || bytes.slice(0, 100000);
  for (let i = 0; i < sampleBytes.length; i++) {
    byteFrequency[sampleBytes[i]]++;
  }
  let entropy = 0;
  const totalSamples = sampleBytes.length;
  for (let i = 0; i < 256; i++) {
    if (byteFrequency[i] > 0) {
      const p = byteFrequency[i] / totalSamples;
      entropy -= p * Math.log2(p);
    }
  }
  entropy = Math.round(entropy * 1000) / 1000;

  let entropyEvaluation: ImageMetadataReport['entropyEvaluation'] = 'Normal Natural Image';
  if (entropy > 7.85) {
    entropyEvaluation = 'Suspicious LSB Steganography Density';
  } else if (entropy > 7.4) {
    entropyEvaluation = 'High Entropy / Likely Encrypted or Compressed';
  }

  // 2. Parse PNG Chunks
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    tags.push({ id: 'fmt', name: 'File Format', value: 'PNG (Portable Network Graphics)', category: 'Image' });
    let pos = 8;
    while (pos < bytes.length - 8) {
      const length = (bytes[pos] << 24) | (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3];
      const type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
      let details = '';

      if (type === 'IHDR') {
        const w = (bytes[pos + 8] << 24) | (bytes[pos + 9] << 16) | (bytes[pos + 10] << 8) | bytes[pos + 11];
        const h = (bytes[pos + 12] << 24) | (bytes[pos + 13] << 16) | (bytes[pos + 14] << 8) | bytes[pos + 15];
        const bitDepth = bytes[pos + 16];
        const colorType = bytes[pos + 17];
        details = `Dimensions: ${w}x${h}, BitDepth: ${bitDepth}, ColorType: ${colorType}`;
        tags.push({ id: 'ihdr_w', name: 'IHDR Width', value: `${w}px`, category: 'Image' });
        tags.push({ id: 'ihdr_h', name: 'IHDR Height', value: `${h}px`, category: 'Image' });
        tags.push({ id: 'ihdr_bd', name: 'Bit Depth', value: `${bitDepth}-bit`, category: 'Image' });
      } else if (type === 'tEXt' || type === 'zTXt' || type === 'iTXt') {
        const textBytes = bytes.slice(pos + 8, pos + 8 + length);
        let nullIdx = 0;
        while (nullIdx < textBytes.length && textBytes[nullIdx] !== 0) nullIdx++;
        const keyword = new TextDecoder().decode(textBytes.slice(0, nullIdx));
        const val = new TextDecoder().decode(textBytes.slice(nullIdx + 1));
        details = `${keyword}: ${val.substring(0, 50)}`;
        tags.push({ id: `txt_${keyword}`, name: `PNG Text (${keyword})`, value: val, category: 'Software' });
      } else if (type === 'pHYs') {
        details = 'Physical Pixel Dimensions';
      } else if (type === 'gAMA') {
        details = 'Gamma Correction Chunk';
      }

      rawChunks.push({ name: type, size: length, details });
      pos += 12 + length;
    }
  }

  // 3. Parse JPEG EXIF / JFIF markers
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    tags.push({ id: 'fmt', name: 'File Format', value: 'JPEG (Joint Photographic Experts Group)', category: 'Image' });
    let offset = 2;
    while (offset < bytes.length) {
      if (bytes[offset] !== 0xff) break;
      const marker = bytes[offset + 1];
      if (marker === 0xd9 || marker === 0xda) break; // EOI or SOS

      const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
      const markerName = getJpegMarkerName(marker);

      // APP1 (EXIF / XMP)
      if (marker === 0xe1 && length > 6) {
        const header = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
        if (header === 'Exif') {
          parseTiffExif(bytes, offset + 10, tags, (gps) => {
            gpsInfo = gps;
          });
          rawChunks.push({ name: `APP1 (EXIF)`, size: length, details: 'TIFF Header & Metadata Tag Tree' });
        } else if (header.startsWith('http')) {
          rawChunks.push({ name: `APP1 (XMP)`, size: length, details: 'Extensible Metadata Platform XML' });
          tags.push({ id: 'xmp', name: 'XMP Metadata', value: 'Embedded Adobe XMP Structure Present', category: 'Software' });
        } else {
          rawChunks.push({ name: `APP1`, size: length });
        }
      } else if (marker === 0xe0) {
        rawChunks.push({ name: `APP0 (JFIF)`, size: length, details: 'JFIF Standard Image Header' });
      } else if (marker === 0xfe) {
        // Comment marker
        const comment = new TextDecoder().decode(bytes.slice(offset + 4, offset + 2 + length));
        tags.push({ id: 'comment', name: 'JPEG Comment', value: comment, category: 'Software' });
        rawChunks.push({ name: `COM (Comment)`, size: length, details: comment });
      } else {
        rawChunks.push({ name: markerName, size: length });
      }

      offset += 2 + length;
    }
  }

  // Common tags
  tags.unshift(
    { id: 'dim', name: 'Dimensions', value: `${imgWidth} x ${imgHeight} px`, category: 'Image' },
    { id: 'ar', name: 'Aspect Ratio', value: calculateAspectRatio(imgWidth, imgHeight), category: 'Image' },
    { id: 'tp', name: 'Total Pixels', value: `${(imgWidth * imgHeight).toLocaleString()} px`, category: 'Image' },
    { id: 'fs', name: 'File Size', value: sizeFormatted, category: 'Image' },
    { id: 'entropy', name: 'Shannon Entropy', value: `${entropy} bits/byte (${entropyEvaluation})`, category: 'Image' }
  );

  // Hex preview of first 256 bytes
  const hexSlice = bytes.slice(0, 256);
  const hexPreview = arrayBufferToHex(hexSlice);

  return {
    fileName: file.name,
    fileSize: file.size,
    fileSizeFormatted: sizeFormatted,
    mimeType: file.type || 'image/png',
    width: imgWidth,
    height: imgHeight,
    aspectRatio: calculateAspectRatio(imgWidth, imgHeight),
    totalPixels: imgWidth * imgHeight,
    colorChannels: 4,
    shannonEntropy: entropy,
    entropyEvaluation,
    stegoCapacityBytes: capacityBytes,
    stegoCapacityFormatted: capacityFormatted,
    exifTags: tags,
    gpsCoordinates: gpsInfo,
    rawChunks,
    hexPreview,
  };
}

function getJpegMarkerName(marker: number): string {
  switch (marker) {
    case 0xe0: return 'APP0 (JFIF)';
    case 0xe1: return 'APP1 (EXIF/XMP)';
    case 0xe2: return 'APP2 (ICC Profile)';
    case 0xdb: return 'DQT (Quantization Table)';
    case 0xc0: return 'SOF0 (Baseline DCT)';
    case 0xc2: return 'SOF2 (Progressive DCT)';
    case 0xc4: return 'DHT (Huffman Table)';
    case 0xfe: return 'COM (Comment)';
    case 0xda: return 'SOS (Start of Scan)';
    default: return `0xFF${marker.toString(16).toUpperCase()}`;
  }
}

function calculateAspectRatio(width: number, height: number): string {
  function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
  }
  const r = gcd(width, height);
  const arW = width / r;
  const arH = height / r;
  if (arW < 25 && arH < 25) {
    return `${arW}:${arH}`;
  }
  return `${(width / height).toFixed(2)}:1`;
}

// Basic TIFF / EXIF tag reader
function parseTiffExif(
  bytes: Uint8Array,
  tiffStart: number,
  tags: ExifTag[],
  onGpsFound: (gps: ImageMetadataReport['gpsCoordinates']) => void
) {
  try {
    const isLittleEndian = bytes[tiffStart] === 0x49 && bytes[tiffStart + 1] === 0x49;
    const readUint16 = (offset: number) => {
      const p = tiffStart + offset;
      return isLittleEndian ? bytes[p] | (bytes[p + 1] << 8) : (bytes[p] << 8) | bytes[p + 1];
    };
    const readUint32 = (offset: number) => {
      const p = tiffStart + offset;
      return isLittleEndian
        ? bytes[p] | (bytes[p + 1] << 8) | (bytes[p + 2] << 16) | (bytes[p + 3] << 24)
        : (bytes[p] << 24) | (bytes[p + 1] << 16) | (bytes[p + 2] << 8) | bytes[p + 3];
    };

    const firstIfdOffset = readUint32(4);
    if (firstIfdOffset < 8) return;

    const numEntries = readUint16(firstIfdOffset);
    let offset = firstIfdOffset + 2;

    const tagNames: Record<number, { name: string; category: ExifTag['category'] }> = {
      0x010f: { name: 'Camera Make', category: 'Camera' },
      0x0110: { name: 'Camera Model', category: 'Camera' },
      0x0112: { name: 'Orientation', category: 'Image' },
      0x0131: { name: 'Software', category: 'Software' },
      0x0132: { name: 'DateTime Original', category: 'Timestamps' },
      0x013b: { name: 'Artist / Author', category: 'Camera' },
      0x8298: { name: 'Copyright', category: 'Camera' },
      0x829a: { name: 'Exposure Time', category: 'Camera' },
      0x829d: { name: 'F-Number (Aperture)', category: 'Camera' },
      0x8827: { name: 'ISO Speed Ratings', category: 'Camera' },
      0x9003: { name: 'Date/Time Original', category: 'Timestamps' },
      0x920a: { name: 'Focal Length', category: 'Camera' },
      0xa434: { name: 'Lens Model', category: 'Camera' },
    };

    for (let i = 0; i < numEntries; i++) {
      const tagId = readUint16(offset - tiffStart);
      const type = readUint16(offset - tiffStart + 2);
      const count = readUint32(offset - tiffStart + 4);
      const valueOffset = readUint32(offset - tiffStart + 8);

      if (tagNames[tagId]) {
        let val = '';
        if (type === 2) {
          // ASCII string
          const strStart = count <= 4 ? offset + 8 : tiffStart + valueOffset;
          val = new TextDecoder().decode(bytes.slice(strStart, strStart + count - 1)).trim();
        } else if (type === 3) {
          // SHORT
          val = readUint16(offset - tiffStart + 8).toString();
        } else if (type === 4) {
          // LONG
          val = valueOffset.toString();
        }

        if (val) {
          tags.push({
            id: `tag_${tagId.toString(16)}`,
            name: tagNames[tagId].name,
            value: val,
            category: tagNames[tagId].category,
          });
        }
      }
      offset += 12;
    }
  } catch (err) {
    // Ignore parsing errors for non-standard EXIF structures
  }
}

// -------------------------------------------------------------
// LSB STEGANOGRAPHY ENCODER & DECODER
// -------------------------------------------------------------

// Magic byte signature: "SENTINEL_STEGO_V1"
const MAGIC_SIGNATURE = [0x53, 0x45, 0x4e, 0x54, 0x49, 0x4e, 0x45, 0x4c, 0x5f, 0x53, 0x54, 0x45, 0x47, 0x4f, 0x5f, 0x31]; // 16 bytes

export async function embedSteganography(
  canvas: HTMLCanvasElement,
  secretPayload: string,
  passphrase?: string
): Promise<{
  stegoDataUrl: string;
  bytesUsed: number;
  totalCapacityBytes: number;
  capacityPercent: number;
  isEncrypted: boolean;
}> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  // Max payload bits: 3 channels (RGB) per pixel
  const totalRgbChannels = width * height * 3;
  const maxBytes = Math.floor(totalRgbChannels / 8);

  let isEncrypted = false;
  let payloadBytes: Uint8Array;
  let salt = new Uint8Array(16);
  let iv = new Uint8Array(12);

  if (passphrase && passphrase.trim().length > 0) {
    isEncrypted = true;
    const encResult = await encryptAES_GCM(secretPayload, passphrase.trim(), 256);
    // Bundle consists of salt(16) + iv(12) + ciphertext
    const rawBundle = base64ToArrayBuffer(encResult.ciphertextBase64);
    salt = rawBundle.slice(0, 16);
    iv = rawBundle.slice(16, 28);
    payloadBytes = rawBundle.slice(28);
  } else {
    payloadBytes = new TextEncoder().encode(secretPayload);
  }

  // Header Structure:
  // [MAGIC (16 bytes)][ENCRYPTED_FLAG (1 byte)][PAYLOAD_LEN (4 bytes uint32)][SALT (16 bytes)][IV (12 bytes)] = 49 bytes header
  const headerLength = 49;
  const totalPackageLength = headerLength + payloadBytes.length;

  if (totalPackageLength > maxBytes) {
    throw new Error(
      `Payload size (${totalPackageLength} bytes) exceeds image steganography capacity (${maxBytes} bytes). Please use a larger carrier image or reduce payload size.`
    );
  }

  const packageBytes = new Uint8Array(totalPackageLength);
  // Set magic
  packageBytes.set(MAGIC_SIGNATURE, 0);
  // Set encrypted flag
  packageBytes[16] = isEncrypted ? 1 : 0;
  // Set length (4 bytes big-endian)
  const len = payloadBytes.length;
  packageBytes[17] = (len >>> 24) & 0xff;
  packageBytes[18] = (len >>> 16) & 0xff;
  packageBytes[19] = (len >>> 8) & 0xff;
  packageBytes[20] = len & 0xff;
  // Set salt
  packageBytes.set(salt, 21);
  // Set iv
  packageBytes.set(iv, 37);
  // Set payload
  packageBytes.set(payloadBytes, 49);

  // Convert packageBytes to bit stream
  const bits: number[] = [];
  for (let i = 0; i < packageBytes.length; i++) {
    const byte = packageBytes[i];
    for (let bit = 7; bit >= 0; bit--) {
      bits.push((byte >>> bit) & 1);
    }
  }

  // Embed bits into LSB of RGB channels
  let bitIndex = 0;
  for (let i = 0; i < pixels.length && bitIndex < bits.length; i += 4) {
    // R channel
    if (bitIndex < bits.length) {
      pixels[i] = (pixels[i] & 0xfe) | bits[bitIndex++];
    }
    // G channel
    if (bitIndex < bits.length) {
      pixels[i + 1] = (pixels[i + 1] & 0xfe) | bits[bitIndex++];
    }
    // B channel
    if (bitIndex < bits.length) {
      pixels[i + 2] = (pixels[i + 2] & 0xfe) | bits[bitIndex++];
    }
    // Leave Alpha (pixels[i+3]) untouched
  }

  // Write back modified pixels
  ctx.putImageData(imageData, 0, 0);
  const stegoDataUrl = canvas.toDataURL('image/png'); // MUST BE LOSSLESS PNG

  return {
    stegoDataUrl,
    bytesUsed: totalPackageLength,
    totalCapacityBytes: maxBytes,
    capacityPercent: Math.round((totalPackageLength / maxBytes) * 10000) / 100,
    isEncrypted,
  };
}

export async function extractSteganography(
  canvas: HTMLCanvasElement,
  passphrase?: string
): Promise<{
  success: boolean;
  message: string;
  isEncrypted: boolean;
  payloadLength: number;
  extractedText: string;
  diagnostics: string;
}> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  // Extract LSB bits from RGB channels
  const totalRgbChannels = width * height * 3;
  const maxBytesToRead = Math.min(Math.floor(totalRgbChannels / 8), 500000); // safety cap
  const extractedBytes = new Uint8Array(maxBytesToRead);

  let byteIdx = 0;
  let currentByte = 0;
  let bitCount = 0;

  for (let i = 0; i < pixels.length && byteIdx < maxBytesToRead; i += 4) {
    for (let c = 0; c < 3 && byteIdx < maxBytesToRead; c++) {
      const bit = pixels[i + c] & 1;
      currentByte = (currentByte << 1) | bit;
      bitCount++;
      if (bitCount === 8) {
        extractedBytes[byteIdx++] = currentByte;
        currentByte = 0;
        bitCount = 0;
      }
    }
  }

  // Check Magic Signature
  let magicMatches = true;
  for (let i = 0; i < MAGIC_SIGNATURE.length; i++) {
    if (extractedBytes[i] !== MAGIC_SIGNATURE[i]) {
      magicMatches = false;
      break;
    }
  }

  if (!magicMatches) {
    return {
      success: false,
      message: 'No SentinelScope Steganography magic marker (SENTINEL_STEGO_V1) found in image pixels.',
      isEncrypted: false,
      payloadLength: 0,
      extractedText: '',
      diagnostics: 'Image does not appear to contain standard LSB encoded data or was recompressed by a lossy JPEG converter.',
    };
  }

  // Parse header
  const isEncrypted = extractedBytes[16] === 1;
  const payloadLen =
    (extractedBytes[17] << 24) |
    (extractedBytes[18] << 16) |
    (extractedBytes[19] << 8) |
    extractedBytes[20];

  if (payloadLen <= 0 || payloadLen > maxBytesToRead - 49) {
    return {
      success: false,
      message: 'Corrupted steganography header: invalid payload length.',
      isEncrypted,
      payloadLength: payloadLen,
      extractedText: '',
      diagnostics: `Reported payload length (${payloadLen} bytes) exceeds readable pixel data.`,
    };
  }

  const salt = extractedBytes.slice(21, 37);
  const iv = extractedBytes.slice(37, 49);
  const payload = extractedBytes.slice(49, 49 + payloadLen);

  if (isEncrypted) {
    if (!passphrase || passphrase.trim().length === 0) {
      return {
        success: false,
        message: 'This stego payload is encrypted with AES-GCM 256-bit. Please enter the decryption passphrase.',
        isEncrypted: true,
        payloadLength: payloadLen,
        extractedText: '',
        diagnostics: `Detected AES-GCM 256-bit encrypted payload of length ${payloadLen} bytes. Salt: ${arrayBufferToHex(salt)}, IV: ${arrayBufferToHex(iv)}`,
      };
    }

    try {
      // Reconstruct bundle: Salt(16) + IV(12) + Ciphertext
      const bundle = new Uint8Array(salt.length + iv.length + payload.length);
      bundle.set(salt, 0);
      bundle.set(iv, salt.length);
      bundle.set(payload, salt.length + iv.length);

      const decrypted = await decryptAES_GCM(arrayBufferToBase64(bundle), passphrase.trim(), 256);
      return {
        success: true,
        message: 'Steganography secret payload successfully extracted and decrypted!',
        isEncrypted: true,
        payloadLength: payloadLen,
        extractedText: decrypted,
        diagnostics: `Payload verified & authenticated with AES-GCM tag. Salt: ${arrayBufferToHex(salt)}, IV: ${arrayBufferToHex(iv)}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Decryption failed: ${err.message || 'Incorrect passphrase or corrupted authentication tag.'}`,
        isEncrypted: true,
        payloadLength: payloadLen,
        extractedText: '',
        diagnostics: 'Authentication tag check failed. Either the passphrase is wrong or image pixel data was modified.',
      };
    }
  } else {
    const text = new TextDecoder().decode(payload);
    return {
      success: true,
      message: 'Steganography payload successfully extracted (Plaintext mode)!',
      isEncrypted: false,
      payloadLength: payloadLen,
      extractedText: text,
      diagnostics: `Payload length: ${payloadLen} bytes. Checksum verified.`,
    };
  }
}

// Generate Bit-Plane representations (Bit 0 LSB to Bit 7 MSB) for RGB
export function extractBitPlanes(
  canvas: HTMLCanvasElement,
  channel: 'red' | 'green' | 'blue' | 'all'
): string[] {
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const src = imageData.data;

  const bitPlaneDataUrls: string[] = [];

  for (let bit = 0; bit < 8; bit++) {
    const planeCanvas = document.createElement('canvas');
    planeCanvas.width = width;
    planeCanvas.height = height;
    const planeCtx = planeCanvas.getContext('2d');
    if (!planeCtx) continue;

    const planeImgData = planeCtx.createImageData(width, height);
    const dest = planeImgData.data;

    for (let i = 0; i < src.length; i += 4) {
      let val = 0;
      if (channel === 'red') {
        val = (src[i] >> bit) & 1 ? 255 : 0;
        dest[i] = val;
        dest[i + 1] = 0;
        dest[i + 2] = 0;
      } else if (channel === 'green') {
        val = (src[i + 1] >> bit) & 1 ? 255 : 0;
        dest[i] = 0;
        dest[i + 1] = val;
        dest[i + 2] = 0;
      } else if (channel === 'blue') {
        val = (src[i + 2] >> bit) & 1 ? 255 : 0;
        dest[i] = 0;
        dest[i + 1] = 0;
        dest[i + 2] = val;
      } else {
        const r = (src[i] >> bit) & 1 ? 255 : 0;
        const g = (src[i + 1] >> bit) & 1 ? 255 : 0;
        const b = (src[i + 2] >> bit) & 1 ? 255 : 0;
        dest[i] = r;
        dest[i + 1] = g;
        dest[i + 2] = b;
      }
      dest[i + 3] = 255;
    }

    planeCtx.putImageData(planeImgData, 0, 0);
    bitPlaneDataUrls.push(planeCanvas.toDataURL('image/png'));
  }

  return bitPlaneDataUrls;
}
