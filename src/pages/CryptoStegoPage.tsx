// src/pages/CryptoStegoPage.tsx
// Comprehensive Cryptographic Encryption/Decryption Suite, Image EXIF Metadata Forensic Analyzer & Steganography Lab

import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Unlock,
  Key,
  Shield,
  FileCode,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Copy,
  Check,
  Download,
  Upload,
  RefreshCw,
  Zap,
  Sliders,
  Terminal,
  Layers,
  MapPin,
  Camera,
  Cpu,
  Binary,
  Share2,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Code2,
} from 'lucide-react';
import {
  encryptAES_GCM,
  decryptAES_GCM,
  encryptAES_CBC,
  decryptAES_CBC,
  generateRSAKeyPair,
  encryptRSA,
  decryptRSA,
  xorCipher,
  xorDecrypt,
  caesarCipher,
  computeHash,
  computeHMAC,
  encodeDecodeUtility,
  decodeJWT,
  md5,
} from '../lib/cryptoEngine';
import {
  analyzeImageMetadata,
  embedSteganography,
  extractSteganography,
  extractBitPlanes,
  ImageMetadataReport,
} from '../lib/stegoEngine';

interface CryptoStegoPageProps {
  initialTab?: 'crypto' | 'metadata' | 'stego-encode' | 'stego-decode';
  onSendToRepeater?: (req: any) => void;
}

export const CryptoStegoPage: React.FC<CryptoStegoPageProps> = ({
  initialTab = 'crypto',
}) => {
  const [activeTab, setActiveTab] = useState<'crypto' | 'metadata' | 'stego-encode' | 'stego-decode'>(initialTab);

  // -------------------------------------------------------------
  // TAB 1: CRYPTO SUITE STATE
  // -------------------------------------------------------------
  const [cryptoMode, setCryptoMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [cipherAlgorithm, setCipherAlgorithm] = useState<
    'AES-GCM-256' | 'AES-GCM-128' | 'AES-CBC-256' | 'RSA-OAEP-2048' | 'XOR-STREAM' | 'CAESAR' | 'ENCODING' | 'HASH' | 'JWT'
  >('AES-GCM-256');

  // Common input/outputs
  const [inputText, setInputText] = useState<string>(
    'CONFIDENTIAL_OP_DATA: SentinelScope Perimeter Node-04 authorized for credential audit.'
  );
  const [passphrase, setPassphrase] = useState<string>('SentinelKey_99$SecurePass');
  const [showPassphrase, setShowPassphrase] = useState<boolean>(false);
  const [outputResult, setOutputResult] = useState<string>('');
  const [cryptoError, setCryptoError] = useState<string | null>(null);
  const [cryptoMeta, setCryptoMeta] = useState<string | null>(null);
  const [copiedCrypto, setCopiedCrypto] = useState<boolean>(false);

  // RSA Keypair
  const [rsaKeyPair, setRsaKeyPair] = useState<{ publicKeyPem: string; privateKeyPem: string } | null>(null);
  const [isGeneratingRsa, setIsGeneratingRsa] = useState<boolean>(false);

  // Caesar / XOR / Encoding / Hash configs
  const [caesarShift, setCaesarShift] = useState<number>(13);
  const [encodingFormat, setEncodingFormat] = useState<'base64' | 'base64url' | 'hex' | 'binary' | 'url' | 'html' | 'reverse'>('base64');
  const [hashAlgorithm, setHashAlgorithm] = useState<'SHA-256' | 'SHA-512' | 'SHA-384' | 'SHA-1' | 'MD5'>('SHA-256');
  const [hmacSecret, setHmacSecret] = useState<string>('');

  // -------------------------------------------------------------
  // TAB 2: IMAGE METADATA & EXIF STATE
  // -------------------------------------------------------------
  const [metaImageFile, setMetaImageFile] = useState<File | null>(null);
  const [metaImageUrl, setMetaImageUrl] = useState<string | null>(null);
  const [metaReport, setMetaReport] = useState<ImageMetadataReport | null>(null);
  const [isAnalyzingMeta, setIsAnalyzingMeta] = useState<boolean>(false);
  const [metaActiveCategory, setMetaActiveCategory] = useState<string>('All');
  const [bitPlanes, setBitPlanes] = useState<string[]>([]);
  const [bitPlaneChannel, setBitPlaneChannel] = useState<'all' | 'red' | 'green' | 'blue'>('all');
  const [isExtractingBitPlanes, setIsExtractingBitPlanes] = useState<boolean>(false);
  const metaCanvasRef = useRef<HTMLCanvasElement>(null);
  const metaFileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // TAB 3: STEGO ENCODE STATE
  // -------------------------------------------------------------
  const [carrierImageUrl, setCarrierImageUrl] = useState<string | null>(null);
  const [carrierFileName, setCarrierFileName] = useState<string>('sample_cyber_carrier.png');
  const [carrierDimensions, setCarrierDimensions] = useState<{ w: number; h: number }>({ w: 600, h: 400 });
  const [stegoSecretText, setStegoSecretText] = useState<string>(
    'TOP_SECRET_RECON_PAYLOAD: Authorization token { "auth": "SENTINEL_ROOT_2026", "privilege": "ADMIN", "expires": "2026-12-31" }'
  );
  const [stegoPassphrase, setStegoPassphrase] = useState<string>('StegoPassword#442');
  const [useStegoPassword, setUseStegoPassword] = useState<boolean>(true);
  const [isEmbeddingStego, setIsEmbeddingStego] = useState<boolean>(false);
  const [stegoResultDataUrl, setStegoResultDataUrl] = useState<string | null>(null);
  const [stegoEmbedStats, setStegoEmbedStats] = useState<{
    bytesUsed: number;
    totalCapacityBytes: number;
    capacityPercent: number;
    isEncrypted: boolean;
  } | null>(null);
  const [stegoEmbedError, setStegoEmbedError] = useState<string | null>(null);
  const encodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const encodeFileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // TAB 4: STEGO DECODE STATE
  // -------------------------------------------------------------
  const [decodeImageUrl, setDecodeImageUrl] = useState<string | null>(null);
  const [decodePassphrase, setDecodePassphrase] = useState<string>('StegoPassword#442');
  const [isDecodingStego, setIsDecodingStego] = useState<boolean>(false);
  const [decodeResult, setDecodeResult] = useState<{
    success: boolean;
    message: string;
    isEncrypted: boolean;
    payloadLength: number;
    extractedText: string;
    diagnostics: string;
  } | null>(null);
  const decodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const decodeFileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // INITIAL SAMPLES INITIALIZATION
  // -------------------------------------------------------------
  useEffect(() => {
    generateDefaultSampleCarrier();
  }, []);

  const generateDefaultSampleCarrier = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw cool gradient background
    const grad = ctx.createLinearGradient(0, 0, 640, 420);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e293b');
    grad.addColorStop(1, '#0e7490');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 420);

    // Draw cyber grid
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 640; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 420);
      ctx.stroke();
    }
    for (let y = 0; y < 420; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(640, y);
      ctx.stroke();
    }

    // Draw visual accent logo
    ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
    ctx.beginPath();
    ctx.arc(320, 210, 80, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SENTINEL-SCOPE CARRIER SAMPLE', 320, 205);
    ctx.font = '12px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('Dimensions: 640x420 • Max Stego Capacity: ~100 KB', 320, 235);

    const dataUrl = canvas.toDataURL('image/png');
    setCarrierImageUrl(dataUrl);
    setCarrierDimensions({ w: 640, h: 420 });

    // Also set metadata default
    setMetaImageUrl(dataUrl);
    processMetaAnalysis(dataUrl, 'sample_carrier.png', 640, 420);
  };

  // -------------------------------------------------------------
  // RUN CRYPTO ENGINE
  // -------------------------------------------------------------
  const handleExecuteCrypto = async () => {
    setCryptoError(null);
    setCryptoMeta(null);

    try {
      if (cipherAlgorithm === 'AES-GCM-256' || cipherAlgorithm === 'AES-GCM-128') {
        const keyLength = cipherAlgorithm === 'AES-GCM-128' ? 128 : 256;
        if (!passphrase) throw new Error('Passphrase is required for AES-GCM.');

        if (cryptoMode === 'encrypt') {
          const res = await encryptAES_GCM(inputText, passphrase, keyLength);
          setOutputResult(res.ciphertextBase64);
          setCryptoMeta(`AES-GCM ${keyLength}-bit | PBKDF2 (100k iters) | Salt: ${res.saltHex.substring(0, 16)}... | IV: ${res.ivHex}`);
        } else {
          const decrypted = await decryptAES_GCM(inputText, passphrase, keyLength);
          setOutputResult(decrypted);
          setCryptoMeta(`Decryption Successful | AES-GCM ${keyLength}-bit Authentication Verified`);
        }
      } else if (cipherAlgorithm === 'AES-CBC-256') {
        if (!passphrase) throw new Error('Passphrase is required for AES-CBC.');
        if (cryptoMode === 'encrypt') {
          const res = await encryptAES_CBC(inputText, passphrase);
          setOutputResult(res.ciphertextBase64);
          setCryptoMeta(`AES-CBC 256-bit | PKCS7 Padding | Salt: ${res.saltHex.substring(0, 16)}... | IV: ${res.ivHex}`);
        } else {
          const dec = await decryptAES_CBC(inputText, passphrase);
          setOutputResult(dec);
          setCryptoMeta('Decryption Successful | AES-CBC 256-bit Plaintext Restored');
        }
      } else if (cipherAlgorithm === 'RSA-OAEP-2048') {
        if (cryptoMode === 'encrypt') {
          if (!rsaKeyPair?.publicKeyPem) {
            throw new Error('Please generate or paste an RSA Public Key first.');
          }
          const encrypted = await encryptRSA(inputText, rsaKeyPair.publicKeyPem);
          setOutputResult(encrypted);
          setCryptoMeta('RSA-OAEP (2048-bit) Asymmetric Public Key Encryption | SHA-256 Hash');
        } else {
          if (!rsaKeyPair?.privateKeyPem) {
            throw new Error('Please generate or paste an RSA Private Key first.');
          }
          const decrypted = await decryptRSA(inputText, rsaKeyPair.privateKeyPem);
          setOutputResult(decrypted);
          setCryptoMeta('RSA-OAEP (2048-bit) Private Key Decryption Successful');
        }
      } else if (cipherAlgorithm === 'XOR-STREAM') {
        if (!passphrase) throw new Error('Key is required for XOR cipher.');
        if (cryptoMode === 'encrypt') {
          const res = xorCipher(inputText, passphrase);
          setOutputResult(res.base64);
          setCryptoMeta(`XOR Stream Cipher (Base64) | Hex: ${res.hex}`);
        } else {
          const dec = xorDecrypt(inputText, passphrase, false);
          setOutputResult(dec);
          setCryptoMeta('XOR Decryption Stream Executed');
        }
      } else if (cipherAlgorithm === 'CAESAR') {
        const shift = cryptoMode === 'encrypt' ? caesarShift : -caesarShift;
        const res = caesarCipher(inputText, shift);
        setOutputResult(res);
        setCryptoMeta(`Caesar / ROT Shift: ${shift > 0 ? '+' : ''}${shift}`);
      } else if (cipherAlgorithm === 'ENCODING') {
        const res = encodeDecodeUtility(inputText, encodingFormat, cryptoMode === 'encrypt' ? 'encode' : 'decode');
        setOutputResult(res);
        setCryptoMeta(`Format: ${encodingFormat.toUpperCase()} | Operation: ${cryptoMode.toUpperCase()}`);
      } else if (cipherAlgorithm === 'HASH') {
        if (hmacSecret) {
          if (hashAlgorithm === 'MD5' || hashAlgorithm === 'SHA-1' || hashAlgorithm === 'SHA-384') {
            throw new Error('HMAC is supported for SHA-256 and SHA-512');
          }
          const hmac = await computeHMAC(hashAlgorithm, inputText, hmacSecret);
          setOutputResult(hmac);
          setCryptoMeta(`HMAC-${hashAlgorithm} Signature Generated (Key Length: ${hmacSecret.length} chars)`);
        } else {
          const h = await computeHash(hashAlgorithm, inputText);
          setOutputResult(h);
          setCryptoMeta(`Cryptographic Hash: ${hashAlgorithm} (${h.length * 4}-bit digest)`);
        }
      } else if (cipherAlgorithm === 'JWT') {
        try {
          const jwtData = decodeJWT(inputText);
          setOutputResult(JSON.stringify(jwtData, null, 2));
          setCryptoMeta(`JWT Algorithm: ${jwtData.header.alg || 'Unknown'} | Expired: ${jwtData.isExpired ? 'YES' : 'NO'}`);
        } catch (err: any) {
          throw new Error(`JWT Parse Error: ${err.message}`);
        }
      }
    } catch (err: any) {
      setCryptoError(err.message || 'Cryptographic operation failed');
    }
  };

  const handleGenerateRsaKeys = async () => {
    setIsGeneratingRsa(true);
    setCryptoError(null);
    try {
      const keys = await generateRSAKeyPair(2048);
      setRsaKeyPair(keys);
      setCryptoMeta('Generated new 2048-bit RSA Keypair with SHA-256 OAEP parameters');
    } catch (err: any) {
      setCryptoError('RSA key generation error: ' + err.message);
    } finally {
      setIsGeneratingRsa(false);
    }
  };

  const handleCopyCrypto = () => {
    if (!outputResult) return;
    navigator.clipboard.writeText(outputResult);
    setCopiedCrypto(true);
    setTimeout(() => setCopiedCrypto(false), 2000);
  };

  // -------------------------------------------------------------
  // TAB 2: METADATA & EXIF ANALYSIS
  // -------------------------------------------------------------
  const processMetaAnalysis = async (dataUrl: string, fileName: string, w?: number, h?: number) => {
    setIsAnalyzingMeta(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = dataUrl;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const width = w || img.width;
      const height = h || img.height;

      // Draw to offscreen canvas to get pixel data
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);

        // Fetch buffer
        const response = await fetch(dataUrl);
        const buffer = await response.arrayBuffer();

        const dummyFile = new File([buffer], fileName, { type: 'image/png' });
        const report = analyzeImageMetadata(dummyFile, buffer, width, height, imgData.data);
        setMetaReport(report);
      }
    } catch (err: any) {
      console.error('Metadata analysis error:', err);
    } finally {
      setIsAnalyzingMeta(false);
    }
  };

  const handleMetaFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMetaImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setMetaImageUrl(url);

      const img = new Image();
      img.onload = () => {
        processMetaAnalysis(url, file.name, img.width, img.height);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateBitPlanes = async () => {
    if (!metaImageUrl) return;
    setIsExtractingBitPlanes(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = metaImageUrl;
      await new Promise((res) => (img.onload = res));

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const planes = extractBitPlanes(canvas, bitPlaneChannel);
        setBitPlanes(planes);
      }
    } catch (err) {
      console.error('Bit plane extraction failed:', err);
    } finally {
      setIsExtractingBitPlanes(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 3: STEGANOGRAPHY ENCODE & EMBED
  // -------------------------------------------------------------
  const handleCarrierFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCarrierFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setCarrierImageUrl(url);
      const img = new Image();
      img.onload = () => {
        setCarrierDimensions({ w: img.width, h: img.height });
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const handleEmbedStego = async () => {
    if (!carrierImageUrl) return;
    if (!stegoSecretText.trim()) {
      setStegoEmbedError('Please provide a secret payload message or text to embed.');
      return;
    }

    setIsEmbeddingStego(true);
    setStegoEmbedError(null);
    setStegoResultDataUrl(null);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = carrierImageUrl;
      await new Promise((res) => (img.onload = res));

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to create canvas context');

      ctx.drawImage(img, 0, 0);

      const pass = useStegoPassword ? stegoPassphrase : undefined;
      const result = await embedSteganography(canvas, stegoSecretText, pass);

      setStegoResultDataUrl(result.stegoDataUrl);
      setStegoEmbedStats({
        bytesUsed: result.bytesUsed,
        totalCapacityBytes: result.totalCapacityBytes,
        capacityPercent: result.capacityPercent,
        isEncrypted: result.isEncrypted,
      });
    } catch (err: any) {
      setStegoEmbedError(err.message || 'Steganography embedding failed');
    } finally {
      setIsEmbeddingStego(false);
    }
  };

  const handleDownloadStegoImage = () => {
    if (!stegoResultDataUrl) return;
    const a = document.createElement('a');
    a.href = stegoResultDataUrl;
    a.download = `sentinel_stego_secret_${Date.now()}.png`;
    a.click();
  };

  const handleSendToDecoder = () => {
    if (!stegoResultDataUrl) return;
    setDecodeImageUrl(stegoResultDataUrl);
    setDecodePassphrase(useStegoPassword ? stegoPassphrase : '');
    setDecodeResult(null);
    setActiveTab('stego-decode');
  };

  // -------------------------------------------------------------
  // TAB 4: STEGANOGRAPHY DECODE & EXTRACT
  // -------------------------------------------------------------
  const handleDecodeFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setDecodeImageUrl(url);
      setDecodeResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleExtractStego = async () => {
    if (!decodeImageUrl) return;

    setIsDecodingStego(true);
    setDecodeResult(null);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = decodeImageUrl;
      await new Promise((res) => (img.onload = res));

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to create canvas context');

      ctx.drawImage(img, 0, 0);

      const result = await extractSteganography(canvas, decodePassphrase);
      setDecodeResult(result);
    } catch (err: any) {
      setDecodeResult({
        success: false,
        message: 'Extraction error: ' + (err.message || 'Unknown error'),
        isEncrypted: false,
        payloadLength: 0,
        extractedText: '',
        diagnostics: 'Canvas pixel stream read failure.',
      });
    } finally {
      setIsDecodingStego(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-mono">
                CRYPTOGRAPHY & STEGANOGRAPHY LAB
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-format encryption & decryption suite, image EXIF forensic metadata inspector, and AES-GCM LSB steganography engine.
              </p>
            </div>
          </div>
        </div>

        {/* Global Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('crypto')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition shrink-0 ${
              activeTab === 'crypto'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>1. Crypto Suite</span>
          </button>

          <button
            onClick={() => setActiveTab('metadata')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition shrink-0 ${
              activeTab === 'metadata'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>2. EXIF & Metadata Inspector</span>
          </button>

          <button
            onClick={() => setActiveTab('stego-encode')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition shrink-0 ${
              activeTab === 'stego-encode'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>3. Image Stego Encode</span>
          </button>

          <button
            onClick={() => setActiveTab('stego-decode')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition shrink-0 ${
              activeTab === 'stego-decode'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Unlock className="w-4 h-4" />
            <span>4. Image Stego Decode</span>
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: CRYPTO CIPHER & HASH SUITE */}
      {/* ============================================================= */}
      {activeTab === 'crypto' && (
        <div className="space-y-6">
          {/* Algorithm & Mode Selection Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
            {/* Cipher Algorithm */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                Select Cryptographic Suite / Format:
              </label>
              <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                {[
                  { id: 'AES-GCM-256', name: 'AES-256-GCM (Authenticated)' },
                  { id: 'AES-GCM-128', name: 'AES-128-GCM' },
                  { id: 'AES-CBC-256', name: 'AES-256-CBC' },
                  { id: 'RSA-OAEP-2048', name: 'RSA-2048 (Asymmetric OAEP)' },
                  { id: 'XOR-STREAM', name: 'XOR Stream Cipher' },
                  { id: 'CAESAR', name: 'Caesar / ROT13' },
                  { id: 'ENCODING', name: 'Base64 / Hex / Binary' },
                  { id: 'HASH', name: 'Hashes (SHA256/SHA512/MD5/HMAC)' },
                  { id: 'JWT', name: 'JWT Inspect & Verify' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCipherAlgorithm(item.id as any);
                      setOutputResult('');
                      setCryptoError(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg border transition ${
                      cipherAlgorithm === item.id
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Toggle (Encrypt vs Decrypt) */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-slate-300">Operation Mode:</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs">
                <button
                  onClick={() => setCryptoMode('encrypt')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition ${
                    cryptoMode === 'encrypt'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  Encrypt / Encode
                </button>
                <button
                  onClick={() => setCryptoMode('decrypt')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition ${
                    cryptoMode === 'decrypt'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Unlock className="w-3.5 h-3.5" />
                  Decrypt / Decode
                </button>
              </div>
            </div>
          </div>

          {/* Algorithm-Specific Parameter Inputs */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            {/* Passphrase / Key input (For AES, XOR) */}
            {(cipherAlgorithm.startsWith('AES') || cipherAlgorithm === 'XOR-STREAM') && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    Encryption Passphrase / Secret Key:
                  </label>
                  <button
                    onClick={() => setPassphrase(`SentinelKey_${Math.random().toString(36).substring(2, 10)}$`)}
                    className="text-cyan-400 hover:underline text-[11px]"
                  >
                    Generate Random Key
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassphrase ? 'text' : 'password'}
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter secret passphrase (e.g. MasterKey2026!)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* RSA Key Management Panel */}
            {cipherAlgorithm === 'RSA-OAEP-2048' && (
              <div className="space-y-3 p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-cyan-400" />
                    RSA-2048 Public & Private Keypair:
                  </span>
                  <button
                    onClick={handleGenerateRsaKeys}
                    disabled={isGeneratingRsa}
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGeneratingRsa ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingRsa ? 'Generating 2048-bit Key...' : 'Generate New RSA Keypair'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Public Key (PEM format for Encryption):</label>
                    <textarea
                      rows={4}
                      value={rsaKeyPair?.publicKeyPem || ''}
                      onChange={(e) =>
                        setRsaKeyPair((prev) => ({
                          publicKeyPem: e.target.value,
                          privateKeyPem: prev?.privateKeyPem || '',
                        }))
                      }
                      placeholder="-----BEGIN PUBLIC KEY-----"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-[10px] text-slate-300 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Private Key (PKCS8 for Decryption):</label>
                    <textarea
                      rows={4}
                      value={rsaKeyPair?.privateKeyPem || ''}
                      onChange={(e) =>
                        setRsaKeyPair((prev) => ({
                          publicKeyPem: prev?.publicKeyPem || '',
                          privateKeyPem: e.target.value,
                        }))
                      }
                      placeholder="-----BEGIN PRIVATE KEY-----"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-[10px] text-slate-300 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Caesar Config */}
            {cipherAlgorithm === 'CAESAR' && (
              <div className="flex items-center gap-4 text-xs font-mono">
                <label className="text-slate-300 font-semibold">Alphabet Shift Amount:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="25"
                    value={caesarShift}
                    onChange={(e) => setCaesarShift(Number(e.target.value))}
                    className="w-48 accent-cyan-400"
                  />
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-400 font-bold">
                    +{caesarShift} {caesarShift === 13 && '(ROT13 Standard)'}
                  </span>
                </div>
              </div>
            )}

            {/* Encoding Format Selector */}
            {cipherAlgorithm === 'ENCODING' && (
              <div className="space-y-1.5 text-xs font-mono">
                <label className="text-slate-300 font-semibold">Encoding Standard:</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'base64', name: 'Base64 Standard' },
                    { id: 'base64url', name: 'Base64URL Safe' },
                    { id: 'hex', name: 'Hexadecimal' },
                    { id: 'binary', name: '8-Bit Binary' },
                    { id: 'url', name: 'URL Percent' },
                    { id: 'html', name: 'HTML Entities' },
                    { id: 'reverse', name: 'String Reverse' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => setEncodingFormat(fmt.id as any)}
                      className={`px-2.5 py-1 rounded border ${
                        encodingFormat === fmt.id
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {fmt.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Hash & HMAC config */}
            {cipherAlgorithm === 'HASH' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold">Hash Algorithm:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['SHA-256', 'SHA-512', 'SHA-384', 'SHA-1', 'MD5'].map((h) => (
                      <button
                        key={h}
                        onClick={() => setHashAlgorithm(h as any)}
                        className={`px-2.5 py-1 rounded border ${
                          hashAlgorithm === h
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold">HMAC Secret Key (Optional):</label>
                  <input
                    type="text"
                    value={hmacSecret}
                    onChange={(e) => setHmacSecret(e.target.value)}
                    placeholder="Leave blank for regular cryptographic hash"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Input & Output Dual Terminal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span className="font-semibold flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  {cryptoMode === 'encrypt' ? 'Plaintext / Raw Input:' : 'Ciphertext / Encoded Input:'}
                </span>
                <button
                  onClick={() => setInputText('')}
                  className="text-slate-500 hover:text-red-400 text-[11px]"
                >
                  Clear Input
                </button>
              </div>
              <textarea
                rows={9}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter input data to process..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] font-mono text-slate-500">
                  {inputText.length} characters • {new Blob([inputText]).size} bytes
                </span>
                <button
                  onClick={handleExecuteCrypto}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Execute {cryptoMode === 'encrypt' ? 'Encryption' : 'Decryption'}</span>
                </button>
              </div>
            </div>

            {/* Output Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span className="font-semibold flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Processed Output:
                </span>
                {outputResult && (
                  <button
                    onClick={handleCopyCrypto}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-[11px]"
                  >
                    {copiedCrypto ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCrypto ? 'Copied' : 'Copy Output'}</span>
                  </button>
                )}
              </div>

              {cryptoError ? (
                <div className="p-4 rounded-lg bg-red-950/40 border border-red-500/30 text-xs font-mono text-red-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    Cryptographic Operation Error
                  </div>
                  <p>{cryptoError}</p>
                </div>
              ) : (
                <textarea
                  readOnly
                  rows={9}
                  value={outputResult}
                  placeholder="Output results will render here after execution..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-emerald-300 focus:outline-none"
                />
              )}

              {cryptoMeta && !cryptoError && (
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{cryptoMeta}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: IMAGE EXIF & METADATA FORENSIC INSPECTOR */}
      {/* ============================================================= */}
      {activeTab === 'metadata' && (
        <div className="space-y-6">
          {/* Upload & Overview Header */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload image box */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-200 font-mono flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                Upload Target Image for Forensic Audit
              </h2>

              <input
                ref={metaFileInputRef}
                type="file"
                accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.bmp"
                onChange={handleMetaFileSelect}
                className="hidden"
              />

              <div
                onClick={() => metaFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 bg-slate-950/60 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
              >
                <Upload className="w-8 h-8 text-cyan-400" />
                <p className="text-xs text-slate-300 font-mono">
                  <span className="text-cyan-400 font-bold underline underline-offset-2">Click to browse</span> or drop image file
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Supports JPEG (EXIF/JFIF/GPS), PNG (Chunks), WebP, GIF, BMP
                </p>
              </div>

              {/* Preview image */}
              {metaImageUrl && (
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex flex-col items-center gap-2">
                  <img
                    src={metaImageUrl}
                    alt="Target for inspection"
                    className="max-h-44 object-contain rounded border border-slate-800"
                  />
                  <span className="text-[10px] font-mono text-slate-400 truncate">
                    {metaReport?.fileName || 'image_preview.png'} ({metaReport?.width}x{metaReport?.height}px)
                  </span>
                </div>
              )}
            </div>

            {/* Quick Metrics & Stego Capacity */}
            {metaReport && (
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200 font-mono">
                    IMAGE FORENSIC PROFILE & ENTROPY
                  </h3>
                  <span className="px-2.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
                    {metaReport.mimeType}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Resolution</span>
                    <p className="text-sm font-mono font-bold text-slate-200 mt-0.5">{metaReport.width} x {metaReport.height}</p>
                    <span className="text-[10px] text-cyan-400">{metaReport.aspectRatio} Ratio</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">File Size</span>
                    <p className="text-sm font-mono font-bold text-slate-200 mt-0.5">{metaReport.fileSizeFormatted}</p>
                    <span className="text-[10px] text-slate-400">{(metaReport.fileSize).toLocaleString()} Bytes</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Shannon Entropy</span>
                    <p className="text-sm font-mono font-bold text-amber-400 mt-0.5">{metaReport.shannonEntropy}</p>
                    <span className="text-[10px] text-slate-400">bits / byte</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">LSB Stego Capacity</span>
                    <p className="text-sm font-mono font-bold text-emerald-400 mt-0.5">{metaReport.stegoCapacityFormatted}</p>
                    <span className="text-[10px] text-slate-400">Max Secret Payload</span>
                  </div>
                </div>

                {/* GPS Coordinates Alert (if available) */}
                {metaReport.gpsCoordinates && (
                  <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2 text-red-300">
                      <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                      <div>
                        <span className="font-bold text-red-400">Embedded GPS Geolocation Metadata Detected:</span>
                        <p className="text-[11px] text-slate-300">
                          Lat: {metaReport.gpsCoordinates.lat.toFixed(6)}, Lng: {metaReport.gpsCoordinates.lng.toFixed(6)}
                        </p>
                      </div>
                    </div>
                    <a
                      href={metaReport.gpsCoordinates.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 flex items-center gap-1"
                    >
                      <span>Open Map</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Raw Hex Header preview */}
                <div className="space-y-1">
                  <span className="text-xs font-mono font-semibold text-slate-400">Header Hex Dump (First 256 bytes):</span>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-400 break-all leading-tight max-h-20 overflow-y-auto">
                    {metaReport.hexPreview}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* EXIF Metadata Tag List & Chunks */}
          {metaReport && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tag table */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200 font-mono flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                    Discovered EXIF & Container Tags ({metaReport.exifTags.length})
                  </h3>
                  <div className="flex gap-1 text-[11px] font-mono">
                    {['All', 'Image', 'Camera', 'Software', 'Timestamps'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setMetaActiveCategory(cat)}
                        className={`px-2 py-0.5 rounded ${
                          metaActiveCategory === cat ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                        <th className="py-2 px-3">TAG NAME</th>
                        <th className="py-2 px-3">CATEGORY</th>
                        <th className="py-2 px-3">METADATA VALUE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {metaReport.exifTags
                        .filter((t) => metaActiveCategory === 'All' || t.category === metaActiveCategory)
                        .map((tag) => (
                          <tr key={tag.id} className="hover:bg-slate-800/30">
                            <td className="py-2 px-3 font-semibold text-slate-300">{tag.name}</td>
                            <td className="py-2 px-3">
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-950 border border-slate-800 text-slate-400">
                                {tag.category}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-cyan-300 break-all">{String(tag.value)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PNG Chunks / JPEG Markers */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-200 font-mono flex items-center gap-1.5">
                  <Binary className="w-4 h-4 text-purple-400" />
                  Format Chunks & Markers ({metaReport.rawChunks.length})
                </h3>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {metaReport.rawChunks.map((chunk, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-0.5">
                      <div className="flex items-center justify-between text-slate-200">
                        <span className="font-bold text-purple-300">{chunk.name}</span>
                        <span className="text-[10px] text-slate-500">{chunk.size.toLocaleString()} B</span>
                      </div>
                      {chunk.details && (
                        <p className="text-[11px] text-slate-400 truncate">{chunk.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RGB Bit-Plane Visualizer */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 font-mono flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  RGB Bit-Plane Steganography Decomposition (Bit 0 LSB &rarr; Bit 7 MSB)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inspect bit-planes to detect visual LSB noise, steganography patterns, or hidden data layers.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={bitPlaneChannel}
                  onChange={(e) => setBitPlaneChannel(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 rounded px-2.5 py-1"
                >
                  <option value="all">All RGB Channels</option>
                  <option value="red">Red Channel Only</option>
                  <option value="green">Green Channel Only</option>
                  <option value="blue">Blue Channel Only</option>
                </select>

                <button
                  onClick={handleGenerateBitPlanes}
                  disabled={isExtractingBitPlanes || !metaImageUrl}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs transition disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isExtractingBitPlanes ? 'Extracting Planes...' : 'Extract 8 Bit-Planes'}</span>
                </button>
              </div>
            </div>

            {bitPlanes.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-2">
                {bitPlanes.map((planeUrl, bIndex) => (
                  <div key={bIndex} className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-center space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-cyan-400">
                      Bit {bIndex} {bIndex === 0 ? '(LSB - Stego)' : bIndex === 7 ? '(MSB)' : ''}
                    </span>
                    <img src={planeUrl} alt={`Bit plane ${bIndex}`} className="w-full h-24 object-cover rounded border border-slate-800" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: IMAGE STEGO ENCRYPT & EMBED */}
      {/* ============================================================= */}
      {activeTab === 'stego-encode' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Carrier Setup & Secret Payload */}
          <div className="space-y-6">
            {/* Carrier Image Picker */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200 font-mono flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  1. Carrier Image Selection
                </h3>
                <span className="text-xs font-mono text-cyan-400">
                  {carrierDimensions.w} x {carrierDimensions.h} px
                </span>
              </div>

              <input
                ref={encodeFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCarrierFileSelect}
                className="hidden"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => encodeFileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 transition"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  Upload Custom Carrier Image
                </button>
                <button
                  onClick={generateDefaultSampleCarrier}
                  className="px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-400 transition"
                  title="Generate Cyber Carrier Sample"
                >
                  Use Sample
                </button>
              </div>

              {carrierImageUrl && (
                <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-center">
                  <img
                    src={carrierImageUrl}
                    alt="Carrier"
                    className="max-h-40 object-contain rounded border border-slate-800"
                  />
                </div>
              )}
            </div>

            {/* Secret Payload Input */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 font-mono flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                2. Secret Payload (To Hide Inside Pixels)
              </h3>

              <textarea
                rows={5}
                value={stegoSecretText}
                onChange={(e) => setStegoSecretText(e.target.value)}
                placeholder="Type your confidential message, API token, secret note, or JSON payload..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />

              {/* Encryption Passphrase Option */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5 font-mono text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="checkbox"
                    checked={useStegoPassword}
                    onChange={(e) => setUseStegoPassword(e.target.checked)}
                    className="accent-cyan-400"
                  />
                  <span className="font-semibold flex items-center gap-1 text-cyan-300">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    Encrypt Payload with AES-256-GCM before embedding
                  </span>
                </label>

                {useStegoPassword && (
                  <input
                    type="text"
                    value={stegoPassphrase}
                    onChange={(e) => setStegoPassphrase(e.target.value)}
                    placeholder="Enter AES encryption passphrase..."
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={handleEmbedStego}
                disabled={isEmbeddingStego || !carrierImageUrl}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs shadow-lg shadow-cyan-500/20 transition cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span>{isEmbeddingStego ? 'Embedding Bits into Pixels...' : 'Embed Secret into Image (LSB)'}</span>
              </button>

              {stegoEmbedError && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-xs font-mono text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{stegoEmbedError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Stego Result Preview & Export */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              3. Steganographic Output & Sharing
            </h3>

            {stegoResultDataUrl ? (
              <div className="space-y-4">
                {/* Stego Image Display */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-2">
                  <img
                    src={stegoResultDataUrl}
                    alt="Stego Result"
                    className="max-h-64 object-contain rounded border border-cyan-500/30 shadow-lg"
                  />
                  <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Lossless PNG Steganography Image Ready
                  </span>
                </div>

                {/* Capacity Stats */}
                {stegoEmbedStats && (
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span>Payload Size:</span>
                      <span className="font-bold text-cyan-300">{stegoEmbedStats.bytesUsed} Bytes</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Total Pixel Capacity:</span>
                      <span className="text-slate-400">{(stegoEmbedStats.totalCapacityBytes / 1024).toFixed(1)} KB</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Capacity Utilization:</span>
                      <span className="font-bold text-emerald-400">{stegoEmbedStats.capacityPercent}%</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Cipher Status:</span>
                      <span className="text-amber-300">
                        {stegoEmbedStats.isEncrypted ? 'AES-256-GCM Protected' : 'Plaintext LSB'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleDownloadStegoImage}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-semibold border border-slate-700 transition"
                  >
                    <Download className="w-4 h-4 text-cyan-400" />
                    Download Stego PNG
                  </button>
                  <button
                    onClick={handleSendToDecoder}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition shadow-md"
                  >
                    <Share2 className="w-4 h-4" />
                    Send to Decoder Tab
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2 text-slate-500 font-mono text-xs">
                <ImageIcon className="w-8 h-8 text-slate-600 mx-auto" />
                <p>Configure carrier image and secret payload on the left to generate steganographic output.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 4: IMAGE STEGO DECRYPT & EXTRACT */}
      {/* ============================================================= */}
      {activeTab === 'stego-decode' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input Stego Image & Passphrase */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 font-mono flex items-center gap-2">
              <Unlock className="w-4 h-4 text-cyan-400" />
              1. Stego Image Input & Passphrase
            </h3>

            <input
              ref={decodeFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleDecodeFileSelect}
              className="hidden"
            />

            <div
              onClick={() => decodeFileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 bg-slate-950/60 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
            >
              <Upload className="w-7 h-7 text-cyan-400" />
              <p className="text-xs text-slate-300 font-mono">
                <span className="text-cyan-400 font-bold underline underline-offset-2">Click to select Stego Image</span> or drop here
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                Supports Lossless PNG and bitmap steganographic carrier images
              </p>
            </div>

            {decodeImageUrl && (
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-center">
                <img
                  src={decodeImageUrl}
                  alt="Stego to decode"
                  className="max-h-44 object-contain rounded border border-slate-800"
                />
              </div>
            )}

            {/* Passphrase Input */}
            <div className="space-y-1.5 font-mono text-xs">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Decryption Passphrase (if password-protected):
              </label>
              <input
                type="text"
                value={decodePassphrase}
                onChange={(e) => setDecodePassphrase(e.target.value)}
                placeholder="Enter passphrase..."
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              onClick={handleExtractStego}
              disabled={isDecodingStego || !decodeImageUrl}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold font-mono text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <Unlock className="w-4 h-4" />
              <span>{isDecodingStego ? 'Scanning LSB Pixels...' : 'Extract & Decrypt Hidden Secret'}</span>
            </button>
          </div>

          {/* Right: Extracted Output */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 font-mono flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              2. Extracted Hidden Payload
            </h3>

            {decodeResult ? (
              <div className="space-y-4">
                {decodeResult.success ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{decodeResult.message}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-mono text-slate-400">Decoded Plaintext:</span>
                      <textarea
                        readOnly
                        rows={8}
                        value={decodeResult.extractedText}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-cyan-300 focus:outline-none"
                      />
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-[11px] font-mono text-slate-400">
                      <div className="flex justify-between">
                        <span>Payload Length:</span>
                        <span className="text-slate-200 font-bold">{decodeResult.payloadLength} Bytes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Encryption Status:</span>
                        <span className="text-emerald-400">
                          {decodeResult.isEncrypted ? 'AES-GCM Authenticated' : 'Plaintext LSB'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Diagnostics:</span>
                        <span className="text-slate-300">{decodeResult.diagnostics}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 text-xs font-mono text-red-300 space-y-2">
                    <div className="font-bold flex items-center gap-1.5 text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      Steganography Extraction Failed
                    </div>
                    <p>{decodeResult.message}</p>
                    <p className="text-[11px] text-slate-400">{decodeResult.diagnostics}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2 text-slate-500 font-mono text-xs">
                <Lock className="w-8 h-8 text-slate-600 mx-auto" />
                <p>Upload a stego image on the left and click Extract to inspect hidden contents.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
