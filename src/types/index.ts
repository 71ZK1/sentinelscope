// src/types/index.ts
// Core domain interfaces for SentinelScope Attack Surface Management

export type Role = 'ADMIN' | 'ANALYST' | 'AUDITOR' | 'VIEWER';

export type TargetStatus = 'HEALTHY' | 'SCANNING' | 'ERROR' | 'IDLE';

export type ScanStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type AssetType =
  | 'ROOT_DOMAIN'
  | 'SUBDOMAIN'
  | 'IP_HOST'
  | 'API_ENDPOINT'
  | 'CLOUD_SERVICE'
  | 'MAIL_SERVER';

export type AssetStatus = 'LIVE' | 'UNRESPONSIVE' | 'FILTERED';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type FindingCategory =
  | 'TLS'
  | 'HTTP_HEADERS'
  | 'EXPOSED_SERVICE'
  | 'CONFIGURATION'
  | 'TECHNOLOGY_RISK'
  | 'DNS'
  | 'INFORMATIONAL';

export type FindingStatus = 'OPEN' | 'IN_PROGRESS' | 'ACKNOWLEDGED' | 'RESOLVED' | 'FALSE_POSITIVE';

export type ChangeType =
  | 'NEW_ASSET'
  | 'REMOVED_ASSET'
  | 'NEW_PORT'
  | 'CLOSED_PORT'
  | 'TECH_CHANGE'
  | 'NEW_FINDING'
  | 'RESOLVED_FINDING'
  | 'CERT_CHANGED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserAuditLog {
  id: string;
  userId?: string;
  userName: string;
  userEmail: string;
  ipAddress: string;
  action: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'REGISTRATION' | 'LOGOUT' | 'TARGET_CREATE' | 'TARGET_DELETE' | 'SCAN_INITIATE' | string;
  status: 'SUCCESS' | 'FAILURE';
  timestamp: string;
  userAgent?: string;
  details?: string;
  targetDomain?: string;
}

export interface Target {
  id: string;
  userId: string;
  domain: string;
  name?: string;
  status: TargetStatus;
  riskScore: number;
  riskLevel: 'LOW' | 'GUARDED' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  isAuthorized: boolean;
  authorizedAt: string;
  authorizedBy: string;
  rateLimit: number;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  subdomainCount?: number;
  liveHostCount?: number;
  findingsCount?: number;
  lastScanAt?: string;
}

export interface ScanEvent {
  id: string;
  scanId: string;
  stage: string;
  message: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  timestamp: string;
}

export interface Scan {
  id: string;
  targetId: string;
  targetDomain: string;
  userId: string;
  status: ScanStatus;
  scanType: 'FULL_RECON' | 'PASSIVE_DNS' | 'QUICK_PORT' | 'WEB_PROBE';
  progress: number;
  currentStage: string;
  startedAt?: string;
  completedAt?: string;
  durationSeconds: number;
  assetsFound: number;
  findingsCount: number;
  riskScoreDelta: number;
  logs: ScanEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface IPAddress {
  id: string;
  assetId: string;
  ip: string;
  version: 'IPv4' | 'IPv6';
  asn?: string;
  organization?: string;
  country?: string;
  countryCode?: string;
  isCdn?: boolean;
  reverseDns?: string;
  createdAt: string;
}

export interface Service {
  id: string;
  assetId: string;
  port: number;
  protocol: 'TCP' | 'UDP';
  name: string;
  product?: string;
  version?: string;
  banner?: string;
  tlsEnabled: boolean;
  state: 'OPEN' | 'FILTERED' | 'CLOSED';
  firstSeen: string;
  lastSeen: string;
}

export interface Technology {
  id: string;
  assetId: string;
  name: string;
  category: string;
  version?: string;
  confidence: number;
  icon?: string;
  firstSeen: string;
  lastSeen: string;
}

export interface DnsRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SOA' | 'PTR';
  name: string;
  value: string;
  ttl?: number;
}

export interface HttpMetadata {
  statusCode: number;
  statusText: string;
  title?: string;
  server?: string;
  poweredBy?: string;
  contentType?: string;
  contentLength?: number;
  redirectUrl?: string;
  headers: Record<string, string>;
  securityHeaders: {
    hsts: boolean;
    csp: boolean;
    xFrameOptions: boolean;
    xContentTypeOptions: boolean;
    referrerPolicy: boolean;
    permissionsPolicy: boolean;
  };
}

export interface TlsMetadata {
  valid: boolean;
  issuer?: string;
  subject?: string;
  validFrom?: string;
  validTo?: string;
  daysRemaining?: number;
  grade?: 'A+' | 'A' | 'B' | 'C' | 'F' | 'EXPIRED';
  protocol?: string;
  cipher?: string;
  altNames?: string[];
}

export interface Asset {
  id: string;
  targetId: string;
  scanId?: string;
  hostname: string;
  assetType: AssetType;
  status: AssetStatus;
  primaryIp?: string;
  riskScore: number;
  riskLevel: 'LOW' | 'GUARDED' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  httpStatus?: number;
  title?: string;
  webServer?: string;
  sslGrade?: string;
  sslExpiryDays?: number;
  firstSeen: string;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
  ipAddresses?: IPAddress[];
  services?: Service[];
  technologies?: Technology[];
  dnsRecords?: DnsRecord[];
  httpMetadata?: HttpMetadata;
  tlsMetadata?: TlsMetadata;
  findings?: Finding[];
}

export interface FindingEvidence {
  id: string;
  findingId: string;
  rawData?: string;
  requestPayload?: string;
  responseHeaders?: string;
  proofSnippet: string;
  createdAt: string;
}

export interface Finding {
  id: string;
  targetId: string;
  targetDomain: string;
  assetId: string;
  assetHostname: string;
  scanId?: string;
  title: string;
  description: string;
  severity: Severity;
  category: FindingCategory;
  cve?: string;
  cvssScore?: number;
  evidence: string;
  recommendation: string;
  remediationEffort: 'LOW' | 'MEDIUM' | 'HIGH';
  status: FindingStatus;
  firstSeen: string;
  lastSeen: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  evidenceSnippets?: FindingEvidence[];
}

export interface HistoricalChange {
  id: string;
  targetId: string;
  targetDomain: string;
  scanId?: string;
  changeType: ChangeType;
  title: string;
  description: string;
  severity: Severity;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'SCAN_COMPLETE' | 'CRITICAL_FINDING' | 'NEW_ASSET' | 'SCAN_FAILED';
  title: string;
  message: string;
  severity: Severity;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface RiskScoreBreakdown {
  score: number;
  level: 'LOW' | 'GUARDED' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  contributors: {
    label: string;
    points: number;
    description: string;
  }[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  exposedServicesCount: number;
  unresolvedCount: number;
}

// Attack Surface Graph Types
export interface GraphNode {
  id: string;
  label: string;
  type: 'DOMAIN' | 'SUBDOMAIN' | 'IP' | 'SERVICE' | 'TECH' | 'FINDING';
  severity?: Severity;
  riskScore?: number;
  status?: string;
  metadata?: Record<string, any>;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  type: 'CONTAINS' | 'RESOLVES_TO' | 'EXPOSES' | 'RUNS' | 'HAS_FINDING';
  isHighRisk?: boolean;
}

export interface AttackSurfaceGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface DashboardStats {
  totalAssets: number;
  liveHosts: number;
  openServices: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  infoFindings: number;
  overallRiskScore: number;
  overallRiskLevel: 'LOW' | 'GUARDED' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  lastScanTime?: string;
  totalTargets: number;
  severityDistribution: { severity: Severity; count: number; color: string }[];
  portDistribution: { port: number; service: string; count: number }[];
  technologyDistribution: { name: string; count: number; category: string }[];
  assetsOverTime: { date: string; totalAssets: number; liveHosts: number; findings: number }[];
  recentScans: Scan[];
  recentFindings: Finding[];
  recentlyDiscoveredAssets: Asset[];
}

export interface ReconModule {
  name: string;
  category: string;
  description: string;
  run(target: Target, options?: any): Promise<any>;
}

export interface EndpointParameter {
  name: string;
  type: 'QUERY' | 'BODY' | 'HEADER' | 'PATH' | 'COOKIE';
  exampleValue?: string;
  category: 'ID' | 'AUTH_TOKEN' | 'SEARCH_QUERY' | 'REDIRECT_URL' | 'FILE_PATH' | 'DATA_FILTER' | 'DEBUG_FLAG' | 'GENERIC';
  riskNote?: string;
  isSensitive?: boolean;
}

export interface DiscoveredEndpoint {
  id: string;
  targetId: string;
  assetId?: string;
  hostname: string;
  url: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
  isApi: boolean;
  apiType?: 'REST' | 'GRAPHQL' | 'SWAGGER_DOC' | 'OAUTH' | 'WEBHOOK' | 'STANDARD_HTTP';
  statusCode?: number;
  hasParameters: boolean;
  parameters: EndpointParameter[];
  parameterCount: number;
  tags: string[];
  firstDiscovered: string;
}

export interface HttpTrafficItem {
  id: string;
  targetId?: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'PATCH';
  url: string;
  host: string;
  path: string;
  statusCode: number;
  statusText?: string;
  latencyMs: number;
  bodySize: number;
  requestHeaders: Record<string, string>;
  requestBody?: string;
  responseHeaders: Record<string, string>;
  responseBody?: string;
  source: 'RECON_PROBE' | 'MANUAL_REPEATER' | 'PROXY_LOG' | 'ENDPOINT_DISCOVERY';
}

