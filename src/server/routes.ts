// src/server/routes.ts
// Express API Router for SentinelScope ASM Platform

import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { scannerEngine } from './scanner/scannerEngine';
import { calculateRiskScore } from './scanner/riskScoring';
import { processAviQuery } from './aviEngine';

export const apiRouter = Router();

// Environment-configured Admin Credentials (Bcrypt hashed, cost 12)
// Default hash is for password: "lizki123"
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'lizki.linux@gmail.com').trim().toLowerCase();
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'lizki').trim().toLowerCase();
const ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH || '$2b$12$o/Pjry7eZva5L8ZUMNIpJuYVJ4cbU2GXMhOzuGaSd5uQyCRdY.rNO';

// In-memory active session token store with expiration (24h default)
export interface SessionData {
  userId: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'ANALYST' | 'AUDITOR' | 'VIEWER';
  createdAt: number;
  expiresAt: number;
}
const activeSessions = new Map<string, SessionData>();

// Rate limit helper for general API traffic
const requestTimestamps: Map<string, number[]> = new Map();
function checkRateLimit(ip: string, limit = 5000, windowMs = 60000): boolean {
  const now = Date.now();
  const times = (requestTimestamps.get(ip) || []).filter((t) => now - t < windowMs);
  if (times.length >= limit) return false;
  times.push(now);
  requestTimestamps.set(ip, times);
  return true;
}

// Dedicated Rate Limiting & Brute-Force Perimeter Defense
interface LoginAttemptRecord {
  count: number;
  lockedUntil: number;
  lastAttempt: number;
}
const loginAttempts: Map<string, LoginAttemptRecord> = new Map();
const registrationAttempts: Map<string, number[]> = new Map();
const MAX_LOGIN_FAILURES = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15-minute lockout

function checkLoginRateLimitKey(key: string): { allowed: boolean; waitSeconds?: number; count?: number } {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record) return { allowed: true, count: 0 };

  if (record.lockedUntil > now) {
    const waitSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, waitSeconds, count: record.count };
  }

  // Reset if lockout period passed
  if (record.lockedUntil > 0 && record.lockedUntil <= now) {
    loginAttempts.delete(key);
    return { allowed: true, count: 0 };
  }

  return { allowed: true, count: record.count };
}

function recordLoginFailure(ip: string, identifier?: string): number {
  const now = Date.now();
  const keys = [`ip:${ip}`];
  if (identifier) keys.push(`user:${identifier.trim().toLowerCase()}`);

  let highestCount = 1;

  for (const key of keys) {
    const record = loginAttempts.get(key) || { count: 0, lockedUntil: 0, lastAttempt: now };
    record.count += 1;
    record.lastAttempt = now;
    if (record.count >= MAX_LOGIN_FAILURES) {
      record.lockedUntil = now + LOGIN_LOCKOUT_MS;
    }
    loginAttempts.set(key, record);
    if (record.count > highestCount) highestCount = record.count;
  }

  return highestCount;
}

function recordLoginSuccess(ip: string, identifier?: string): void {
  loginAttempts.delete(`ip:${ip}`);
  if (identifier) {
    loginAttempts.delete(`user:${identifier.trim().toLowerCase()}`);
  }
}

function getProgressiveDelay(failCount: number): number {
  if (failCount >= 4) return 2000;
  if (failCount >= 3) return 1200;
  if (failCount >= 2) return 600;
  return 0;
}

function checkRegistrationRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const times = (registrationAttempts.get(ip) || []).filter((t) => now - t < windowMs);
  if (times.length >= 4) return false;
  times.push(now);
  registrationAttempts.set(ip, times);
  return true;
}

// Middleware for validation & general rate limiting
apiRouter.use((req, res, next) => {
  const ip = req.ip || '127.0.0.1';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment.' });
  }
  next();
});

// Strict Authentication Verification Middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const session = activeSessions.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Session invalid or terminated. Please log in.' });
  }

  // Session expiration check
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }

  (req as any).session = session;
  next();
}

// Strict Admin Authorization Middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    const session = (req as any).session as SessionData;
    if (!session || session.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Administrative privilege required for this action.' });
    }
    next();
  });
}

// ----------------------------------------------------
// AUTHENTICATION ROUTES (Multi-User & Admin)
// ----------------------------------------------------

// User Registration (with bcrypt cost 12 hashing)
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  const ip = req.ip || '127.0.0.1';

  // Anti-bot registration flooding protection
  if (!checkRegistrationRateLimit(ip)) {
    return res.status(429).json({
      error: 'Registration rate limit reached for your network. Please wait a few minutes before registering another account.',
    });
  }

  const { name, email, password } = req.body || {};

  // Input Validation
  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (cleanName.length < 2 || cleanName.length > 60) {
    return res.status(400).json({ error: 'Name must be between 2 and 60 characters.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail) || cleanEmail.length > 120) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  if (password.length < 6 || password.length > 128) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  // Disallow registering with reserved admin email
  if (cleanEmail === ADMIN_EMAIL || cleanEmail === 'lizki') {
    return res.status(409).json({ error: 'This email is reserved. Please log in or use another email.' });
  }

  // Check if user already exists
  const existing = db.getUserByEmail(cleanEmail);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
  }

  try {
    // Modern password hashing using bcrypt with 12 salt rounds
    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = db.createUser(cleanEmail, cleanName, passwordHash, 'ANALYST');

    // Audit log registration (zero password disclosure)
    db.logAuditEvent({
      userId: newUser.id,
      userName: newUser.name,
      userEmail: newUser.email,
      ipAddress: ip,
      action: 'REGISTRATION',
      status: 'SUCCESS',
      userAgent: req.headers['user-agent'],
      details: 'Self-service account registered',
    });

    // Create secure session
    const sessionToken = `sec_token_${crypto.randomBytes(32).toString('hex')}`;
    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours

    activeSessions.set(sessionToken, {
      userId: newUser.id,
      username: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: now,
      expiresAt,
    });

    return res.status(201).json({
      user: newUser,
      token: sessionToken,
      expiresIn: '24h',
      redirect: 'dashboard',
      message: 'Account created successfully! Welcome to SentinelScope.',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Registration failed due to a server error. Please try again.' });
  }
});

// User & Admin Login
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const ip = req.ip || '127.0.0.1';
  const { username, email, password } = req.body || {};
  const userIdentifier = typeof username === 'string' ? username.trim().toLowerCase() : (typeof email === 'string' ? email.trim().toLowerCase() : '');
  const candidatePassword = typeof password === 'string' ? password : '';

  // Dual brute force lockout check (IP level + Account level)
  const ipCheck = checkLoginRateLimitKey(`ip:${ip}`);
  if (!ipCheck.allowed) {
    return res.status(429).json({
      error: `Security Lockout: Too many failed login attempts from your network. Locked for ${ipCheck.waitSeconds}s.`,
    });
  }

  if (userIdentifier) {
    const userCheck = checkLoginRateLimitKey(`user:${userIdentifier}`);
    if (!userCheck.allowed) {
      return res.status(429).json({
        error: `Security Lockout: Account temporarily locked due to multiple failed attempts. Try again in ${userCheck.waitSeconds}s.`,
      });
    }
  }

  // Input validation
  if (!userIdentifier || !candidatePassword) {
    return res.status(400).json({ error: 'Email/Username and password are required' });
  }

  if (userIdentifier.length > 120 || candidatePassword.length > 256) {
    return res.status(400).json({ error: 'Invalid input length' });
  }

  // 1. Check Administrator credentials (lizki.linux@gmail.com / lizki)
  const isAdminIdentifier = userIdentifier === ADMIN_EMAIL || userIdentifier === ADMIN_USERNAME;
  if (isAdminIdentifier) {
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(candidatePassword, ADMIN_PASSWORD_HASH);
    } catch {
      isPasswordValid = false;
    }

    if (isPasswordValid) {
      recordLoginSuccess(ip, userIdentifier);

      const adminUser = {
        id: 'usr_sec_admin_lizki',
        email: ADMIN_EMAIL,
        name: 'lizki',
        role: 'ADMIN' as const,
        createdAt: '2026-01-15T08:00:00.000Z',
      };

      const sessionToken = `sec_token_${crypto.randomBytes(32).toString('hex')}`;
      const now = Date.now();
      const expiresAt = now + 24 * 60 * 60 * 1000;

      activeSessions.set(sessionToken, {
        userId: adminUser.id,
        username: adminUser.name,
        email: adminUser.email,
        role: 'ADMIN',
        createdAt: now,
        expiresAt,
      });

      // Audit log admin login
      db.logAuditEvent({
        userId: adminUser.id,
        userName: adminUser.name,
        userEmail: adminUser.email,
        ipAddress: ip,
        action: 'LOGIN_SUCCESS',
        status: 'SUCCESS',
        userAgent: req.headers['user-agent'],
        details: 'Admin console access authorized',
      });

      return res.json({
        user: adminUser,
        token: sessionToken,
        expiresIn: '24h',
        redirect: 'admin-panel',
        message: 'Admin authorization successful',
      });
    }
  }

  // 2. Check Standard Registered Users from database
  const user = db.getUserByEmail(userIdentifier);
  if (user) {
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(candidatePassword, user.passwordHash);
    } catch {
      isPasswordValid = false;
    }

    if (isPasswordValid) {
      recordLoginSuccess(ip, userIdentifier);
      db.updateLastLogin(user.id);

      const safeUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: new Date().toISOString(),
      };

      const sessionToken = `sec_token_${crypto.randomBytes(32).toString('hex')}`;
      const now = Date.now();
      const expiresAt = now + 24 * 60 * 60 * 1000;

      activeSessions.set(sessionToken, {
        userId: user.id,
        username: user.name,
        email: user.email,
        role: user.role,
        createdAt: now,
        expiresAt,
      });

      // Audit log user login
      db.logAuditEvent({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        ipAddress: ip,
        action: 'LOGIN_SUCCESS',
        status: 'SUCCESS',
        userAgent: req.headers['user-agent'],
        details: 'User authenticated successfully',
      });

      return res.json({
        user: safeUser,
        token: sessionToken,
        expiresIn: '24h',
        redirect: 'dashboard',
        message: 'Welcome back, ' + safeUser.name,
      });
    }
  }

  // Authentication failed: Record attempt for rate limiting & apply progressive throttling delay
  const failCount = recordLoginFailure(ip, userIdentifier);
  const throttleDelay = getProgressiveDelay(failCount);
  if (throttleDelay > 0) {
    await new Promise((resolve) => setTimeout(resolve, throttleDelay));
  }

  // Audit log failed attempt (NEVER log password!)
  db.logAuditEvent({
    userName: userIdentifier,
    userEmail: userIdentifier,
    ipAddress: ip,
    action: 'LOGIN_FAILURE',
    status: 'FAILURE',
    userAgent: req.headers['user-agent'],
    details: `Failed authentication attempt (attempt #${failCount})`,
  });

  // Generic error message: NEVER expose whether email exists or specific credential mismatch
  return res.status(401).json({
    error: 'Invalid credentials. Access denied.',
  });
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  if (token) {
    const session = activeSessions.get(token);
    if (session) {
      db.logAuditEvent({
        userId: session.userId,
        userName: session.username,
        userEmail: session.email,
        ipAddress: req.ip || '127.0.0.1',
        action: 'LOGOUT',
        status: 'SUCCESS',
        userAgent: req.headers['user-agent'],
        details: 'User logged out',
      });
    }
    activeSessions.delete(token);
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

apiRouter.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  const session = (req as any).session as SessionData;
  if (session.userId === 'usr_sec_admin_lizki') {
    return res.json({
      user: {
        id: 'usr_sec_admin_lizki',
        email: ADMIN_EMAIL,
        name: 'lizki',
        role: 'ADMIN',
        createdAt: '2026-01-15T08:00:00.000Z',
      },
    });
  }

  const storedUser = db.getUser(session.userId);
  if (storedUser) {
    const { passwordHash: _, ...safeUser } = storedUser;
    return res.json({ user: safeUser });
  }

  return res.json({
    user: {
      id: session.userId,
      email: session.email,
      name: session.username,
      role: session.role,
      createdAt: new Date(session.createdAt).toISOString(),
    },
  });
});

// ----------------------------------------------------
// ADMIN ONLY ROUTES (User Management & Security Audit Logs)
// ----------------------------------------------------
apiRouter.get('/admin/users', requireAdmin, (req: Request, res: Response) => {
  const users = db.getAllUsers();
  return res.json({ users });
});

apiRouter.get('/admin/audit-logs', requireAdmin, (req: Request, res: Response) => {
  const logs = db.getAuditLogs();
  return res.json({ logs });
});

// Delete a single audit log entry
apiRouter.delete('/admin/audit-logs/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteAuditLog(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Audit log entry not found' });
  }
  return res.json({ success: true, message: 'Audit log deleted successfully' });
});

// Purge / Clear all audit log entries
apiRouter.delete('/admin/audit-logs', requireAdmin, (req: Request, res: Response) => {
  db.clearAuditLogs();
  return res.json({ success: true, message: 'All audit logs cleared successfully' });
});

// Brute force perimeter status & management
apiRouter.get('/admin/security-perimeter', requireAdmin, (req: Request, res: Response) => {
  const now = Date.now();
  const activeLockouts: Array<{ target: string; type: 'IP' | 'ACCOUNT'; remainingSeconds: number; failureCount: number }> = [];

  for (const [key, rec] of loginAttempts.entries()) {
    if (rec.lockedUntil > now) {
      activeLockouts.push({
        target: key.startsWith('ip:') ? key.replace('ip:', '') : key.replace('user:', ''),
        type: key.startsWith('ip:') ? 'IP' : 'ACCOUNT',
        remainingSeconds: Math.ceil((rec.lockedUntil - now) / 1000),
        failureCount: rec.count,
      });
    }
  }

  return res.json({
    status: 'SHIELD_ACTIVE',
    lockoutThreshold: MAX_LOGIN_FAILURES,
    lockoutDurationMinutes: 15,
    activeLockouts,
    totalTrackedEntities: loginAttempts.size,
    protectionFeatures: [
      'Bcrypt Cost 12 Password Hashing',
      'Dual IP & Account Lockout Thresholds (5 failures / 15m lock)',
      'Progressive Artificial Delay Injection (Throttling)',
      'Registration Anti-Flooding Perimeter',
      'Zero-Credential Audit Logging',
    ],
  });
});

// Admin manual unlock for IP or Account
apiRouter.post('/admin/security-perimeter/unlock', requireAdmin, (req: Request, res: Response) => {
  const { target } = req.body || {};
  if (!target || typeof target !== 'string') {
    return res.status(400).json({ error: 'Target IP or Account identifier required' });
  }

  const cleanTarget = target.trim();
  loginAttempts.delete(`ip:${cleanTarget}`);
  loginAttempts.delete(`user:${cleanTarget.toLowerCase()}`);
  loginAttempts.delete(cleanTarget);

  return res.json({ success: true, message: `Security lock lifted for ${cleanTarget}` });
});

// ----------------------------------------------------
// ENDPOINTS & PARAMETER DISCOVERY ROUTES
// ----------------------------------------------------
apiRouter.get('/endpoints', requireAuth, (req: Request, res: Response) => {
  const targetId = req.query.targetId as string | undefined;
  const isApi = req.query.isApi as string | undefined;
  const hasParams = req.query.hasParameters as string | undefined;
  
  let endpoints = db.getEndpoints(targetId);
  
  if (isApi === 'true') {
    endpoints = endpoints.filter((e) => e.isApi);
  }
  if (hasParams === 'true') {
    endpoints = endpoints.filter((e) => e.hasParameters);
  }
  
  return res.json(endpoints);
});

// ----------------------------------------------------
// HTTP TRAFFIC & PROXY LOGS
// ----------------------------------------------------
apiRouter.get('/traffic', requireAuth, (req: Request, res: Response) => {
  const targetId = req.query.targetId as string | undefined;
  const logs = db.getTrafficLogs(targetId);
  return res.json(logs);
});

apiRouter.post('/traffic', requireAuth, (req: Request, res: Response) => {
  const trafficItem = req.body;
  if (!trafficItem || !trafficItem.url) {
    return res.status(400).json({ error: 'Traffic item with URL is required' });
  }
  const item = {
    id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString(),
    ...trafficItem,
  };
  db.addTrafficLog(item);
  return res.status(201).json(item);
});

apiRouter.delete('/traffic', requireAuth, (req: Request, res: Response) => {
  db.clearTrafficLogs();
  return res.json({ success: true, message: 'Traffic history cleared' });
});

// ----------------------------------------------------
// HTTP SECURITY REPEATER & PROBE ROUTE
// ----------------------------------------------------
apiRouter.post('/probe/repeater', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      url,
      method = 'GET',
      headers = {},
      body = '',
      targetId,
    } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Target URL is required' });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // SSRF Prevention: Block cloud metadata and dangerous internal addresses
    const hostname = parsedUrl.hostname.toLowerCase();
    const blockedHosts = [
      '169.254.169.254',
      'metadata.google.internal',
      'metadata.goog',
      'metadata',
      'instance-data',
    ];
    if (blockedHosts.includes(hostname) || parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.status(403).json({ error: 'Security Policy: Access to internal cloud metadata and non-HTTP protocols is restricted.' });
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH'];
    const sanitizedMethod = allowedMethods.includes(method.toUpperCase())
      ? method.toUpperCase()
      : 'GET';

    const reqHeaders: Record<string, string> = {
      'User-Agent': 'SentinelScope-ReconProbe/2.4 (Security-Audit-Authorized)',
      Accept: '*/*',
      ...headers,
    };

    // Remove host header override to avoid Node fetch errors
    delete reqHeaders['Host'];
    delete reqHeaders['host'];

    const fetchOptions: RequestInit = {
      method: sanitizedMethod,
      headers: reqHeaders,
      signal: controller.signal,
      redirect: 'manual',
    };

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(sanitizedMethod) && body) {
      fetchOptions.body = body;
    }

    let response: globalThis.Response;
    try {
      response = await fetch(parsedUrl.toString(), fetchOptions);
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;
      
      // Log to traffic history
      db.addTrafficLog({
        id: `probe_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        targetId,
        timestamp: new Date().toLocaleTimeString(),
        method: sanitizedMethod as any,
        url: parsedUrl.toString(),
        host: parsedUrl.host,
        path: parsedUrl.pathname + parsedUrl.search,
        statusCode: 0,
        statusText: fetchErr.name === 'AbortError' ? 'Timeout' : 'Network Error',
        latencyMs,
        bodySize: 0,
        requestHeaders: reqHeaders,
        requestBody: body || undefined,
        responseHeaders: {},
        responseBody: fetchErr.message,
        source: 'MANUAL_REPEATER',
      });

      return res.json({
        success: false,
        error: fetchErr.name === 'AbortError' ? 'Request timed out after 12s' : fetchErr.message,
        url: parsedUrl.toString(),
        method: sanitizedMethod,
        latencyMs,
        response: null,
      });
    }

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key.toLowerCase()] = value;
    });

    let responseBodyText = '';
    try {
      responseBodyText = await response.text();
    } catch {
      responseBodyText = '[Binary or Unreadable Data]';
    }

    // Log to traffic history
    db.addTrafficLog({
      id: `probe_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      targetId,
      timestamp: new Date().toLocaleTimeString(),
      method: sanitizedMethod as any,
      url: parsedUrl.toString(),
      host: parsedUrl.host,
      path: parsedUrl.pathname + parsedUrl.search,
      statusCode: response.status,
      statusText: response.statusText,
      latencyMs,
      bodySize: Buffer.byteLength(responseBodyText, 'utf8'),
      requestHeaders: reqHeaders,
      requestBody: body || undefined,
      responseHeaders: responseHeaders,
      responseBody: responseBodyText.substring(0, 50000),
      source: 'MANUAL_REPEATER',
    });

    // Perform security header audit on the response
    const secAudit = {
      hasHsts: !!responseHeaders['strict-transport-security'],
      hstsValue: responseHeaders['strict-transport-security'] || 'Missing',
      hasCsp: !!responseHeaders['content-security-policy'],
      cspValue: responseHeaders['content-security-policy'] || 'Missing',
      hasXContentTypeOptions: responseHeaders['x-content-type-options'] === 'nosniff',
      hasXFrameOptions: !!responseHeaders['x-frame-options'],
      xFrameOptionsValue: responseHeaders['x-frame-options'] || 'Missing',
      hasReferrerPolicy: !!responseHeaders['referrer-policy'],
      referrerPolicyValue: responseHeaders['referrer-policy'] || 'Missing',
      hasPermissionsPolicy: !!responseHeaders['permissions-policy'],
      corsHeader: responseHeaders['access-control-allow-origin'] || 'Not set',
      serverBanner: responseHeaders['server'] || null,
      xPoweredBy: responseHeaders['x-powered-by'] || null,
      cookies: responseHeaders['set-cookie'] || null,
    };

    return res.json({
      success: true,
      url: parsedUrl.toString(),
      method: sanitizedMethod,
      statusCode: response.status,
      statusText: response.statusText,
      latencyMs,
      headers: responseHeaders,
      body: responseBodyText.substring(0, 100000), // Cap at 100KB for preview safety
      bodySize: Buffer.byteLength(responseBodyText, 'utf8'),
      securityAudit: secAudit,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Repeater execution failed' });
  }
});

// ----------------------------------------------------
// TARGETS ROUTES
// ----------------------------------------------------
apiRouter.get('/targets', requireAuth, (req: Request, res: Response) => {
  const session = (req as any).session as SessionData | undefined;
  // Multi-tenancy isolation: users (and admin) only see their own targets in their inventory
  const targets = db.getTargets(session?.userId);
  return res.json(targets);
});

apiRouter.get('/targets/:id', requireAuth, (req: Request, res: Response) => {
  const session = (req as any).session as SessionData | undefined;
  const target = db.getTargetById(req.params.id);
  if (!target) return res.status(404).json({ error: 'Target not found' });
  // Isolation: verify target ownership (unless admin)
  if (target.userId && session?.userId && target.userId !== session.userId && session?.role !== 'ADMIN') {
    return res.status(404).json({ error: 'Target not found' });
  }
  return res.json(target);
});

apiRouter.post('/targets', requireAuth, (req: Request, res: Response) => {
  const { domain, authorizedBy, isConfirmed, tags, notes } = req.body;

  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ error: 'Target domain is required' });
  }

  // Strict scope authorization requirement check
  if (!isConfirmed) {
    return res.status(403).json({
      error: 'Scope confirmation required: You must explicitly confirm ownership or written authorization to scan this domain.',
    });
  }

  // Domain format validation (prevent command injection / invalid format)
  const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!domainRegex.test(cleanDomain)) {
    return res.status(400).json({ error: 'Invalid domain name format. e.g. example.com' });
  }

  const existing = db.getTargetByDomain(cleanDomain);
  if (existing) {
    return res.status(409).json({ error: 'Target domain is already configured in scope inventory.' });
  }

  const session = (req as any).session as SessionData | undefined;
  const defaultAuthorizer = session?.username || session?.email || 'Security Analyst';
  const resolvedAuthorizer = (typeof authorizedBy === 'string' && authorizedBy.trim())
    ? authorizedBy.trim()
    : defaultAuthorizer;

  const target = db.addTarget(cleanDomain, resolvedAuthorizer, tags || [], notes, session?.userId);

  // Record audit log entry including target domain
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
  db.logAuditEvent({
    userId: session?.userId,
    userName: session?.username || 'Analyst',
    userEmail: session?.email || '',
    ipAddress: clientIp,
    action: 'TARGET_CREATE',
    status: 'SUCCESS',
    targetDomain: cleanDomain,
    details: `Added target scope ${cleanDomain} (Authorized by: ${resolvedAuthorizer})`,
  });

  // Automatically queue an initial passive recon scan
  const scan = db.createScan(target.id, 'FULL_RECON');
  scannerEngine.startScan(scan.id);

  return res.status(201).json({ target, scan });
});

apiRouter.delete('/targets/:id', requireAuth, (req: Request, res: Response) => {
  const session = (req as any).session as SessionData | undefined;
  const target = db.getTargetById(req.params.id);
  if (!target) return res.status(404).json({ error: 'Target not found' });

  // Ownership verification: users can only delete their own targets
  if (target.userId && session?.userId && target.userId !== session.userId && session?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized to delete this target' });
  }

  const ok = db.deleteTarget(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Target not found' });

  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
  db.logAuditEvent({
    userId: session?.userId,
    userName: session?.username || 'Analyst',
    userEmail: session?.email || '',
    ipAddress: clientIp,
    action: 'TARGET_DELETE',
    status: 'SUCCESS',
    targetDomain: target.domain,
    details: `Removed target scope ${target.domain}`,
  });

  return res.json({ success: true, message: 'Target and all associated assets, findings, scans, and demo records purged.' });
});

apiRouter.post('/targets/purge-all', requireAuth, (req: Request, res: Response) => {
  const session = (req as any).session as SessionData | undefined;
  const userTargets = db.getTargets(session?.userId);
  for (const t of userTargets) {
    db.deleteTarget(t.id);
  }
  return res.json({ success: true, message: 'Your configured target scopes have been cleared.' });
});

apiRouter.patch('/targets/:id', requireAuth, (req: Request, res: Response) => {
  const session = (req as any).session as SessionData | undefined;
  const target = db.getTargetById(req.params.id);
  if (!target) return res.status(404).json({ error: 'Target not found' });
  if (target.userId && session?.userId && target.userId !== session.userId && session?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized to modify this target' });
  }

  const updated = db.updateTarget(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Target not found' });
  return res.json(updated);
});

// ----------------------------------------------------
// SCANS & JOB QUEUE ROUTES
// ----------------------------------------------------
apiRouter.get('/scans', requireAuth, (req: Request, res: Response) => {
  const session = (req as any).session as SessionData | undefined;
  const targetId = req.query.targetId as string | undefined;
  const userTargetIds = new Set(db.getTargets(session?.userId).map((t) => t.id));

  let scans = targetId ? db.getScansByTargetId(targetId) : db.getScans();
  scans = scans.filter((s) => userTargetIds.has(s.targetId));
  return res.json(scans);
});

apiRouter.get('/scans/:id', requireAuth, (req: Request, res: Response) => {
  const session = (req as any).session as SessionData | undefined;
  const scan = db.getScanById(req.params.id);
  if (!scan) return res.status(404).json({ error: 'Scan not found' });
  const userTargetIds = new Set(db.getTargets(session?.userId).map((t) => t.id));
  if (!userTargetIds.has(scan.targetId) && session?.role !== 'ADMIN') {
    return res.status(404).json({ error: 'Scan not found' });
  }
  return res.json(scan);
});

apiRouter.post('/targets/:id/scans', requireAuth, (req: Request, res: Response) => {
  const session = (req as any).session as SessionData | undefined;
  const target = db.getTargetById(req.params.id);
  if (!target) return res.status(404).json({ error: 'Target not found' });
  const userTargetIds = new Set(db.getTargets(session?.userId).map((t) => t.id));
  if (!userTargetIds.has(target.id) && session?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized to scan this target' });
  }

  const { scanType = 'FULL_RECON' } = req.body;
  const scan = db.createScan(target.id, scanType);

  // Trigger scanning pipeline in background worker
  scannerEngine.startScan(scan.id);

  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
  db.logAuditEvent({
    userId: session?.userId,
    userName: session?.username || 'Analyst',
    userEmail: session?.email || '',
    ipAddress: clientIp,
    action: 'SCAN_INITIATE',
    status: 'SUCCESS',
    targetDomain: target.domain,
    details: `Triggered ${scanType} scan for target ${target.domain}`,
  });

  return res.status(202).json(scan);
});

// ----------------------------------------------------
// ASSETS ROUTES
// ----------------------------------------------------
apiRouter.get('/assets', requireAuth, (req: Request, res: Response) => {
  const session = (req as any).session as SessionData | undefined;
  const targetId = req.query.targetId as string | undefined;
  const userTargetIds = new Set(db.getTargets(session?.userId).map((t) => t.id));

  let assets = targetId ? db.getAssetsByTargetId(targetId) : db.getAssets();
  assets = assets.filter((a) => userTargetIds.has(a.targetId));
  return res.json(assets);
});

apiRouter.get('/assets/:id', requireAuth, (req: Request, res: Response) => {
  const asset = db.getAssetById(req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });
  return res.json(asset);
});

// ----------------------------------------------------
// FINDINGS ROUTES
// ----------------------------------------------------
apiRouter.get('/findings', requireAuth, (req: Request, res: Response) => {
  const session = (req as any).session as SessionData | undefined;
  const targetId = req.query.targetId as string | undefined;
  const assetId = req.query.assetId as string | undefined;
  const severity = req.query.severity as string | undefined;
  const status = req.query.status as string | undefined;
  const userTargetIds = new Set(db.getTargets(session?.userId).map((t) => t.id));

  let findings = targetId
    ? db.getFindingsByTargetId(targetId)
    : assetId
    ? db.getFindingsByAssetId(assetId)
    : db.getFindings();

  findings = findings.filter((f) => userTargetIds.has(f.targetId));

  if (severity) {
    findings = findings.filter((f) => f.severity === severity);
  }
  if (status) {
    findings = findings.filter((f) => f.status === status);
  }

  return res.json(findings);
});

apiRouter.get('/findings/:id', requireAuth, (req: Request, res: Response) => {
  const finding = db.getFindingById(req.params.id);
  if (!finding) return res.status(404).json({ error: 'Finding not found' });
  return res.json(finding);
});

apiRouter.patch('/findings/:id', requireAuth, (req: Request, res: Response) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });

  const updated = db.updateFindingStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Finding not found' });

  // Recalculate target risk score
  const targetFindings = db.getFindingsByTargetId(updated.targetId);
  const targetAssets = db.getAssetsByTargetId(updated.targetId);
  const totalServices = targetAssets.reduce((sum, a) => sum + (a.services?.length || 0), 0);
  const risk = calculateRiskScore(targetFindings, totalServices);

  db.updateTarget(updated.targetId, {
    riskScore: risk.score,
    riskLevel: risk.level,
  });

  return res.json(updated);
});

// ----------------------------------------------------
// DASHBOARD STATS & ATTACK SURFACE GRAPH
// ----------------------------------------------------
apiRouter.get('/stats', requireAuth, (req: Request, res: Response) => {
  const targetId = req.query.targetId as string | undefined;
  const stats = db.getDashboardStats(targetId);
  return res.json(stats);
});

apiRouter.get('/graph', requireAuth, (req: Request, res: Response) => {
  const targetId = req.query.targetId as string | undefined;
  const graph = db.getAttackSurfaceGraph(targetId);
  return res.json(graph);
});

apiRouter.get('/changes', requireAuth, (req: Request, res: Response) => {
  const targetId = req.query.targetId as string | undefined;
  const changes = db.getChanges(targetId);
  return res.json(changes);
});

// ----------------------------------------------------
// NOTIFICATIONS
// ----------------------------------------------------
apiRouter.get('/notifications', requireAuth, (req: Request, res: Response) => {
  return res.json(db.getNotifications());
});

apiRouter.patch('/notifications/:id/read', requireAuth, (req: Request, res: Response) => {
  db.markNotificationAsRead(req.params.id);
  return res.json({ success: true });
});

apiRouter.post('/notifications/read-all', requireAuth, (req: Request, res: Response) => {
  db.markAllNotificationsAsRead();
  return res.json({ success: true });
});

// ----------------------------------------------------
// DEMO RESET & SEEDING
// ----------------------------------------------------
apiRouter.post('/demo/reset', requireAuth, (req: Request, res: Response) => {
  db.seedDemoData();
  return res.json({ success: true, message: 'Database reset to default Acme Corp demo dataset.' });
});

// ----------------------------------------------------
// REPORTS GENERATOR
// ----------------------------------------------------
apiRouter.get('/reports/:targetId', requireAuth, (req: Request, res: Response) => {
  const target = db.getTargetById(req.params.targetId);
  if (!target) return res.status(404).json({ error: 'Target not found' });

  const assets = db.getAssetsByTargetId(target.id);
  const findings = db.getFindingsByTargetId(target.id);
  const scans = db.getScansByTargetId(target.id);
  const totalServices = assets.reduce((sum, a) => sum + (a.services?.length || 0), 0);
  const riskBreakdown = calculateRiskScore(findings, totalServices);

  const report = {
    metadata: {
      reportId: `REP-${target.domain.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      generatedAt: new Date().toISOString(),
      targetDomain: target.domain,
      targetName: target.name || target.domain,
      authorizedBy: target.authorizedBy,
      scopeConfirmationDate: target.authorizedAt,
      platform: 'SentinelScope ASM Enterprise v2.4',
    },
    executiveSummary: {
      overallRiskScore: riskBreakdown.score,
      overallRiskLevel: riskBreakdown.level,
      totalAssetsDiscovered: assets.length,
      liveHosts: assets.filter((a) => a.status === 'LIVE').length,
      openServicesCount: totalServices,
      totalFindingsCount: findings.length,
      criticalFindings: riskBreakdown.criticalCount,
      highFindings: riskBreakdown.highCount,
      mediumFindings: riskBreakdown.mediumCount,
      lowFindings: riskBreakdown.lowCount,
      summaryParagraph: `SentinelScope automated reconnaissance discovered ${assets.length} exposed assets and ${totalServices} open network services associated with ${target.domain}. An overall risk score of ${riskBreakdown.score}/100 (${riskBreakdown.level}) was assigned based on ${riskBreakdown.criticalCount} Critical vulnerabilities and ${riskBreakdown.highCount} High severity exposure points requiring prioritized remediation.`,
    },
    riskBreakdown,
    criticalAndHighFindings: findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH'),
    allFindings: findings,
    assetInventory: assets,
    scansHistory: scans,
  };

  return res.json(report);
});

// ----------------------------------------------------
// AVI (AI VULNERABILITY INTELLIGENCE) TERMINAL ROUTES
// ----------------------------------------------------
apiRouter.post('/avi/chat', requireAuth, async (req: Request, res: Response) => {
  try {
    const { prompt, history } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt string is required' });
    }

    const result = await processAviQuery(prompt, Array.isArray(history) ? history : []);
    return res.json({
      success: true,
      text: result.text,
      source: result.source,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[AVI API] Error handling query:', err);
    return res.status(500).json({
      error: 'Failed to process AVI terminal query',
      details: err?.message || 'Unknown internal error',
    });
  }
});

apiRouter.get('/avi/status', (req: Request, res: Response) => {
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  return res.json({
    status: 'online',
    name: 'AVI',
    version: 'v3.8-NeuralSecurity',
    engine: 'Autonomous Security Intelligence Engine',
    hasKey: hasGeminiKey,
    capabilities: [
      '802.11 Wireless & Deauth Mechanics Analysis',
      'Protocol Vulnerability Deconstruction',
      'Burp & Repeater Tool Workflow Automation',
      'Intruder Fuzzing Wordlists & Strategy',
      'Cryptographic Analysis (AES, RSA, LSB Steganography)',
      'Attack Surface Management & Recon Architecture',
    ],
  });
});

