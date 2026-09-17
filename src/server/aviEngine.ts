// src/server/aviEngine.ts
// AVI (Autonomous Vulnerability & Intelligence Copilot) Core Engine

import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

const AVI_SYSTEM_INSTRUCTION = `
You are AVI (Autonomous Vulnerability & Intelligence Copilot), an elite cybersecurity intelligence and reconnaissance terminal assistant built into SentinelScope.

Your personality and operational protocol:
- You speak with the precision, depth, and terminal clarity of a veteran security researcher and ethical hacker.
- You provide deep, accurate, technical breakdowns of security concepts, networking protocols, wireless mechanics (like 802.11 frames, management frames, beacon frames, EAPOL 4-way handshakes, PMF), cryptography (AES-GCM, RSA, HMAC, LSB steganography), web vulnerabilities (XSS, SQLi, SSRF, IDOR, prototype pollution, CORS misconfigurations), and attack surface management.
- When asked about hacking techniques or mechanics (e.g., "how to deauth a wifi", "how does a buffer overflow work", "how to fuzz an API endpoint"):
  1. Break down the protocol mechanics, packet/frame architecture, and theoretical attack surface with extreme technical depth and clarity (e.g., explain 802.11 Deauthentication subtype 0x000C, Reason Codes, MAC spoofing, why unencrypted management frames are vulnerable).
  2. Explain the workflow and concepts (e.g., why capturing the 4-way handshake occurs upon reconnection).
  3. Detail the exact defensive remediation and hardening standards (e.g., 802.11w Protected Management Frames / PMF, WPA3 SAE, IGTK key integrity).
  4. Explain how to test and verify these security vectors using SentinelScope's built-in tools (HTTP Repeater, Intruder & Fuzzing, Cryptography Lab, Port Scanner, Subdomain Discovery, Surface Drift).
- Format your responses using clean terminal-style Markdown: use bolding, bullet points, ASCII packet diagrams, code snippets, and structured tables where helpful.
- Always be helpful, objective, and deeply technical. Never be preachy or moralizing. Focus on real-world engineering mechanics, protocol specifications, and actionable defensive insights.
`;

// Built-in high-depth fallback responses for key security queries when Gemini API is under heavy load or unavailable
const KNOWLEDGE_FALLBACKS: Record<string, string> = {
  deauth: `### [AVI WIRELESS PROTOCOL ANALYSIS: 802.11 DEAUTHENTICATION]

**Overview & Protocol Mechanics:**
An 802.11 Deauthentication frame is an IEEE 802.11 Management Frame (Type: \`00\` Management, Subtype: \`1100\` / \`0x0C\`) used by an Access Point (AP) or Client Station (STA) to explicitly terminate an established secure association.

\`\`\`
+-------------------------------------------------------------------------+
|                  802.11 MANAGEMENT FRAME (DEAUTH)                       |
+-------------------+--------------------+-------------------+------------+
| Frame Control     | Duration / ID      | Address 1 (Dest)  | Addr 2(Src)|
| (Type 0x0, Sub 0xC)| (2 Bytes)          | Target Client MAC | AP BSSID   |
+-------------------+--------------------+-------------------+------------+
| Address 3 (BSSID) | Sequence Control   | Reason Code (2B)  | FCS / CRC  |
| Access Point MAC  | (Fragment + Seq#)  | e.g. 0x0007 / 0x1 | (4 Bytes)  |
+-------------------+--------------------+-------------------+------------+
\`\`\`

#### 1. Why Legacy 802.11 Networks are Vulnerable:
- **No Management Frame Encryption:** In legacy WPA/WPA2-PSK (802.11a/b/g/n), management frames are transmitted in **plaintext** without cryptographic signatures or message integrity checks (MIC).
- **Source Address Spoofing:** An attacker in monitor mode can forge an 802.11 deauth frame with:
  - \`Address 1 (Destination)\` = Target device MAC or Broadcast (\`FF:FF:FF:FF:FF:FF\`)
  - \`Address 2 (Source)\` = Access Point BSSID
  - \`Address 3 (BSSID)\` = Access Point BSSID
  - \`Reason Code\` = \`7\` (*Class 3 frame received from nonassociated station*) or \`1\` (*Unspecified reason*).
- When the receiving STA processes this unauthenticated frame, the station firmware immediately tears down the association.

#### 2. The Attacker's Objective (Handshake Capture):
- When the disconnected client automatically attempts reconnection, it initiates the **EAPOL 4-Way Handshake** (Messages 1 to 4: Anonce, Snonce + MIC).
- The attacker captures Message 1 & 2 containing the random nonces to perform an offline dictionary/brute-force attack against the pairwise master key (PMK = \`PBKDF2(HMAC-SHA1, Passphrase, SSID, 4096, 256)\`).

#### 3. Defensive Countermeasures & Hardening:
- **IEEE 802.11w (Protected Management Frames - PMF):**
  - Introduces cryptographic protection for Unicast management frames via CCMP/GCMP.
  - Adds the **BIP (Broadcast Integrity Protocol)** using the **IGTK (Integrity Group Temporal Key)** with AES-128-CMAC to verify broadcast/multicast management frames.
  - Deauth frames without a valid CMAC signature are dropped silently by stations.
- **WPA3-Personal (SAE - Simultaneous Authentication of Equals):**
  - **Mandates 802.11w PMF** by default.
  - Uses Dragonfly key exchange (immune to offline dictionary attacks even if frames are inspected).

#### 4. Testing with SentinelScope Tools:
- Test PBKDF2 key entropy and brute-force complexity in the **Crypto & Stego Lab** (AES/PBKDF2 engine).
- Inspect API endpoints and network services exposed on wireless gateways using **Port Scanner & Subdomain Recon**.`,

  tools: `### [AVI TERMINAL: SENTINEL-SCOPE CAPABILITY MATRIX]

SentinelScope provides an integrated offensive reconnaissance & defensive audit suite:

1. **Dashboard & Surface Overview**: Real-time asset inventory, risk scores, CVE severity trackers, and exposure charts.
2. **Attack Surface Discovery**: Subdomain enum, safe DNS probing, ASN tracking, reverse-IP mapping, and cloud bucket discovery.
3. **HTTP Repeater (Burp-style)**: Craft custom raw HTTP/1.1 requests, inspect raw headers, response bodies, latency, and status codes.
4. **HTTP Intruder & Fuzzer**: High-speed parameter fuzzing, directory brute-forcing, Snipper/ClusterBomb payload attacks.
5. **Crypto & Steganography Lab**:
   - Multi-algorithm cipher suite (AES-256-GCM, AES-CBC, RSA-2048 OAEP, XOR, Caesar/ROT13).
   - Image EXIF forensic metadata extractor with GPS coordinates and Shannon entropy.
   - LSB 8-bit image steganography embedder and decoder.
6. **Live Traffic Interceptor**: Real-time HTTP log streaming with payload extraction, methods, latency, and status filters.
7. **Interactive Risk Graph**: Force-directed D3 visualization of targets, exposed services, subdomains, and attack paths.
8. **Executive PDF/JSON Reports**: One-click vulnerability compliance documentation.`,

  crypto: `### [AVI CRYPTOGRAPHIC PROTOCOL ANALYSIS: CIPHER SUITES & SECURITY]

**Comparison of Core Symmetric & Asymmetric Mechanisms:**

#### 1. AES-256-GCM (Galois/Counter Mode - AEAD)
- **Mechanism**: Combines Counter mode (CTR) for confidentiality with Galois Message Authentication Code (GMAC) over GF(2^128) for authenticity and integrity.
- **Security**: Resistant to bit-flipping and padding oracle attacks because ciphertext tampering causes immediate authentication tag verification failure.
- **Nonce Rule**: Never reuse an IV/Nonce with the same key. IV reuse allows XOR extraction of plaintext deltas.

#### 2. AES-256-CBC (Cipher Block Chaining)
- **Mechanism**: Each plaintext block is XORed with the previous ciphertext block before encryption (Block 0 is XORed with IV).
- **Vulnerability**: Without an HMAC (Encrypt-then-MAC), CBC is susceptible to **Padding Oracle Attacks** (Vaudenay) and Chosen Ciphertext Bit-Flipping.

#### 3. RSA-2048 (Asymmetric Public Key)
- **Mechanism**: Security is founded on the computational hardness of factoring large semiprime integers ($N = p \\times q$).
- **Padding Scheme**: Always use **OAEP (Optimal Asymmetric Encryption Padding)** to prevent Bleichenbacher chosen-ciphertext attacks.

#### 4. Testing in SentinelScope:
- Use the **Crypto & Stego Lab** to test real-time AES-256-GCM encryption, decrypt ciphertext, inspect authentication tags, or benchmark RSA key generation.`,

  stego: `### [AVI FORENSIC ANALYSIS: LSB STEGANOGRAPHY & ENTROPY]

**Least Significant Bit (LSB) Mechanics:**
LSB steganography replaces the least significant bit (Bit 0) of RGB pixel byte values ($0-255$) with binary bits from a secret payload.

\`\`\`
Original Byte:  1101011[0]  --> Replaced Bit 0 with Payload Bit [1]
Resulting Byte: 1101011[1]  (Color difference: 1/255 = 0.39%, imperceptible)
\`\`\`

#### Detection Vectors & Statistical Analysis:
1. **Shannon Entropy**: Normal compressed images have specific entropy distribution curves ($7.2 - 7.8$ bits/byte). Unencrypted or high-entropy payload injection creates anomalies.
2. **Chi-Square ($\\chi^2$) Sample Pair Analysis**: Detects artificial equalization of adjacent PoVs (Pairs of Values: $2k$ and $2k+1$).
3. **Bit-Plane Slicing**: Inspecting Bit Plane 0 isolates noise patterns containing structured text or file headers.

#### Verification in SentinelScope:
- Navigate to **Crypto & Stego Lab** > **Stego & EXIF Tab** to upload images, extract hidden LSB text, examine EXIF metadata (GPS coords, Camera make), and calculate Shannon entropy.`,

  fuzz: `### [AVI RECON & EXPLOITATION: HTTP INTRUDER FUZZING STRATEGY]

**Attack Types in SentinelScope HTTP Intruder:**

1. **Sniper Mode**:
   - Iterates through payload positions one by one.
   - Best for: Query parameter SQLi probes, XSS fuzzing, or single-variable injection.

2. **Battering Ram Mode**:
   - Injects the identical payload into all selected positions simultaneously.
   - Best for: Testing redundant parameter reflection or cross-header verification.

3. **Pitchfork Mode**:
   - Uses multiple payload wordlists simultaneously in lockstep (Position 1 gets List 1 item $n$, Position 2 gets List 2 item $n$).
   - Best for: Known credential pairs or paired token validation.

4. **Cluster Bomb Mode**:
   - Cartesian product of all wordlists (every permutation of List 1 $\\times$ List 2).
   - Best for: Exhaustive brute forcing of user/password matrices or multi-variable bypasses.

#### Key Metrics to Track:
- **Response Status**: Look for status codes changing from \`403\`/\`401\` to \`200\` or \`500\` (revealing unhandled exceptions).
- **Content-Length Variance**: Anomalous byte lengths indicate differential application execution branches.
- **Latency Spikes**: Time delays (>5000ms) signify Time-based Blind SQLi (\`pg_sleep()\`, \`BENCHMARK()\`).`,

  sql: `### [AVI VULNERABILITY MECHANICS: SQL INJECTION (SQLi)]

**Root Cause:** Dynamic concatenation of untrusted user input directly into SQL statement interpreters.

#### 1. Primary Classification:
- **In-Band / Union-Based**: Attacker injects \`UNION SELECT NULL, username, password FROM users--\` to extract data directly in HTTP response bodies.
- **Error-Based**: Exploits database engine error messages (e.g. \`CAST(@@version AS int)\`) to leak data in verbose debug messages.
- **Blind (Boolean / Time-Based)**: Infers data one bit at a time using conditional delays:
  \`' OR (SELECT CASE WHEN (1=1) THEN pg_sleep(5) ELSE pg_sleep(0) END)--\`

#### 2. Remediation & Hardening:
- **Parameterized Queries / Prepared Statements**: Enforces strict separation between SQL code instructions and untrusted data tokens.
- **Object-Relational Mapping (ORM)**: Use Drizzle, Prisma, or Hibernate with bound parameters.
- **Least Privilege Principle**: Ensure database users running web applications lack \`DROP\`, \`ALTER\`, or superuser administrative privileges.`,

  xss: `### [AVI VULNERABILITY MECHANICS: CROSS-SITE SCRIPTING (XSS)]

**Overview:** Injection of malicious client-side JavaScript executed within the victim's authenticated browser origin.

#### 1. Variants:
- **Stored XSS (Persistent)**: Malicious payload stored in database (e.g. comments, profiles) and served to all subsequent visitors.
- **Reflected XSS (Non-Persistent)**: Payload reflected immediately off web server in search results or error pages.
- **DOM-Based XSS**: Vulnerability exists solely in client-side script parsing untrusted sources (\`location.hash\`, \`document.referrer\`) into execution sinks (\`innerHTML\`, \`eval()\`, \`document.write()\`).

#### 2. Defense-in-Depth:
- **Context-Aware Output Encoding**: HTML entity encode, attribute encode, and JavaScript string escape.
- **Content Security Policy (CSP)**: Implement \`Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-RANDOM'\` to disable inline script execution.
- **HttpOnly Cookies**: Protect session cookies against \`document.cookie\` exfiltration.`,

  ssrf: `### [AVI VULNERABILITY MECHANICS: SERVER-SIDE REQUEST FORGERY (SSRF)]

**Overview:** The backend server fetches a remote resource based on a user-supplied URL without adequate host validation.

#### 1. High-Risk Targets:
- **Cloud Metadata Services**: \`http://169.254.169.254/latest/meta-data/iam/security-credentials/\` (AWS/GCP/Azure)
- **Internal Microservices**: \`http://127.0.0.1:8080/admin\`, \`http://internal.consul/\`

#### 2. Defense & Hardening:
- **Strict Allowlisting**: Validate protocols (\`https://\` only) and domain whitelist.
- **DNS Resolution Pinning**: Resolve IP before connection to prevent DNS Rebinding attacks.
- **IMDSv2 Enforcement**: In cloud deployments, mandate session-oriented token headers (\`X-aws-ec2-metadata-token\`).`,
};

export async function processAviQuery(
  prompt: string,
  history: Array<{ role: 'user' | 'model'; content: string }> = []
): Promise<{ text: string; source: 'gemini' | 'offline_knowledge' }> {
  const queryLower = prompt.toLowerCase();

  const ai = getAIClient();
  if (ai) {
    // Model fallback sequence using currently supported modern models
    const candidateModels = ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.1-flash-lite'];

    const contents = [
      ...history.slice(-6).map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ];

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: AVI_SYSTEM_INSTRUCTION,
            temperature: 0.7,
          },
        });

        if (response.text && response.text.trim().length > 0) {
          return { text: response.text, source: 'gemini' };
        }
      } catch (err: any) {
        // Silently try next candidate model on 503/404/429 or fallback to knowledge base
        continue;
      }
    }
  }

  // Seamless fallback to high-depth local security intelligence matrix
  for (const [key, answer] of Object.entries(KNOWLEDGE_FALLBACKS)) {
    if (queryLower.includes(key)) {
      return { text: answer, source: 'offline_knowledge' };
    }
  }

  // Keyword matchers for broad topics
  if (queryLower.includes('wifi') || queryLower.includes('wireless') || queryLower.includes('802.11') || queryLower.includes('handshake')) {
    return { text: KNOWLEDGE_FALLBACKS.deauth, source: 'offline_knowledge' };
  }

  if (queryLower.includes('tool') || queryLower.includes('help') || queryLower.includes('guide') || queryLower.includes('what can you do')) {
    return { text: KNOWLEDGE_FALLBACKS.tools, source: 'offline_knowledge' };
  }

  if (queryLower.includes('encrypt') || queryLower.includes('cipher') || queryLower.includes('aes') || queryLower.includes('rsa')) {
    return { text: KNOWLEDGE_FALLBACKS.crypto, source: 'offline_knowledge' };
  }

  if (queryLower.includes('stego') || queryLower.includes('exif') || queryLower.includes('lsb') || queryLower.includes('entropy')) {
    return { text: KNOWLEDGE_FALLBACKS.stego, source: 'offline_knowledge' };
  }

  if (queryLower.includes('fuzz') || queryLower.includes('intruder') || queryLower.includes('payload') || queryLower.includes('wordlist')) {
    return { text: KNOWLEDGE_FALLBACKS.fuzz, source: 'offline_knowledge' };
  }

  if (queryLower.includes('sql') || queryLower.includes('sqli') || queryLower.includes('database injection')) {
    return { text: KNOWLEDGE_FALLBACKS.sql, source: 'offline_knowledge' };
  }

  if (queryLower.includes('xss') || queryLower.includes('cross site') || queryLower.includes('script injection')) {
    return { text: KNOWLEDGE_FALLBACKS.xss, source: 'offline_knowledge' };
  }

  if (queryLower.includes('ssrf') || queryLower.includes('metadata') || queryLower.includes('169.254')) {
    return { text: KNOWLEDGE_FALLBACKS.ssrf, source: 'offline_knowledge' };
  }

  return {
    text: `### [AVI SECURITY TERMINAL RESPONSE]

**Query:** \`${prompt}\`

**Technical Assessment:**
To investigate and audit this target or security mechanism within SentinelScope:

1. **Protocol / Attack Vector Analysis**:
   - Check authentication headers and encryption ciphers using the **Crypto & Stego Lab**.
   - Verify if any unencrypted transmission vectors exist in raw requests via **HTTP Repeater**.
2. **Automated Fuzzing & Parameter Discovery**:
   - Run active wordlists against API endpoints in **HTTP Intruder & Fuzzing**.
3. **Attack Surface & Port Mapping**:
   - Scan target domains or IP ranges in **Attack Surface Discovery** to map open listening daemons and SSL certificate chains.

*Tip: Type \`/deauth\`, \`/crypto\`, \`/fuzz\`, \`/tools\`, or ask about any security vector (e.g. \`wifi deauth\`, \`aes-gcm\`, \`sql injection\`, \`steganography\`, \`ssrf\`, \`xss\`) for dedicated protocol breakdowns.*`,
    source: 'offline_knowledge',
  };
}

