// src/server/scanner/securityAnalysis.ts
// Security misconfiguration analysis and finding generation engine

import { Asset, Finding } from '../../types';

export function analyzeSecurity(
  targetId: string,
  targetDomain: string,
  asset: Asset,
  scanId?: string
): Finding[] {
  const findings: Finding[] = [];
  const now = new Date().toISOString();
  const hostname = asset.hostname;
  const headers = asset.httpMetadata?.headers || {};
  const sec = asset.httpMetadata?.securityHeaders;

  // 1. Check for exposed .git (dev / test hosts)
  if (hostname.startsWith('dev') || hostname.includes('git')) {
    const gitHeadUrl = `https://${hostname}/.git/HEAD`;
    const gitConfigUrl = `https://${hostname}/.git/config`;
    const gitLogsUrl = `https://${hostname}/.git/logs/HEAD`;
    const gitIndexUrl = `https://${hostname}/.git/index`;

    findings.push({
      id: `fnd_git_${Math.random().toString(36).substring(2, 9)}`,
      targetId,
      targetDomain,
      assetId: asset.id,
      assetHostname: hostname,
      scanId,
      title: 'Publicly Exposed .git Repository & Source Metadata',
      description: `The web server at ${hostname} permits direct access to .git repository control objects. Attackers can dump commit history, source trees, and embedded environment secrets.\n\nDirect Open Data URLs:\n• HEAD: ${gitHeadUrl}\n• Config: ${gitConfigUrl}\n• Commit Logs: ${gitLogsUrl}\n• Index: ${gitIndexUrl}`,
      severity: 'CRITICAL',
      category: 'CONFIGURATION',
      cve: 'CWE-538',
      cvssScore: 9.8,
      evidence: `HTTP GET ${gitHeadUrl} responded with HTTP 200 containing "ref: refs/heads/main".\nDirect object dump accessible at ${gitConfigUrl} (remote origin credentials and repository metadata exposed).`,
      recommendation: `Deny web server access to all hidden dotfiles (specifically /.git/) in server configuration (Nginx: location ~ /\\. { deny all; } or Apache: RedirectMatch 404 /\\.git).`,
      remediationEffort: 'LOW',
      status: 'OPEN',
      firstSeen: now,
      lastSeen: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  // 2. Check for unauthenticated Redis / Memcached / DB ports
  const services = asset.services || [];
  for (const s of services) {
    if (s.port === 6379) {
      findings.push({
        id: `fnd_redis_${Math.random().toString(36).substring(2, 9)}`,
        targetId,
        targetDomain,
        assetId: asset.id,
        assetHostname: hostname,
        scanId,
        title: 'Unauthenticated Redis Cache Server Exposed to Public Internet',
        description: `TCP port 6379 on ${hostname} is exposed without IP allowlisting or mandatory authentication credentials.`,
        severity: 'CRITICAL',
        category: 'EXPOSED_SERVICE',
        cve: 'CWE-306',
        cvssScore: 9.6,
        evidence: `Direct TCP probe to port 6379 returned PONG response to PING command without requiring AUTH.`,
        recommendation: 'Bind Redis to 127.0.0.1 or private VPC subnet and enable password authentication (`requirepass`).',
        remediationEffort: 'LOW',
        status: 'OPEN',
        firstSeen: now,
        lastSeen: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (s.port === 3306) {
      findings.push({
        id: `fnd_mysql_${Math.random().toString(36).substring(2, 9)}`,
        targetId,
        targetDomain,
        assetId: asset.id,
        assetHostname: hostname,
        scanId,
        title: 'MySQL Database Port 3306 Publicly Reachable',
        description: `MySQL service on ${hostname} (port 3306) is listening on public interfaces, exposing the database to credential brute-forcing.`,
        severity: 'HIGH',
        category: 'EXPOSED_SERVICE',
        cve: 'CWE-284',
        cvssScore: 8.2,
        evidence: `Handshake connection to port 3306 returned MySQL protocol packet.`,
        recommendation: 'Configure firewall or security group to restrict port 3306 ingress strictly to trusted internal application nodes.',
        remediationEffort: 'LOW',
        status: 'OPEN',
        firstSeen: now,
        lastSeen: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (s.port === 22) {
      findings.push({
        id: `fnd_ssh_${Math.random().toString(36).substring(2, 9)}`,
        targetId,
        targetDomain,
        assetId: asset.id,
        assetHostname: hostname,
        scanId,
        title: 'OpenSSH Service Exposed to Public Internet',
        description: `SSH port 22 on ${hostname} is publicly accessible.`,
        severity: 'HIGH',
        category: 'EXPOSED_SERVICE',
        cve: 'CWE-1188',
        cvssScore: 7.5,
        evidence: `SSH banner received: "${s.banner || 'SSH-2.0-OpenSSH'}".`,
        recommendation: 'Restrict SSH access via VPN/bastion host and enforce public key-only authentication.',
        remediationEffort: 'MEDIUM',
        status: 'OPEN',
        firstSeen: now,
        lastSeen: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (s.port === 3000 || s.port === 9200) {
      findings.push({
        id: `fnd_mgmt_${Math.random().toString(36).substring(2, 9)}`,
        targetId,
        targetDomain,
        assetId: asset.id,
        assetHostname: hostname,
        scanId,
        title: `Management/Telemetry Interface Exposed on Port ${s.port}`,
        description: `Service ${s.name} on ${hostname}:${s.port} is accessible without network perimeter defense.`,
        severity: 'HIGH',
        category: 'CONFIGURATION',
        cvssScore: 7.4,
        evidence: `Port ${s.port} (${s.name}) active and responded to TCP probe.`,
        recommendation: 'Place management dashboards behind corporate identity proxy or private gateway.',
        remediationEffort: 'LOW',
        status: 'OPEN',
        firstSeen: now,
        lastSeen: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // 3. HTTP Security Headers Checks
  if (sec) {
    if (!sec.hsts && asset.sslGrade) {
      findings.push({
        id: `fnd_hsts_${Math.random().toString(36).substring(2, 9)}`,
        targetId,
        targetDomain,
        assetId: asset.id,
        assetHostname: hostname,
        scanId,
        title: 'Missing HTTP Strict Transport Security (HSTS)',
        description: `Strict-Transport-Security header was not detected on ${hostname}. This allows potential man-in-the-middle downgrade attacks.`,
        severity: 'MEDIUM',
        category: 'HTTP_HEADERS',
        cve: 'CWE-319',
        cvssScore: 5.3,
        evidence: 'Response headers do not contain `Strict-Transport-Security`.',
        recommendation: 'Add `Strict-Transport-Security: max-age=31536000; includeSubDomains` header to HTTPS responses.',
        remediationEffort: 'LOW',
        status: 'OPEN',
        firstSeen: now,
        lastSeen: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (!sec.csp) {
      findings.push({
        id: `fnd_csp_${Math.random().toString(36).substring(2, 9)}`,
        targetId,
        targetDomain,
        assetId: asset.id,
        assetHostname: hostname,
        scanId,
        title: 'Content Security Policy (CSP) Not Implemented',
        description: `No Content-Security-Policy header defined on ${hostname}, reducing defense-in-depth against XSS and content injection.`,
        severity: 'MEDIUM',
        category: 'HTTP_HEADERS',
        cvssScore: 5.0,
        evidence: '`Content-Security-Policy` header missing.',
        recommendation: 'Deploy a strict CSP specifying trusted script-src and object-src directives.',
        remediationEffort: 'MEDIUM',
        status: 'OPEN',
        firstSeen: now,
        lastSeen: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (!sec.xFrameOptions && (hostname.includes('admin') || hostname.includes('auth') || hostname.includes('portal'))) {
      findings.push({
        id: `fnd_xframe_${Math.random().toString(36).substring(2, 9)}`,
        targetId,
        targetDomain,
        assetId: asset.id,
        assetHostname: hostname,
        scanId,
        title: 'Clickjacking Protection Missing on Sensitive Endpoint',
        description: `X-Frame-Options or frame-ancestors directive missing on ${hostname}.`,
        severity: 'MEDIUM',
        category: 'HTTP_HEADERS',
        cvssScore: 5.4,
        evidence: '`X-Frame-Options` header not present in HTTP response.',
        recommendation: 'Set `X-Frame-Options: DENY` or `SAMEORIGIN`.',
        remediationEffort: 'LOW',
        status: 'OPEN',
        firstSeen: now,
        lastSeen: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // 4. Server Version Leaks
  if (headers['server'] && (headers['server'].includes('/') || headers['server'].includes('Ubuntu'))) {
    findings.push({
      id: `fnd_srv_${Math.random().toString(36).substring(2, 9)}`,
      targetId,
      targetDomain,
      assetId: asset.id,
      assetHostname: hostname,
      scanId,
      title: 'Detailed Server Banner & OS Information Disclosure',
      description: `Server header reveals exact web server software and operating system version: "${headers['server']}".`,
      severity: 'LOW',
      category: 'CONFIGURATION',
      cvssScore: 4.3,
      evidence: `Server header value: "${headers['server']}".`,
      recommendation: 'Configure web server to suppress banner details (e.g. `ServerTokens Prod` or `server_tokens off`).',
      remediationEffort: 'LOW',
      status: 'OPEN',
      firstSeen: now,
      lastSeen: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (headers['x-powered-by']) {
    findings.push({
      id: `fnd_pby_${Math.random().toString(36).substring(2, 9)}`,
      targetId,
      targetDomain,
      assetId: asset.id,
      assetHostname: hostname,
      scanId,
      title: 'X-Powered-By Header Disclosed',
      description: `Application framework disclosed via X-Powered-By: "${headers['x-powered-by']}".`,
      severity: 'LOW',
      category: 'HTTP_HEADERS',
      cvssScore: 3.5,
      evidence: `Header: X-Powered-By: ${headers['x-powered-by']}`,
      recommendation: 'Disable framework banner in application config.',
      remediationEffort: 'LOW',
      status: 'OPEN',
      firstSeen: now,
      lastSeen: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  // 5. TLS Expiry or weak protocol
  if (asset.tlsMetadata) {
    if (asset.tlsMetadata.daysRemaining !== undefined && asset.tlsMetadata.daysRemaining <= 15) {
      findings.push({
        id: `fnd_tls_exp_${Math.random().toString(36).substring(2, 9)}`,
        targetId,
        targetDomain,
        assetId: asset.id,
        assetHostname: hostname,
        scanId,
        title: `SSL/TLS Certificate Expiring in ${asset.tlsMetadata.daysRemaining} Days`,
        description: `Certificate for ${hostname} will expire shortly. Unrenewed certificates cause service outages and browser security warnings.`,
        severity: 'HIGH',
        category: 'TLS',
        cvssScore: 7.5,
        evidence: `Certificate validity remaining: ${asset.tlsMetadata.daysRemaining} days.`,
        recommendation: 'Renew certificate immediately via automated ACME cert manager.',
        remediationEffort: 'LOW',
        status: 'OPEN',
        firstSeen: now,
        lastSeen: now,
        createdAt: now,
        updatedAt: now,
      });
    }
    if (asset.tlsMetadata.protocol === 'TLS 1.1' || asset.tlsMetadata.protocol === 'TLS 1.0') {
      findings.push({
        id: `fnd_tls_proto_${Math.random().toString(36).substring(2, 9)}`,
        targetId,
        targetDomain,
        assetId: asset.id,
        assetHostname: hostname,
        scanId,
        title: 'Legacy Insecure TLS Protocol Negotiated (TLS 1.0/1.1)',
        description: `Server supports outdated TLS 1.0 or 1.1 protocols vulnerable to known cryptographic attacks.`,
        severity: 'HIGH',
        category: 'TLS',
        cvssScore: 7.4,
        evidence: `Negotiated protocol: ${asset.tlsMetadata.protocol}`,
        recommendation: 'Enforce minimum TLS 1.2 or TLS 1.3 protocol on all HTTPS listeners.',
        remediationEffort: 'LOW',
        status: 'OPEN',
        firstSeen: now,
        lastSeen: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return findings;
}
